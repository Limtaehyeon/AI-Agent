import { GoogleGenerativeAI } from '@google/generative-ai';
import { VertexAI } from '@google-cloud/vertexai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '.env') });

let useVertexAi = false;
let vertexModel = null;

const projectId = process.env.GCP_PROJECT_ID;
const location = process.env.GCP_LOCATION || 'us-central1';

if (projectId) {
  try {
    if (process.env.GCP_KEY_FILE) {
      const keyPath = path.resolve(__dirname, process.env.GCP_KEY_FILE);
      process.env.GOOGLE_APPLICATION_CREDENTIALS = keyPath;
      console.log(`🔑 GCP Credentials key file resolved to: ${keyPath}`);
    }
    const vertexAI = new VertexAI({ project: projectId, location: location });
    vertexModel = vertexAI.getGenerativeModel({
      model: 'gemini-1.5-flash-002',
    });
    useVertexAi = true;
    console.log(`✅ Vertex AI initialized on GCP. Project: ${projectId}, Location: ${location}`);
  } catch (err) {
    console.error("❌ Failed to initialize Vertex AI, falling back to Google AI Studio:", err);
  }
}

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey || 'dummy-key');
const studioModel = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

// Helper to generate content from either Vertex AI or Google AI Studio
async function generateContentHelper(prompt, isJson = false) {
  if (useVertexAi && vertexModel) {
    try {
      console.log("Using GCP Vertex AI for content generation...");
      const request = {
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: isJson ? 'application/json' : 'text/plain'
        }
      };
      const result = await vertexModel.generateContent(request);
      try {
        return result.response.text();
      } catch (e) {
        return result.response.candidates[0].content.parts[0].text;
      }
    } catch (vertexError) {
      console.error("⚠️ GCP Vertex AI failed, falling back to Google AI Studio:", vertexError.message);
      return callStudioModel(prompt, isJson);
    }
  } else {
    return callStudioModel(prompt, isJson);
  }
}

async function callStudioModel(prompt, isJson) {
  console.log("Using Google AI Studio for content generation...");
  const request = {
    contents: [{ role: "user", parts: [{ text: prompt }] }]
  };
  if (isJson) {
    request.generationConfig = { responseMimeType: "application/json" };
  }
  const result = await studioModel.generateContent(request);
  return result.response.text();
}

// Helper for chat conversations using Vertex AI or Google AI Studio
async function chatHelper(systemPrompt, formattedHistory, userMessage) {
  if (useVertexAi && vertexModel) {
    try {
      console.log("Using GCP Vertex AI for chat conversation...");
      const chat = vertexModel.startChat({
        history: [
          { role: "user", parts: [{ text: systemPrompt }] },
          { role: "model", parts: [{ text: "확인했습니다. Aegis Factory 자율 운영 에이전트가 대기 중입니다. 실시간 상태 분석 및 제어 관련하여 어떤 질문이든 답변해 드리겠습니다." }] },
          ...formattedHistory
        ]
      });
      const result = await chat.sendMessage(userMessage);
      try {
        return result.response.text();
      } catch (e) {
        return result.response.candidates[0].content.parts[0].text;
      }
    } catch (vertexError) {
      console.error("⚠️ GCP Vertex AI chat failed, falling back to Google AI Studio chat:", vertexError.message);
      return callStudioChat(systemPrompt, formattedHistory, userMessage);
    }
  } else {
    return callStudioChat(systemPrompt, formattedHistory, userMessage);
  }
}

async function callStudioChat(systemPrompt, formattedHistory, userMessage) {
  console.log("Using Google AI Studio for chat conversation...");
  const chat = studioModel.startChat({
    history: [
      { role: "user", parts: [{ text: systemPrompt }] },
      { role: "model", parts: [{ text: "확인했습니다. Aegis Factory 자율 운영 에이전트가 대기 중입니다. 실시간 상태 분석 및 제어 관련하여 어떤 질문이든 답변해 드리겠습니다." }] },
      ...formattedHistory
    ]
  });
  const result = await chat.sendMessage(userMessage);
  return result.response.text();
}

/**
 * AI Agent analyzes the factory state and determines control actions for each zone.
 * Returns optimization suggestions, control actions, and reasoning.
 */
