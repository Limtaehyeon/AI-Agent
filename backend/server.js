import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { generateControlCommand, handleUserQuery, generateShiftReport } from './agent.js';
import { initDb } from './db.js';
import { initMqttClient } from './mqttClient.js';
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// --- IN-MEMORY FACTORY SIMULATION STATE ---
const ZONE_NAMES = {
  ZoneA: "Zone A: 생산 라인 (Production Line)",
  ZoneB: "Zone B: 자재 창고 (Material Warehouse)",
  ZoneC: "Zone C: 조립 구역 (Assembly Area)",
  ZoneD: "Zone D: 검사 및 포장 구역 (Inspection & Packaging)"
};

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
    { id: 1, timestamp: new Date(Date.now() - 1800000).toLocaleTimeString(), zone: "ZoneD", level: "warning", message: "Zone D(검사 및 포장) 작업 밀집도 초과 경보 (적정 인원: 3명, 현재: 4명)" }
  ],
  isAiEnabled: true
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

// Background simulation loop: slightly fluctuate values & recalculate power consumption
setInterval(() => {
  // Minor sensor value fluctuation
  Object.keys(factoryState.zones).forEach(zoneId => {
    const zone = factoryState.zones[zoneId];
    zone.temp = parseFloat((zone.temp + (Math.random() - 0.5) * 0.2).toFixed(1));
    zone.humidity = parseFloat((zone.humidity + (Math.random() - 0.5) * 0.4).toFixed(1));
    
    // Periodically fluctuate helmet violation state (5% chance to toggle if workers > 0)
    if (zone.workers > 0) {
      if (Math.random() < 0.05) {
        zone.hasHelmetViolation = !zone.hasHelmetViolation;
      }
    } else {
      zone.hasHelmetViolation = false;
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
            message: aiDecision.safetyAlert.message
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

// Reset simulation data
app.post('/api/factory/reset', (req, res) => {
  factoryState.cumulativeSavingsKwh = 0;
  factoryState.cumulativeSavingsCost = 0;
  factoryState.logs = [
    { timestamp: new Date().toLocaleTimeString(), type: "system", zone: "ALL", message: "Aegis Factory 시스템 시뮬레이션 리셋 완료." }
  ];
  factoryState.alerts = [];
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

// Generate professional Shift Report
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

  const report = await generateShiftReport(summaryData);
  res.json({ report });
});

// Start express server
app.listen(PORT, () => {
  console.log(`Aegis Factory server is running on http://localhost:${PORT}`);
});
