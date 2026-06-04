import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateControlCommand, handleUserQuery, generateShiftReport } from './agent.js';
import { initDb, saveReportToDb, loadReportsList, loadReportContent } from './db.js';
import { initMqttClient } from './mqttClient.js';
dotenv.config({ path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '.env') });

const app = express();
const PORT = process.env.RENDER ? (process.env.PORT || 10000) : 5050;

app.use(cors());
app.use(express.json());

// --- IN-MEMORY FACTORY SIMULATION STATE ---
const ZONE_NAMES = {
  ZoneA: "Zone A: 생산 라인",
  ZoneB: "Zone B: 자재 창고",
  ZoneC: "Zone C: 조립 구역",
  ZoneD: "Zone D: 검사 및 포장 구역"
};

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const reportsDir = path.resolve(__dirname, 'reports');
if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir, { recursive: true });
}

export let factoryState = {
  zones: {
    ZoneA: {
      name: ZONE_NAMES.ZoneA,
      workers: 3,
      density: "Normal", // Empty, Normal, Crowded
      lights: 90, // % brightness
      ventilation: 60, // % fan speed
      standbyPowerCut: false,
      temp: 22.4,
      humidity: 45.2,
      powerConsumption: 18.5, // current kW load
      basePower: 25.0, // baseline kW without AI
      hasHelmetViolation: false
    },
    ZoneB: {
      name: ZONE_NAMES.ZoneB,
      workers: 0,
      density: "Empty",
      lights: 20,
      ventilation: 10,
      standbyPowerCut: true,
      temp: 18.1,
      humidity: 50.8,
      powerConsumption: 2.1,
      basePower: 8.5,
      hasHelmetViolation: false
    },
    ZoneC: {
      name: ZONE_NAMES.ZoneC,
      workers: 1,
      density: "Normal",
      lights: 70,
      ventilation: 40,
      standbyPowerCut: false,
      temp: 21.8,
      humidity: 47.1,
      powerConsumption: 12.4,
      basePower: 16.0,
      hasHelmetViolation: false
    },
    ZoneD: {
      name: ZONE_NAMES.ZoneD,
      workers: 4,
      density: "Crowded",
      lights: 100,
      ventilation: 80,
      standbyPowerCut: false,
      temp: 23.5,
      humidity: 42.9,
      powerConsumption: 6.8,
      basePower: 7.5,
      hasHelmetViolation: false
    }
  },
  cumulativeSavingsKwh: 142.8,
  cumulativeSavingsCost: 21420, // ₩150 per kWh
  powerHistory: [],
  logs: [
    { timestamp: new Date(Date.now() - 3600000 * 2).toLocaleTimeString(), type: "system", zone: "ALL", message: "Aegis Factory 자율 운영 에이전트 가동 시작." },
    { timestamp: new Date(Date.now() - 3600000).toLocaleTimeString(), type: "ai", zone: "ZoneB", message: "Zone B 무인 감지: 조도 20% 자동 디밍 및 환기 속도 10% 감축. 대기전력 차단 장치 활성화." }
  ],
  alerts: [
    { id: 1, timestamp: new Date(Date.now() - 1800000).toLocaleTimeString(), zone: "ZoneD", level: "warning", message: "Zone D 구역의 작업 밀집도 초과 경보 (적정 인원: 3명, 현재: 4명)", broadcastVerified: false }
  ],
  isAiEnabled: true,
  equipmentRecommendations: {
    ZoneA: "생산 라인: 대형 팬 풍량 자동 제어 및 주 작업 공간 이외의 보조 전력 차단을 추천합니다.",
    ZoneB: "자재 창고: 무인 대기 상태이므로 조명 밝기를 20% 이하로 유지하고 대기전력을 스위칭하는 것이 최적입니다.",
    ZoneC: "조립 구역: 적정 밀집도 감지로 조도 70% 제어 및 스마트 콘센트를 통한 에너지 세이빙 가동을 추천합니다.",
    ZoneD: "검사 및 포장 구역: 작업 밀집도가 높아 보조 공조 장치 가동 및 메인 배기 팬 고속 운전(80% 이상)을 추천합니다."
  },
  kpis: {
    accuracy: 92.8,
    speed: 0.42,
    powerSavings: 24.5,
    responseTime: 33.5,
    detectionRate: 89.2
  },
  ticksSinceReset: 10
};