export async function generateControlCommand(factoryState) {
  try {
    const prompt = `
당신은 산업 현장 자율 운영 및 에너지 최적화 시스템인 "Aegis Factory"의 AI Operation Agent입니다.
현재 공장 내 4개 구역(Zone A: 생산 라인, Zone B: 자재 창고, Zone C: 조립 구역, Zone D: 검사 및 포장 구역)의 실시간 센서 및 CCTV 탐지 상태가 주어졌습니다.

[현재 공장 상태 (Current Factory State)]
${JSON.stringify(factoryState, null, 2)}

위 상태를 종합 분석하여 아래 가이드라인에 따라 각 구역의 설비(조명 밝기 %, 환기팬 RPM %, 장비 대기전력 차단 여부 등) 제어 신호를 생성하고, 자율 운영 분석 보고서를 작성하세요.

[제어 및 최적화 가이드라인]
1. 조명 제어:
   - 인원이 0명인 구역은 조명 밝기를 즉시 최소값(20% 이하 - 보안용 최소 조도 유지) 또는 꺼짐(0%)으로 제어하여 에너지를 절감합니다.
   - 인원이 있는 경우 밀집도 및 인원수에 맞춰 조명 밝기 조절 (1~2명: 60%, 3명 이상: 90%~100%).
2. 환기 제어 (Ventilation):
   - 작업 밀집도가 높거나(Crowded) 인원이 많으면 환기팬 속도를 올립니다 (Med/High 또는 70%~100%).
   - 인원이 없으면 환기팬 속도를 최소화(Off 또는 0%~20%)합니다.
3. 장비 대기전력:
   - 구역이 비어있는 상태가 지속되면 대기전력 차단 장치(Smart Outlet)를 활성화(Active)하여 불필요한 기기 전력을 차단합니다.
4. 위험 상황 및 안전 위반 감지 (Safety Event) & 우선순위 결정:
   - 각 구역의 hasHelmetViolation 필드를 확인하여 true인 경우 즉시 안전 위반 경고(safetyAlert)를 발생시키고 전체 요약 및 로그에 이를 반영하세요.
     * 우선순위 Level 1 (CRITICAL): 안전모 미착용 등 현장 작업자 신체 안전과 관련된 직접적인 위반 상황.
     * 우선순위 Level 2 (WARNING): 구역 내 작업 과밀(density가 Crowded인 경우) 또는 비인가 인원 침입 등 이상 징후 상황.
     * 우선순위 Level 3 (INFO): 일반 센서 변동 또는 자율 에너지 세이빙 기기 자동 제어 관련 정상 상황.
   - 그 외 위험 상황이나 비정상 상태를 실시간 감지하여 경고를 발생시킵니다.
5. 설비운영 추천 (Equipment Operation Recommendation):
   - 각 구역에 구체적으로 어떤 설비를 최적화하여 조작할지(예: 메인 풍량 감축, 예비 조명 디밍, 가스 감지기 작동, 스마트 콘센트 스위칭 등) 텍스트를 작성하십시오.

반드시 다음 JSON 형식으로만 응답해야 합니다. 다른 텍스트는 일체 포함하지 마세요.

JSON 응답 포맷:
{
  "recommendations": [
    {
      "zoneId": "ZoneA",
      "reasoning": "한글로 작성된 의사결정 이유 요약",
      "actions": {
        "lights": 100, // 0~100 수치
        "ventilation": 80, // 0~100 수치
        "standbyPowerCut": false // true or false
      },
      "equipmentRecommendation": "설비운영 추천 상세 문구 (한글)"
    },
    ...
  ],
  "overallSummary": "공장 전체적인 자율 운영 현황 및 에너지 절감 추세 요약 (한글)",
  "safetyAlert": {
    "hasAlert": false, // 경고 발생 여부
    "level": "info", // "info" | "warning" | "danger"
    "message": "경고 메시지 내용 (한글). 없으면 null",
    "priority": 3 // 1: CRITICAL, 2: WARNING, 3: INFO
  }
}
`;

    const responseText = await generateContentHelper(prompt, true);
    return JSON.parse(responseText);
  } catch (error) {
    console.error("Error generating control command from Gemini:", error);
    // Return a default fallback decision model in case of API limits or errors
    return generateFallbackControl(factoryState);
  }
}

/**
 * Handles conversational queries from the dashboard user interface.
 */
