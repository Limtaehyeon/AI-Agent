import React, { useState, useEffect } from 'react';
import CCTVPanel from './components/CCTVPanel';
import ZoneStatus from './components/ZoneStatus';
import EnergyCharts from './components/EnergyCharts';
import AgentControlLog from './components/AgentControlLog';
import SafetyAlerts from './components/SafetyAlerts';
import AgentChat from './components/AgentChat';
import KPIGoalTracker from './components/KPIGoalTracker';
import SavedReports from './components/SavedReports';
import { Cpu, RefreshCw, Layers, ShieldAlert, Sparkles, FileText, X, Zap, DollarSign, Leaf, AlertTriangle, Eye, EyeOff, MessageSquare } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip as ChartTooltip, Cell } from 'recharts';

// Helper component for glowing circular progress ring
const ProgressRing = ({ percentage, color, title, subtitle }) => {
  const pct = Math.max(0, Math.min(100, Math.round(percentage)));
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (pct / 100) * circumference;

  return (
    <div style={{
      background: 'var(--bg-secondary)',
      border: '1px solid var(--border-color)',
      borderRadius: '12px',
      padding: '0.85rem 1rem',
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      flex: 1,
      minWidth: '220px'
    }}>
      <div style={{ position: 'relative', width: '70px', height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <svg style={{ transform: 'rotate(-90deg)', width: '70px', height: '70px' }}>
          <circle
            cx="35"
            cy="35"
            r={radius}
            fill="transparent"
            stroke="rgba(255,255,255,0.03)"
            strokeWidth="5"
          />
          <circle
            cx="35"
            cy="35"
            r={radius}
            fill="transparent"
            stroke={color}
            strokeWidth="5"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{
              transition: 'stroke-dashoffset 0.6s ease-in-out',
              filter: `drop-shadow(0 0 3px ${color})`
            }}
          />
        </svg>
        <span style={{ position: 'absolute', fontSize: '0.75rem', fontWeight: 'bold', fontFamily: 'var(--font-mono)', color: '#fff' }}>
          {pct}%
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
        <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>{title}</span>
        <span style={{ fontSize: '0.95rem', fontWeight: 'bold', color: '#fff' }}>{subtitle}</span>
      </div>
    </div>
  );
};

// Helper component for visual bar chart comparing zone load inside the report
const ReportZoneChart = ({ zoneData }) => {
  if (!zoneData || zoneData.length === 0) return null;

  return (
    <div style={{
      background: 'var(--bg-secondary)',
      border: '1px solid var(--border-color)',
      borderRadius: '12px',
      padding: '1rem 1.25rem',
      margin: '0.5rem 0 1.25rem 0',
      height: '220px',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '0.75rem', display: 'block' }}>
        📊 구역별 실시간 전력 부하 비교 (단위: kW)
      </span>
      <div style={{ width: '100%', flex: 1, minHeight: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={zoneData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
            <XAxis 
              dataKey="name" 
              stroke="var(--text-muted)" 
              fontSize={10} 
              tickLine={false} 
            />
            <YAxis 
              stroke="var(--text-muted)" 
              fontSize={10} 
              tickLine={false} 
              axisLine={false} 
            />
            <ChartTooltip 
              contentStyle={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)', borderRadius: '6px', fontSize: '10px', color: '#fff' }} 
              labelStyle={{ color: 'var(--color-cyan)', fontWeight: 'bold' }}
            />
            <Bar dataKey="power" radius={[4, 4, 0, 0]}>
              {zoneData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.power > 15 ? 'var(--color-red)' : 'var(--color-cyan)'} 
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// Parser to extract numbers and table data from markdown report text
const parseReportData = (text) => {
  if (!text) return null;
  
  // 1. Extract KPI values using regular expressions
  const kwhMatch = text.match(/([\d.]+)\s*kWh/);
  const costMatch = text.match(/₩([\d,]+)\s*원?/);
  const carbonMatch = text.match(/([\d.]+)\s*kg/);
  
  const kpiSavingsKwh = kwhMatch ? parseFloat(kwhMatch[1]) : 0;
  const kpiSavingsCost = costMatch ? parseInt(costMatch[1].replace(/[^\d]/g, '')) : 0;
  const carbonSavings = carbonMatch ? parseFloat(carbonMatch[1]) : 0;
  
  // 2. Extract zone table rows
  const zoneData = [];
  const lines = text.split('\n');
  lines.forEach(line => {
    const match = line.match(/^\|\s*([^|:]+?)\s*\|\s*(\d+)명\s*\|\s*([\d.]+)\s*kW\s*\|\s*(\d+)%\s*\|\s*(\d+)%\s*\|/);
    if (match) {
      zoneData.push({
        name: match[1].trim(),
        workers: parseInt(match[2]),
        power: parseFloat(match[3]),
        lights: parseInt(match[4]),
        ventilation: parseInt(match[5])
      });
    }
  });
  
  // 3. Extract safety compliance rate
  const complianceMatch = text.match(/준수율\s*:\s*(\d+)%/i) || text.match(/준수율.*?\s*(\d+)%/);
  const complianceRate = complianceMatch ? parseInt(complianceMatch[1]) : 100;
  
  return {
    kpiSavingsKwh,
    kpiSavingsCost,
    carbonSavings,
    zoneData,
    complianceRate
  };
};

function App() {
  const [zones, setZones] = useState(null);
  const [activeZoneId, setActiveZoneId] = useState('ZoneA');
  const [powerHistory, setPowerHistory] = useState([]);
  const [cumulativeSavingsKwh, setCumulativeSavingsKwh] = useState(0);
  const [cumulativeSavingsCost, setCumulativeSavingsCost] = useState(0);
  const [logs, setLogs] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [isAiEnabled, setIsAiEnabled] = useState(true);
  const [reportMarkdown, setReportMarkdown] = useState(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [kpis, setKpis] = useState(null);
  const [activeRightTab, setActiveRightTab] = useState('chat');
  const [reportsRefreshTrigger, setReportsRefreshTrigger] = useState(0);
  const [showChatModal, setShowChatModal] = useState(false);
  const [parsedData, setParsedData] = useState(null);

  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5050';

  // Parse report data when reportMarkdown is set or updated
  useEffect(() => {
    if (reportMarkdown) {
      const data = parseReportData(reportMarkdown);
      setParsedData(data);
    } else {
      setParsedData(null);
    }
  }, [reportMarkdown]);

  // Fetch factory status from backend Express API
  const fetchState = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/factory/state`);
      if (!response.ok) throw new Error('API server unavailable');
      const data = await response.json();

      setZones(data.zones);
      setPowerHistory(data.powerHistory);
      setCumulativeSavingsKwh(data.cumulativeSavingsKwh);
      setCumulativeSavingsCost(data.cumulativeSavingsCost);
      setLogs(data.logs);
      setAlerts(data.alerts);
      setIsAiEnabled(data.isAiEnabled);
      setKpis(data.kpis);
    } catch (error) {
      console.error("Error fetching factory state:", error);
    }
  };

  // Initial load and fast polling loop
  useEffect(() => {
    fetchState();
    const interval = setInterval(fetchState, 3000);
    return () => clearInterval(interval);
  }, []);

  // Update worker count from CCTV canvas slide adjustments
  const handleWorkerCountChange = async (zoneId, workers) => {
    // 1. Optimistically update local zones state for instant UI response
    setZones(prevZones => {
      if (!prevZones) return prevZones;
      const density = workers === 0 ? "Empty" : workers >= 4 ? "Crowded" : "Normal";
      return {
        ...prevZones,
        [zoneId]: {
          ...prevZones[zoneId],
          workers: workers,
          density: density
        }
      };
    });

    try {
      const response = await fetch(`${API_BASE}/api/factory/control`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ zoneId, workers })
      });
      if (response.ok) {
        const data = await response.json();
        // 2. Sync with backend state
        setZones(data.zones);
        setLogs(data.logs);
      }
    } catch (error) {
      console.error("Error updating worker count:", error);
      fetchState(); // Rollback on error
    }
  };

  // Switch between AI Autonomous mode and Manual override mode
  const handleToggleAi = async () => {
    try {
      const targetState = !isAiEnabled;
      setIsAiEnabled(targetState);
      const response = await fetch(`${API_BASE}/api/factory/control`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAiEnabled: targetState })
      });
      if (response.ok) {
        const data = await response.json();
        setLogs(data.logs);
        setIsAiEnabled(data.isAiEnabled);
      }
    } catch (error) {
      console.error("Error toggling AI Mode:", error);
    }
  };

  // Reset all simulation history and accumulators
  const handleResetSimulator = async () => {
    if (!window.confirm("시뮬레이터의 에너지 절감 누적값 및 알림 로그를 리셋하시겠습니까?")) return;
    try {
      const response = await fetch(`${API_BASE}/api/factory/reset`, { method: 'POST' });
      if (response.ok) {
        const data = await response.json();
        setCumulativeSavingsKwh(data.cumulativeSavingsKwh);
        setCumulativeSavingsCost(data.cumulativeSavingsCost);
        setLogs(data.logs);
        setAlerts(data.alerts);
        if (data.kpis) setKpis(data.kpis);
        setReportsRefreshTrigger(prev => prev + 1);
      }
    } catch (error) {
      console.error("Error resetting simulation:", error);
    }
  };

  // Compile and fetch full daily operational report via Gemini AI
  const handleGenerateReport = async () => {
    setIsGeneratingReport(true);
    try {
      const response = await fetch(`${API_BASE}/api/agent/report`, { method: 'POST' });
      if (response.ok) {
        const data = await response.json();
        setReportMarkdown(data.report);
        // Refresh the reports library when a new report is generated
        setReportsRefreshTrigger(prev => prev + 1);
      } else {
        alert("레포트 생성 중 API 서버 에러가 발생했습니다.");
      }
    } catch (error) {
      console.error("Error generating report:", error);
      alert("백엔드와 연동할 수 없습니다.");
    } finally {
      setIsGeneratingReport(false);
    }
  };

  // Admin triggers warning broadcast verification
  const handleTriggerBroadcast = async (alertId) => {
    try {
      const response = await fetch(`${API_BASE}/api/alerts/broadcast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alertId })
      });
      if (response.ok) {
        const data = await response.json();
        setAlerts(data.alerts);
        setLogs(data.logs);
      }
    } catch (error) {
      console.error("Error triggering warning broadcast:", error);
    }
  };

  // Simple HTML renderer for markdown report modal content
  const formatReportMarkdown = (text) => {
    if (!text) return '';

    // Replace text progress bars [■■■■■□□□□□] 50% with styled HTML elements
    let processedText = text;
    const progressRegex = /\[([■□█░]*?)\]\s*(\d+)%/g;
    processedText = processedText.replace(progressRegex, (match, blocks, pct) => {
      return `<div class="report-inline-progress">
        <div class="report-inline-progress-bar" style="width: ${pct}%"></div>
        <span class="report-inline-progress-text">${pct}%</span>
      </div>`;
    });

    let html = processedText
      .replace(/^#\s+(.*?)$/gm, '<h1>$1</h1>')
      .replace(/^##\s+(.*?)$/gm, '<h2>$1</h2>')
      .replace(/^###\s+(.*?)$/gm, '<h3>$1</h3>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/^\-\s+(.*?)$/gm, '<li>$1</li>')
      .replace(/(<li>.*?<\/li>)/gs, '<ul>$1</ul>')
      .replace(/<\/ul>\s*<ul>/g, '')
      .replace(/\n/g, '<br />');

    // Parse tables roughly
    const lines = html.split('<br />');
    let inTable = false;
    let tableHtml = '';

    const parsedLines = lines.map(line => {
      if (line.trim().startsWith('|')) {
        const cols = line.split('|').map(c => c.trim()).filter(c => c !== '');
        if (cols.length === 0) return '';

        // Skip separator line |---|---|
        if (cols[0].includes('---') || cols[0].includes('===')) return '';

        let rowHtml = '<tr>' + cols.map(c => inTable ? `<td>${c}</td>` : `<th>${c}</th>`).join('') + '</tr>';

        if (!inTable) {
          inTable = true;
          return '<table><thead>' + rowHtml + '</thead><tbody>';
        }
        return rowHtml;
      } else {
        if (inTable) {
          inTable = false;
          return '</tbody></table>' + line;
        }
        return line;
      }
    });

    return <div dangerouslySetInnerHTML={{ __html: parsedLines.join('') }} />;
  };

  if (!zones) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', justifyContent: 'center', alignItems: 'center', backgroundColor: 'var(--bg-primary)', color: '#fff', gap: '1rem' }}>
        <RefreshCw className="fan-spin" size={32} style={{ color: 'var(--color-cyan)', animationDuration: '1.5s' }} />
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          Aegis Factory Control Room 연결 중...
        </span>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Top Banner Header */}
      <header className="dashboard-header">
        <div className="header-title-container">
          <Layers className="logo-icon" size={24} />
          <div>
            <h1>Aegis Factory</h1>
            <p style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', marginTop: '0.1rem' }}>
              Autonomous Operations & Energy Optimizer v1.0
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          {/* Toggle Aegis AI Chat & Reports Button */}
          <button
            className="cctv-btn"
            onClick={() => setShowChatModal(true)}
            style={{ 
              padding: '0.4rem 0.8rem', 
              fontSize: '0.75rem', 
              background: 'rgba(6, 182, 212, 0.05)', 
              borderColor: 'rgba(6, 182, 212, 0.2)', 
              color: 'var(--color-cyan)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem'
            }}
          >
            <MessageSquare size={12} />
            <span>AEGIS 챗</span>
          </button>

          {/* AI Autonomous Operation Switch */}
          <div className="switch-container">
            <span className="switch-label" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Sparkles size={14} style={{ color: isAiEnabled ? 'var(--color-green)' : 'var(--text-muted)' }} />
              AI 자율 제어 모드
            </span>
            <label className="switch">
              <input
                type="checkbox"
                checked={isAiEnabled}
                onChange={handleToggleAi}
              />
              <span className="slider-switch"></span>
            </label>
          </div>

          {/* Reset simulator button */}
          <button
            className="cctv-btn"
            onClick={handleResetSimulator}
            style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', background: 'rgba(239, 68, 68, 0.05)', borderColor: 'rgba(239, 68, 68, 0.2)', color: 'var(--color-red)' }}
          >
            <RefreshCw size={12} />
            <span>데이터 리셋</span>
          </button>

          {/* System status badge */}
          <div className="header-status-badge">
            <div className="status-dot active"></div>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>SYSTEM RUNNING</span>
          </div>
        </div>
      </header>

      {/* Grid Dashboard Modules */}
      <main className="dashboard-grid">
        {/* Left Side: Real-time CCTV analysis & Area sensor details */}
        <div className="panel-left" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <CCTVPanel
            zones={zones}
            activeZoneId={activeZoneId}
            onZoneChange={setActiveZoneId}
            onWorkerCountChange={handleWorkerCountChange}
          />
          <ZoneStatus
            zones={zones}
            activeZoneId={activeZoneId}
            onSelectZone={setActiveZoneId}
          />
        </div>

        {/* Right Side: Recharts analysis, AI Logs, Alerts, Chatbot */}
        <div className="panel-right" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <EnergyCharts
            powerHistory={powerHistory}
            cumulativeSavingsKwh={cumulativeSavingsKwh}
            cumulativeSavingsCost={cumulativeSavingsCost}
            zones={zones}
          />
          
          {/* Quantitative Industrial KPIs */}
          <KPIGoalTracker kpis={kpis} />

          <div className="decision-log" style={{ height: '400px', display: 'flex', flexDirection: 'column' }}>
            <AgentControlLog logs={logs} />
          </div>
          
          <div className="bottom-split" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem', height: '500px' }}>
            <SafetyAlerts alerts={alerts} onTriggerBroadcast={handleTriggerBroadcast} />
          </div>
        </div>
      </main>

      {/* Aegis AI Chat & Reports Modal */}
      {showChatModal && (
        <div className="report-modal">
          <div className="report-modal-content" style={{ maxWidth: '750px', height: '70vh' }}>
            <div className="card-panel-header" style={{ margin: 0, padding: '1rem 1.5rem', borderBottom: '1px solid var(--border-color)' }}>
              <div className="card-panel-title" style={{ color: 'var(--color-cyan)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <MessageSquare size={18} />
                <span style={{ fontWeight: 600 }}>Aegis AI 지원 센터</span>
              </div>
              <button
                onClick={() => setShowChatModal(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
              >
                <X size={18} />
              </button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '1.25rem', overflow: 'hidden', background: 'var(--bg-primary)' }}>
              {/* Tab Selector Header */}
              <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.75rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', flexWrap: 'wrap' }}>
                <button
                  onClick={() => setActiveRightTab('chat')}
                  style={{
                    background: activeRightTab === 'chat' ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
                    border: '1px solid ' + (activeRightTab === 'chat' ? 'var(--color-green)' : 'transparent'),
                    color: activeRightTab === 'chat' ? 'var(--color-green)' : 'var(--text-secondary)',
                    padding: '0.35rem 0.5rem',
                    borderRadius: '4px',
                    fontSize: '0.7rem',
                    cursor: 'pointer',
                    fontWeight: 600,
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}
                >
                  <Sparkles size={12} />
                  <span>Aegis AI 챗 인터페이스</span>
                </button>
                <button
                  onClick={() => setActiveRightTab('reports')}
                  style={{
                    background: activeRightTab === 'reports' ? 'rgba(6, 182, 212, 0.15)' : 'transparent',
                    border: '1px solid ' + (activeRightTab === 'reports' ? 'var(--color-cyan)' : 'transparent'),
                    color: activeRightTab === 'reports' ? 'var(--color-cyan)' : 'var(--text-secondary)',
                    padding: '0.35rem 0.5rem',
                    borderRadius: '4px',
                    fontSize: '0.7rem',
                    cursor: 'pointer',
                    fontWeight: 600,
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}
                >
                  <FileText size={12} />
                  <span>보고서 보관함</span>
                </button>
              </div>

              {/* Tab Content Area */}
              <div style={{ flex: 1, minHeight: 0 }}>
                {activeRightTab === 'chat' ? (
                  <AgentChat onGenerateReport={handleGenerateReport} />
                ) : (
                  <SavedReports 
                    onPreviewReport={setReportMarkdown} 
                    refreshTrigger={reportsRefreshTrigger}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Generating operational report indicator overlay */}
      {isGeneratingReport && (
        <div className="report-modal">
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', color: '#fff' }}>
            <RefreshCw className="fan-spin" size={36} style={{ color: 'var(--color-green)', animationDuration: '1s' }} />
            <span style={{ fontWeight: 500, fontSize: '0.9rem' }}>
              Gemini AI Agent가 공장 실시간 로그 데이터를 수집하여 레포트를 작성하고 있습니다...
            </span>
          </div>
        </div>
      )}

      {/* Report Viewer Overlay Modal */}
      {reportMarkdown && (
        <div className="report-modal">
          <div className="report-modal-content" style={{ maxWidth: '850px', height: '85vh' }}>
            <div className="card-panel-header" style={{ margin: 0, padding: '1rem 1.5rem', borderBottom: '1px solid var(--border-color)' }}>
              <div className="card-panel-title" style={{ color: 'var(--color-green)' }}>
                <FileText size={18} />
                <span>Aegis Factory 일일 교대 자율 운영 보고서</span>
              </div>
              <button
                onClick={() => setReportMarkdown(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>
            <div className="report-modal-body">
              {/* Dynamic Interactive Visual Dashboard View */}
              {parsedData && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1.5rem' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#fff', marginBottom: '0.25rem' }}>
                    📈 실시간 데이터 시각화 보드 (Interactive Widgets)
                  </div>
                  
                  {/* Circular Progress Rings Grid */}
                  <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', width: '100%' }}>
                    <ProgressRing 
                      percentage={(parsedData.kpiSavingsKwh / 50.0) * 100} 
                      color="var(--color-green)" 
                      title="전력 절감 성과 (목표: 50.0 kWh)" 
                      subtitle={`${parsedData.kpiSavingsKwh.toFixed(1)} kWh`}
                    />
                    <ProgressRing 
                      percentage={(parsedData.kpiSavingsCost / 15000) * 100} 
                      color="var(--color-cyan)" 
                      title="비용 절감 성과 (목표: ₩15,000)" 
                      subtitle={`₩${parsedData.kpiSavingsCost.toLocaleString()}`}
                    />
                    <ProgressRing 
                      percentage={parsedData.complianceRate} 
                      color={parsedData.complianceRate >= 80 ? 'var(--color-green)' : 'var(--color-amber)'} 
                      title="안전 수칙 준수율 (목표: 100%)" 
                      subtitle={`${parsedData.complianceRate}%`}
                    />
                  </div>

                  {/* Dynamic Recharts Bar Chart comparing active zone loads */}
                  <ReportZoneChart zoneData={parsedData.zoneData} />
                </div>
              )}

              {/* Standard Markdown Content */}
              {formatReportMarkdown(reportMarkdown)}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '1rem 1.5rem', borderTop: '1px solid var(--border-color)' }}>
              <button
                className="cctv-btn"
                onClick={() => setReportMarkdown(null)}
                style={{ flex: 'none', width: '100px', background: 'var(--color-green)', color: '#000', border: 'none', fontWeight: 600 }}
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