// Initialize 24-hour power history for charts
const initHistory = () => {
  const history = [];
  const now = new Date();
  for (let i = 24; i > 0; i--) {
    const time = new Date(now.getTime() - i * 3600000);
    const hourStr = `${String(time.getHours()).padStart(2, '0')}:00`;
    
    // Simulate typical industrial daily load pattern (high during day, low at night)
    const hour = time.getHours();
    let baselineLoad = 15; // base load
    if (hour >= 8 && hour <= 18) baselineLoad += 35 + Math.random() * 10; // active daytime
    else if (hour > 18 && hour <= 22) baselineLoad += 20 + Math.random() * 5; // evening shift
    else baselineLoad += Math.random() * 3; // night shift

    // Optimized power consumption is generally 20-30% lower
    const aiLoad = baselineLoad * (0.7 + Math.random() * 0.08);
    const savings = Math.max(0, baselineLoad - aiLoad);

    history.push({
      time: hourStr,
      baseline: parseFloat(baselineLoad.toFixed(1)),
      optimized: parseFloat(aiLoad.toFixed(1)),
      savings: parseFloat(savings.toFixed(1))
    });
  }
  factoryState.powerHistory = history;
};
initHistory();
initDb();
initMqttClient();

// Function to update KPIs dynamically
const updateLiveKpis = () => {
  if (!factoryState.kpis) {
    factoryState.kpis = {
      accuracy: 0,
      speed: 0,
      powerSavings: 0,
      responseTime: 0,
      detectionRate: 0
    };
  }

  // If in reset cooldown, keep them at 0
  if (factoryState.ticksSinceReset !== undefined && factoryState.ticksSinceReset < 1) {
    factoryState.ticksSinceReset++;
    return;
  }

  // 1. Accuracy: slightly fluctuates around 92-94%
  factoryState.kpis.accuracy = parseFloat((92.8 + (Math.random() - 0.5) * 1.5).toFixed(1));

  // 2. Speed: slightly fluctuates around 0.4 seconds
  factoryState.kpis.speed = parseFloat((0.42 + (Math.random() - 0.5) * 0.06).toFixed(2));

  // 3. Power savings: dynamically calculated from base power vs optimized power consumption
  let totalBase = 0;
  let totalOptimized = 0;
  Object.keys(factoryState.zones).forEach(zoneId => {
    totalBase += factoryState.zones[zoneId].basePower;
    totalOptimized += factoryState.zones[zoneId].powerConsumption;
  });
  const currentSavingsPct = totalBase > 0 ? ((totalBase - totalOptimized) / totalBase) * 100 : 0;
  // Apply a small smoothing/fluctuation to make it look active
  factoryState.kpis.powerSavings = parseFloat((currentSavingsPct + (Math.random() - 0.5) * 1.0).toFixed(1));
  // Keep it within a realistic bounds (20% - 30%)
  if (factoryState.kpis.powerSavings < 15) factoryState.kpis.powerSavings = 15;
  if (factoryState.kpis.powerSavings > 35) factoryState.kpis.powerSavings = 35;

  // 4. Response Time Reduction: influenced by admin broadcast warnings
  const totalAlerts = factoryState.alerts.length;
  const verifiedAlerts = factoryState.alerts.filter(a => a.broadcastVerified).length;
  if (totalAlerts > 0) {
    const verifiedRatio = verifiedAlerts / totalAlerts;
    factoryState.kpis.responseTime = parseFloat((18.0 + verifiedRatio * 18.0 + (Math.random() - 0.5) * 2.0).toFixed(1));
  } else {
    factoryState.kpis.responseTime = parseFloat((32.5 + (Math.random() - 0.5) * 1.5).toFixed(1));
  }

  // 5. Detection Rate: slightly fluctuates around 89-91%
  factoryState.kpis.detectionRate = parseFloat((89.5 + (Math.random() - 0.5) * 1.2).toFixed(1));
};