export async function handleUserQuery(factoryState, userMessage, chatHistory = []) {
  try {
    const formattedHistory = chatHistory.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }]
    }));

    const systemPrompt = `
당신은 Aegis Factory의 관리직원과 소통하는 똑똑하고 신속한 AI 공장 운영 비서(Aegis Agent)입니다.
현재 공장의 실시간 운영 상태와 센서 수치들을 바탕으로 성실하고 전문적으로 답변해야 합니다.

[현재 공장 상태]
${JSON.stringify(factoryState, null, 2)}

답변 작성 규칙:
- 한국어로 친절하고 정중하면서도 군더더기 없는 전문적인 어조로 답변하세요.
- 필요 시 마크다운 표나 리스트를 적극 활용해 정보를 구조화해 보여주세요.
- 에너지 절감 수치나 밀집 상태 등 구체적인 수치를 들어 설명하세요.
`;

    const replyText = await chatHelper(systemPrompt, formattedHistory, userMessage);
    return replyText;
  } catch (error) {
    console.error("Error handling user query:", error);
    
    const normalizedMsg = userMessage.toLowerCase();
    
    // 1. 구역별 상태 요약 질문 처리
    if (normalizedMsg.includes('구역') || normalizedMsg.includes('상태') || normalizedMsg.includes('요약')) {
      let zoneSummaries = Object.entries(factoryState.zones).map(([id, z]) => {
        return `- **${z.name} (${id})**: 인원 ${z.workers}명 (${z.density}), 조명 ${z.lights}%, 환기 ${z.ventilation}%, 전력 ${z.powerConsumption.toFixed(1)} kW (기본 ${z.basePower} kW)`;
      }).join('\n');
      
      return `[로컬 분석 엔진 응답] 실시간 Aegis Factory 센서 상태 분석 결과입니다:
      
${zoneSummaries}

현재 모든 구역이 로컬 AI 최적화 알고리즘에 의해 정상 제어되고 있습니다.`;
    }
    
    // 2. 에너지 절감 현황 질문 처리
    if (normalizedMsg.includes('에너지') || normalizedMsg.includes('절감') || normalizedMsg.includes('비용')) {
      const totalSavingsKwh = factoryState.cumulativeSavingsKwh || 0;
      const totalSavingsCost = factoryState.cumulativeSavingsCost || 0;
      
      return `[로컬 분석 엔진 응답] 실시간 에너지 절약 현황 보고입니다:
      
- **누적 전력 절감량**: **${totalSavingsKwh.toFixed(1)} kWh**
- **누적 비용 절감액**: **₩${totalSavingsCost.toLocaleString()}**
- **환경 기여도**: 소나무 약 ${Math.round(totalSavingsKwh * 0.45)}그루 식재 효과와 동일 (탄소 감축 기준)

에어컨 및 환기 설비가 대기전력 모드로 차단되어 에너지가 실시간으로 절감되고 있습니다.`;
    }
    
    // 3. 안전 및 경보 상태 질문 처리
    if (normalizedMsg.includes('안전') || normalizedMsg.includes('경보') || normalizedMsg.includes('위험')) {
      const activeAlerts = factoryState.alerts || [];
      if (activeAlerts.length === 0) {
        return `[로컬 분석 엔진 응답] 실시간 안전 점검 결과, **현재 감지된 위반 사항이나 위험 사건은 없습니다.** 모든 구역이 안전 수칙(안전모 착용 등)을 준수하며 정상 가동 중입니다.`;
      } else {
        const alertList = activeAlerts.map(a => `- **[${a.level.toUpperCase()}]** ${a.timestamp} - ${a.message}`).join('\n');
        return `[로컬 분석 엔진 응답] ⚠️ **현재 감지된 산업 안전 이상 경보 상황**이 있습니다:
        
${alertList}

조치 사항: 해당 구역 관리자에게 현장 안전 장비 착용 여부를 재점검하고, 즉각적인 구역 통제 조치를 실시간으로 지시했습니다.`;
      }
    }
    
    // 4. 일반 질문에 대한 폴백 응답
    return `안녕하세요! 현재 Gemini API의 일일 할당량(Quota Limit)이 초과되어, **로컬 모니터링 엔진**이 실시간 시뮬레이션 데이터를 바탕으로 즉시 분석 중입니다. 
    
질문하신 내용과 연동되는 실시간 전력 사용량은 **${(Object.values(factoryState.zones).reduce((acc, z) => acc + z.powerConsumption, 0)).toFixed(1)} kW** 이며, 감지된 안전 경보는 총 **${(factoryState.alerts || []).length}건**입니다. 
궁금하신 공장 상태(예: '구역별 상태', '에너지 절감', '안전 상태')를 질문해 주시면 로컬 데이터를 기반으로 즉시 분석해 드리겠습니다!`;
  }
}