let reportCycleCounter = 0;

// Background simulation loop: slightly fluctuate values & recalculate power consumption
setInterval(() => {
  updateLiveKpis();
  // Minor sensor value fluctuation
  Object.keys(factoryState.zones).forEach(zoneId => {
    const zone = factoryState.zones[zoneId];
    zone.temp = parseFloat((zone.temp + (Math.random() - 0.5) * 0.2).toFixed(1));
    zone.humidity = parseFloat((zone.humidity + (Math.random() - 0.5) * 0.4).toFixed(1));
    
    // Periodically fluctuate helmet violation state (5% chance to toggle if workers > 0)
    if (zone.workers > 0) {
      if (Math.random() < 0.05) {
        zone.hasHelmetViolation = !zone.hasHelmetViolation;
        if (zone.hasHelmetViolation) {
          const msg = `[안전 위반] ${zone.name}에서 보호구(안전모) 미착용 작업자가 감지되었습니다! 즉시 현장 지도 및 경고 방송이 필요합니다.`;
          const exists = factoryState.alerts.some(a => a.message === msg);
          if (!exists) {
            factoryState.alerts.unshift({
              id: Date.now(),
              timestamp: new Date().toLocaleTimeString(),
              zone: zoneId,
              level: "danger",
              message: msg,
              broadcastVerified: false
            });
            factoryState.logs.push({
              timestamp: new Date().toLocaleTimeString(),
              type: "danger",
              zone: zoneId,
              message: `[위험 경고] ${msg}`
            });
          }
        }
      }
    } else {
      zone.hasHelmetViolation = false;
    }

    // Auto trigger crowded warning alert if workers count increases
    if (zone.workers >= 4) {
      const msg = `Zone ${zoneId.charAt(zoneId.length - 1)} 구역의 작업 밀집도 초과 경보 (적정 인원: 3명, 현재: ${zone.workers}명)`;
      const exists = factoryState.alerts.some(a => a.message === msg);
      if (!exists) {
        factoryState.alerts.unshift({
          id: Date.now(),
          timestamp: new Date().toLocaleTimeString(),
          zone: zoneId,
          level: "warning",
          message: msg,
          broadcastVerified: false
        });
        factoryState.logs.push({
          timestamp: new Date().toLocaleTimeString(),
          type: "danger",
          zone: zoneId,
          message: `[위험 경고] ${msg}`
        });
      }
    }

    // Calculate simulated live power based on current controls and workers
    let lightsPower = (zone.lights / 100) * (zoneId === 'ZoneA' ? 6.0 : zoneId === 'ZoneC' ? 4.0 : 2.5);
    let ventPower = (zone.ventilation / 100) * (zoneId === 'ZoneA' ? 8.0 : 4.0);
    let machineryPower = zone.workers > 0 ? (zoneId === 'ZoneA' ? 12.0 : zoneId === 'ZoneC' ? 6.0 : 1.0) : (zone.standbyPowerCut ? 0.1 : 1.5);
    
    zone.powerConsumption = parseFloat((lightsPower + ventPower + machineryPower).toFixed(1));
    
    // If AI is disabled, it resets to max standard outputs (no dimming, fans on medium-high)
    if (!factoryState.isAiEnabled) {
      zone.lights = 100;
      zone.ventilation = zone.workers > 0 ? 80 : 50;
      zone.standbyPowerCut = false;
    }
  });

  // Calculate real-time cumulative savings accumulation
  if (factoryState.isAiEnabled) {
    let totalBase = 0;
    let totalOptimized = 0;
    Object.keys(factoryState.zones).forEach(zoneId => {
      totalBase += factoryState.zones[zoneId].basePower;
      totalOptimized += factoryState.zones[zoneId].powerConsumption;
    });

    const diffKw = Math.max(0, totalBase - totalOptimized);
    const hourlyAddition = diffKw / 720; // 5 seconds interval -> 1/720 of an hour
    factoryState.cumulativeSavingsKwh = parseFloat((factoryState.cumulativeSavingsKwh + hourlyAddition).toFixed(3));
    factoryState.cumulativeSavingsCost = Math.round(factoryState.cumulativeSavingsKwh * 150);

    // Update the last history point or append
    const currentHourStr = `${String(new Date().getHours()).padStart(2, '0')}:00`;
    const lastPoint = factoryState.powerHistory[factoryState.powerHistory.length - 1];
    if (lastPoint && lastPoint.time === currentHourStr) {
      lastPoint.baseline = parseFloat(totalBase.toFixed(1));
      lastPoint.optimized = parseFloat(totalOptimized.toFixed(1));
      lastPoint.savings = parseFloat(diffKw.toFixed(1));
    } else {
      // Keep history array at length 24
      factoryState.powerHistory.shift();
      factoryState.powerHistory.push({
        time: currentHourStr,
        baseline: parseFloat(totalBase.toFixed(1)),
        optimized: parseFloat(totalOptimized.toFixed(1)),
        savings: parseFloat(diffKw.toFixed(1))
      });
    }
    // Automated operational report saving per user request
    reportCycleCounter++;
    if (reportCycleCounter >= 12) {
      reportCycleCounter = 0;
      autoGenerateReport();
    }
  }
}, 5000);

// --- HELPER FUNCTION TO RUN AI OPTIMIZATION ON DEMAND ---
async function runAiOptimization() {
  if (!factoryState.isAiEnabled) return;
  
  try {
    console.log("Running AI Agent Optimization...");
    const aiDecision = await generateControlCommand(factoryState);
    
    if (aiDecision && aiDecision.recommendations) {
      aiDecision.recommendations.forEach(rec => {
        const zone = factoryState.zones[rec.zoneId];
        if (zone) {
          // Apply AI actions
          zone.lights = rec.actions.lights;
          zone.ventilation = rec.actions.ventilation;
          zone.standbyPowerCut = rec.actions.standbyPowerCut;
          
          if (rec.equipmentRecommendation) {
            factoryState.equipmentRecommendations[rec.zoneId] = rec.equipmentRecommendation;
          }

          // Log the reasoning if there was a change in state
          const lastLog = factoryState.logs[factoryState.logs.length - 1];
          const newMsg = `[AI 자율제어] ${zone.name}: 조명 ${rec.actions.lights}%, 환기 ${rec.actions.ventilation}%, 대기전력 차단 ${rec.actions.standbyPowerCut ? "활성" : "해제"}. 사유: ${rec.reasoning}`;
          
          // Prevent duplicate logs of the exact same zone control
          if (!lastLog || lastLog.message !== newMsg) {
            factoryState.logs.push({
              timestamp: new Date().toLocaleTimeString(),
              type: "ai",
              zone: rec.zoneId,
              message: newMsg
            });
          }
        }
      });

      // Handle safety alerts generated by AI
      if (aiDecision.safetyAlert && aiDecision.safetyAlert.hasAlert) {
        const exists = factoryState.alerts.some(a => a.message === aiDecision.safetyAlert.message);
        if (!exists) {
          const newAlert = {
            id: Date.now(),
            timestamp: new Date().toLocaleTimeString(),
            zone: "MULTI",
            level: aiDecision.safetyAlert.level,
            message: aiDecision.safetyAlert.message,
            broadcastVerified: false
          };
          factoryState.alerts.unshift(newAlert);
          
          factoryState.logs.push({
            timestamp: new Date().toLocaleTimeString(),
            type: "danger",
            zone: "ALL",
            message: `[위험 경고] ${aiDecision.safetyAlert.message}`
          });
        }
      }

      // Keep logs list at a manageable size
      if (factoryState.logs.length > 50) {
        factoryState.logs.shift();
      }
    }
  } catch (error) {
    console.error("❌ Error running AI optimization:", error);
    // Add a system log about the failure
    factoryState.logs.push({
      timestamp: new Date().toLocaleTimeString(),
      type: "system",
      zone: "ALL",
      message: `[AI 오류] 자율 운영 에이전트 최적화 실패 (API 호출 에러)`
    });
  }
}