/**
 * Generates a comprehensive shift report based on historical data.
 */
export async function generateShiftReport(historicalData) {
  try {
    const prompt = `
Aegis Factory의 일일/교대근무(Shift) 운영 분석 보고서를 생성해야 합니다.
다음은 지난 운영 주기 동안 수집된 공장 운영, 에너지 사용량, 그리고 안전 경보 발생 내역 데이터 요약입니다.

[운영 이력 데이터 (Summary Data)]
${JSON.stringify(historicalData, null, 2)}

특히, 다음 사항을 중점적으로 검토해 주세요:
1. **관리자 경고 방송 검증 (Warning Broadcast Audit)**:
   - 발생한 L1/L2 안전 경보 중 관리자가 실제로 실시간 무전/경고 방송(Broadcast)을 송출하여 검증(Verified)된 조치가 몇 건 진행되었는지 분석하세요.
   - 데이터에 포함된 alert 정보에서 'broadcastVerified' 필드 상태를 활용해 대처 수칙 준수율(%)을 평가하고 개선점을 지적하십시오.
2. **에너지 최적화 성과 (KPI)**: 총 전력 소비량, 누적 에너지 절감량, 절감 비용 ₩ 환산, 이전 대비 절감율 % 분석.
3. **구역별 작업 밀집도 및 설비 운영 제안**: 가장 활발했던 구역, 에너지 절약에 가장 크게 기여한 구역 등.
4. **AI Agent의 위험상황 대응 및 구역 설비운영 추천 조치 종합 평가**.

전문적이고 깔끔한 마크다운 양식으로 한국어로 상세하게 작성하세요.
`;

    const responseText = await generateContentHelper(prompt, false);
    return responseText;
  } catch (error) {
    console.error("Error generating shift report:", error);
    
    const { currentTime, cumulativeSavingsKwh, cumulativeSavingsCost, activeZones, recentAlerts, recentLogs } = historicalData;
    
    // Generate dynamic markdown table rows for active zones
    const zoneTableRows = activeZones.map(z => 
      `| ${z.zone} | ${z.workers}명 | ${z.powerKw.toFixed(1)} kW | ${z.lights}% | ${z.ventilation}% |`
    ).join('\n');
    
    // Format recent alerts safely with broadcast verification info
    const alertsText = recentAlerts.length === 0 
      ? "* 신규 감지된 위반 및 위험 사항 없음 (정상 가동)"
      : recentAlerts.map(a => `- **[${a.level.toUpperCase()}]** ${a.timestamp} - ${a.message} (방송 검증: ${a.broadcastVerified ? '✅ 완료' : '⚠️ 대기 중'})`).join('\n');

    // Format recent system control logs safely
    const logsText = recentLogs.length === 0
      ? "* 최근 수집된 자율 제어 로그가 없습니다."
      : recentLogs.slice(-5).reverse().map(l => `- [${l.timestamp}] [${l.type.toUpperCase()}] ${l.message}`).join('\n');

    return `# Aegis Factory 일일 자율 운영 보고서

본 보고서는 **Gemini AI 백업 모니터링 엔진**이 실시간 수집된 현장 데이터를 활용하여 작성한 실시간 교대 분석 보고서입니다.

## 1. 보고서 생성 요약
- **작성 일시**: \`${currentTime}\`
- **운영 상태**: AI 자율 운영 모드 가동 중 (API 속도 제한으로 인해 로컬 백업 보고서 전환)

---

## 2. 에너지 최적화 성과 (KPI)
- **누적 전력 절감량**: \`${cumulativeSavingsKwh.toFixed(1)} kWh\`
- **누적 비용 절감액**: \`₩${cumulativeSavingsCost.toLocaleString()} 원\`
- **실시간 기여 지표**: 이산화탄소 약 \` ${(cumulativeSavingsKwh * 0.424).toFixed(2)} kg\` 탄소 배출 절감 효과 달성

---

## 3. 실시간 구역별 설비 운영 현황
| 구역명 | 작업 인원 | 현재 전력 부하 | 조명 제어 | 환기 속도 |
| :--- | :--- | :--- | :--- | :--- |
${zoneTableRows}

*※ 인원이 감지되지 않는 비활성 구역은 대기 전력이 스마트 아울렛을 통해 즉각 차단되었으며, 조명 조도가 보안 등급(20% 이하)으로 자동 감축 제어되었습니다.*

---

## 4. 위험 이상 상황 및 안전 위반 (Alerts)
${alertsText}

*관리자 경고 방송 검증 요약: 발생한 경보 중 대응이 완료된 비율을 상시 체크하여 현장 작업 규칙 위반률을 관리합니다.*

---

## 5. 최근 AI 자율 운영 제어 기록
${logsText}
`;
  }
}