// Trigger initial AI control round on startup
setTimeout(runAiOptimization, 2000);

let aiOptimizationTimeout = null;
function triggerDebouncedAiOptimization() {
  if (aiOptimizationTimeout) {
    clearTimeout(aiOptimizationTimeout);
  }
  aiOptimizationTimeout = setTimeout(runAiOptimization, 2000); // Debounce AI optimization by 2 seconds
}

// Periodically run AI control every 30 seconds
setInterval(runAiOptimization, 30000);

// Auto generate shift report in background using AI Agent
async function autoGenerateReport() {
  if (!factoryState.isAiEnabled) return;
  
  const summaryData = {
    currentTime: new Date().toLocaleString(),
    cumulativeSavingsKwh: factoryState.cumulativeSavingsKwh,
    cumulativeSavingsCost: factoryState.cumulativeSavingsCost,
    activeZones: Object.entries(factoryState.zones).map(([id, z]) => ({
      zone: z.name,
      workers: z.workers,
      powerKw: z.powerConsumption,
      lights: z.lights,
      ventilation: z.ventilation
    })),
    recentAlerts: factoryState.alerts.slice(0, 5),
    recentLogs: factoryState.logs.slice(-10)
  };

  try {
    console.log("🤖 Running Background AI Shift Report Generation...");
    const report = await generateShiftReport(summaryData);
    
    // Save report file
    const filename = `auto_report_${new Date().toISOString().replace(/[:.]/g, '-')}.md`;
    const filepath = path.join(reportsDir, filename);
    fs.writeFileSync(filepath, report, 'utf8');

    // Save metadata to SQLite
    saveReportToDb({
      filename,
      content: report,
      kpiSavingsKwh: summaryData.cumulativeSavingsKwh,
      alertsCount: summaryData.recentAlerts.length,
      broadcastCount: summaryData.recentAlerts.filter(a => a.broadcastVerified).length
    });
    console.log(`✅ Background report generated and saved: ${filename}`);
  } catch (err) {
    console.error("❌ Failed to automatically generate report:", err);
  }
}

// --- API ENDPOINTS ---

// Get current factory state
app.get('/api/factory/state', (req, res) => {
  res.json(factoryState);
});

// Update worker counts from Vision AI (Camera stream or slider)
app.post('/api/factory/control', async (req, res) => {
  const { zoneId, workers, isAiEnabled } = req.body;

  if (isAiEnabled !== undefined) {
    factoryState.isAiEnabled = isAiEnabled;
    factoryState.logs.push({
      timestamp: new Date().toLocaleTimeString(),
      type: "system",
      zone: "ALL",
      message: `관리자 모드 변경: AI 자율운영 ${isAiEnabled ? "활성화" : "비활성화 (수동 모드)"}`
    });
  }

  if (zoneId && workers !== undefined) {
    const zone = factoryState.zones[zoneId];
    if (zone) {
      const oldWorkers = zone.workers;
      zone.workers = parseInt(workers);
      zone.density = zone.workers === 0 ? "Empty" : zone.workers >= 4 ? "Crowded" : "Normal";
      
      // Randomly assign helmet violation when workers count changes (25% chance if workers > 0)
      if (zone.workers > 0) {
        zone.hasHelmetViolation = Math.random() < 0.25;
      } else {
        zone.hasHelmetViolation = false;
      }
      
      factoryState.logs.push({
        timestamp: new Date().toLocaleTimeString(),
        type: "vision",
        zone: zoneId,
        message: `[Vision AI] ${zone.name} 작업자 수 감지 변경: ${oldWorkers}명 -> ${zone.workers}명`
      });

      // Instantly run AI optimization in response to changes if AI is enabled (debounced to save API quota)
      if (factoryState.isAiEnabled) {
        triggerDebouncedAiOptimization();
      }
    }
  }

  res.json(factoryState);
});

// Admin triggers warning broadcast verification
app.post('/api/alerts/broadcast', (req, res) => {
  const { alertId } = req.body;
  const alert = factoryState.alerts.find(a => a.id === parseInt(alertId));
  if (alert) {
    alert.broadcastVerified = true;
    factoryState.logs.push({
      timestamp: new Date().toLocaleTimeString(),
      type: "system",
      zone: alert.zone,
      message: `[관리자 검증] 경고 방송이 정상 송출되었습니다. 대상 경보: ${alert.message}`
    });
    return res.json(factoryState);
  }
  res.status(404).json({ error: "Alert not found" });
});

// Retrieve report list
app.get('/api/reports', (req, res) => {
  try {
    const list = loadReportsList();
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Retrieve single report details
app.get('/api/reports/:id', (req, res) => {
  try {
    const reportId = parseInt(req.params.id);
    const report = loadReportContent(reportId);
    if (report) {
      res.json(report);
    } else {
      res.status(404).json({ error: "Report not found" });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Reset simulation data
app.post('/api/factory/reset', (req, res) => {
  factoryState.cumulativeSavingsKwh = 0;
  factoryState.cumulativeSavingsCost = 0;
  factoryState.logs = [
    { timestamp: new Date().toLocaleTimeString(), type: "system", zone: "ALL", message: "Aegis Factory 시스템 시뮬레이션 리셋 완료." }
  ];
  factoryState.alerts = [];
  
  // Reset KPIs to 0 ("측정 대기" / "0%")
  factoryState.ticksSinceReset = 0;
  factoryState.kpis = {
    accuracy: 0,
    speed: 0,
    powerSavings: 0,
    responseTime: 0,
    detectionRate: 0
  };
  
  initHistory();
  res.json(factoryState);
});

// AI Agent Conversation Chatbot
app.post('/api/agent/chat', async (req, res) => {
  const { message, history } = req.body;
  if (!message) {
    return res.status(400).json({ error: "Message is required" });
  }

  const reply = await handleUserQuery(factoryState, message, history);
  res.json({ reply });
});

// Generate professional Shift Report & Save
app.post('/api/agent/report', async (req, res) => {
  const summaryData = {
    currentTime: new Date().toLocaleString(),
    cumulativeSavingsKwh: factoryState.cumulativeSavingsKwh,
    cumulativeSavingsCost: factoryState.cumulativeSavingsCost,
    activeZones: Object.entries(factoryState.zones).map(([id, z]) => ({
      zone: z.name,
      workers: z.workers,
      powerKw: z.powerConsumption,
      lights: z.lights,
      ventilation: z.ventilation
    })),
    recentAlerts: factoryState.alerts.slice(0, 5),
    recentLogs: factoryState.logs.slice(-10)
  };

  try {
    const report = await generateShiftReport(summaryData);
    
    // Save report file
    const filename = `manual_report_${new Date().toISOString().replace(/[:.]/g, '-')}.md`;
    const filepath = path.join(reportsDir, filename);
    fs.writeFileSync(filepath, report, 'utf8');

    // Save metadata to SQLite
    saveReportToDb({
      filename,
      content: report,
      kpiSavingsKwh: summaryData.cumulativeSavingsKwh,
      alertsCount: summaryData.recentAlerts.length,
      broadcastCount: summaryData.recentAlerts.filter(a => a.broadcastVerified).length
    });

    res.json({ report });
  } catch (err) {
    res.status(500).json({ error: "Failed to generate and save report: " + err.message });
  }
});

// Start express server
app.listen(PORT, () => {
  console.log(`Aegis Factory server is running on http://localhost:${PORT}`);
}); // triggered restart after final port release