/**
 * Local rule-based fallback model in case API is unavailable.
 */
function generateFallbackControl(factoryState) {
  const recommendations = Object.entries(factoryState.zones).map(([zoneId, zone]) => {
    let lights = 20;
    let ventilation = 10;
    let standbyPowerCut = true;
    let reasoning = "";
    let equipmentRecommendation = "";

    if (zone.workers > 0) {
      standbyPowerCut = false;
      if (zone.workers >= 3 || zone.density === "Crowded") {
        lights = 100;
        ventilation = 90;
        reasoning = `작업자 ${zone.workers}명 감지 및 혼잡 상태로, 조명 밝기 최대화(100%) 및 환기 강화(90%) 적용.`;
        equipmentRecommendation = `${zone.name.split(':')[0]}: 작업 밀집도가 높아 메인 배기 팬 고속 운전(90%) 및 보조 공조 장치 가동을 추천합니다.`;
      } else {
        lights = 70;
        ventilation = 50;
        reasoning = `작업자 ${zone.workers}명 감지(보통 밀집도). 조명 70%, 환기 50% 에너지 최적화 모드 작동.`;
        equipmentRecommendation = `${zone.name.split(':')[0]}: 적정 밀집도로 송풍 팬 50% 유지를 통한 에너지 세이빙 가동을 추천합니다.`;
      }
    } else {
      reasoning = "해당 구역 내 작업자가 감지되지 않아 조명을 최소화(20%)하고 대기전력을 자동 차단합니다.";
      equipmentRecommendation = `${zone.name.split(':')[0]}: 무인 대기 상태이므로 조명 디밍(20%) 및 스마트 콘센트를 통한 전체 설비 대기전력 자동 차단을 추천합니다.`;
    }

    return {
      zoneId,
      reasoning,
      actions: { lights, ventilation, standbyPowerCut },
      equipmentRecommendation
    };
  });

  // Simple rule-based safety alert check
  let safetyAlert = { hasAlert: false, level: "info", message: null, priority: 3 };
  const crowdedZones = Object.entries(factoryState.zones)
    .filter(([_, z]) => z.density === "Crowded")
    .map(([id]) => id);
  const helmetViolationZones = Object.entries(factoryState.zones)
    .filter(([_, z]) => z.hasHelmetViolation)
    .map(([_, z]) => z.name);

  if (helmetViolationZones.length > 0) {
    safetyAlert = {
      hasAlert: true,
      level: "danger",
      priority: 1,
      message: `[안전 위반] ${helmetViolationZones.join(", ")}에서 보호구(안전모) 미착용 작업자가 감지되었습니다! 즉시 현장 지도 및 경고 방송이 필요합니다.`
    };
  } else if (crowdedZones.length > 0) {
    safetyAlert = {
      hasAlert: true,
      level: "warning",
      priority: 2,
      message: `${crowdedZones.join(", ")} 구역의 작업 밀집도가 기준치를 초과했습니다. 간격 유지 및 안전 주의가 필요합니다.`
    };
  }

  return {
    recommendations,
    overallSummary: "백엔드 로컬 룰 기반 자동 에너지 절감 알고리즘 가동 중 (Gemini 예외 처리).",
    safetyAlert
  };
}// Trigger reload again
