import React, { useRef, useEffect, useState } from 'react';
import { Camera, AlertTriangle, Users, ShieldAlert, Zap, Wind, Activity } from 'lucide-react';

const CCTVPanel = ({ zones, activeZoneId, onZoneChange, onWorkerCountChange, equipmentRecommendations = {}, isAiEnabled, logs = [] }) => {
  const canvasRef = useRef(null);
  const [frame, setFrame] = useState(0);
  const workersRef = useRef({});

  const activeZone = zones[activeZoneId];

  // Initialize worker positions for all zones if not present
  useEffect(() => {
    Object.keys(zones).forEach(zId => {
      if (!workersRef.current[zId]) {
        workersRef.current[zId] = [];
      }
      syncWorkersForZone(zId, zones[zId].workers, zones[zId].hasHelmetViolation);
    });
  }, [zones]);

  const syncWorkersForZone = (zoneId, targetCount, hasViolation) => {
    const currentList = workersRef.current[zoneId] || [];
    
    if (currentList.length !== targetCount) {
      if (currentList.length < targetCount) {
        // Add workers
        const toAdd = targetCount - currentList.length;
        for (let i = 0; i < toAdd; i++) {
          currentList.push({
            id: Math.floor(Math.random() * 100) + 1,
            x: 50 + Math.random() * 540, // canvas width is 640
            y: 50 + Math.random() * 260, // canvas height is 360
            vx: (Math.random() - 0.5) * 1.2,
            vy: (Math.random() - 0.5) * 1.2,
            hasHelmet: true // default to wearing helmet
          });
        }
      } else {
        // Remove workers
        workersRef.current[zoneId] = currentList.slice(0, targetCount);
      }
    }

    // Sync helmet statuses to match backend hasViolation state
    const list = workersRef.current[zoneId] || [];
    if (list.length > 0) {
      if (hasViolation) {
        const hasNoHelmet = list.some(w => !w.hasHelmet);
        if (!hasNoHelmet) {
          list[0].hasHelmet = false; // Make the first worker not wear a helmet
        }
      } else {
        list.forEach(w => {
          w.hasHelmet = true; // Everyone wears a helmet
        });
      }
    }
  };

  // Triggered when workers count is changed via control slider
  const handleSliderChange = (e) => {
    const count = parseInt(e.target.value);
    onWorkerCountChange(activeZoneId, count);
  };

  // Canvas Animation loop
  useEffect(() => {
    let animationId;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const updateAndDraw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw stylized background grid
      ctx.strokeStyle = 'rgba(34, 49, 80, 0.2)';
      ctx.lineWidth = 1;
      const gridSize = 40;
      for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Draw Zone Specific Obstacles / Simulated Machinery
      ctx.fillStyle = 'rgba(21, 29, 48, 0.4)';
      ctx.strokeStyle = 'rgba(48, 70, 115, 0.3)';
      ctx.lineWidth = 2;
      if (activeZoneId === 'ZoneA') {
        // Draw conveyor belt lines
        ctx.fillRect(50, 150, 540, 60);
        ctx.strokeRect(50, 150, 540, 60);
        ctx.fillStyle = '#304673';
        ctx.font = '10px Orbitron';
        ctx.fillText("CONVEYOR BELT LINE #01", 60, 185);
      } else if (activeZoneId === 'ZoneB') {
        // Draw storage rack shapes
        ctx.fillRect(80, 40, 120, 280);
        ctx.strokeRect(80, 40, 120, 280);
        ctx.fillRect(440, 40, 120, 280);
        ctx.strokeRect(440, 40, 120, 280);
        ctx.fillStyle = '#304673';
        ctx.font = '10px Orbitron';
        ctx.fillText("STORAGE RACK A", 90, 180);
        ctx.fillText("STORAGE RACK B", 450, 180);
      } else if (activeZoneId === 'ZoneC') {
        // Assembly Stations
        ctx.fillRect(100, 80, 140, 90);
        ctx.strokeRect(100, 80, 140, 90);
        ctx.fillRect(400, 80, 140, 90);
        ctx.strokeRect(400, 80, 140, 90);
        ctx.fillStyle = '#304673';
        ctx.font = '10px Orbitron';
        ctx.fillText("ASSEMBLY STATION A", 110, 130);
        ctx.fillText("ASSEMBLY STATION B", 410, 130);
      } else {
        // Packaging tables & boxes
        ctx.fillRect(150, 100, 340, 160);
        ctx.strokeRect(150, 100, 340, 160);
        ctx.fillStyle = '#304673';
        ctx.font = '10px Orbitron';
        ctx.fillText("INSPECTION & PACKAGING TABLE", 220, 185);
      }

      // Draw workers and bounding boxes
      const currentList = workersRef.current[activeZoneId] || [];
      currentList.forEach(worker => {
        // Move worker
        worker.x += worker.vx;
        worker.y += worker.vy;

        // Wall collisions
        if (worker.x < 30 || worker.x > canvas.width - 30) worker.vx *= -1;
        if (worker.y < 30 || worker.y > canvas.height - 30) worker.vy *= -1;

        // Machinery collisions (rough check)
        if (activeZoneId === 'ZoneA' && worker.y > 130 && worker.y < 230) {
          worker.vy *= -1;
        }

        // Draw detection box
        const boxWidth = 36;
        const boxHeight = 64;
        const boxX = worker.x - boxWidth / 2;
        const boxY = worker.y - boxHeight / 2;

        // Determine styling based on safety helmet check
        const isSafe = worker.hasHelmet;
        ctx.strokeStyle = isSafe ? '#10b981' : '#ef4444';
        ctx.lineWidth = 2;
        ctx.fillStyle = isSafe ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)';

        // Draw bounding box
        ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
        ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);

        // Draw corner brackets
        ctx.strokeStyle = isSafe ? '#34d399' : '#f87171';
        ctx.lineWidth = 3;
        // Top-left corner
        ctx.beginPath(); ctx.moveTo(boxX, boxY + 10); ctx.lineTo(boxX, boxY); ctx.lineTo(boxX + 10, boxY); ctx.stroke();
        // Top-right corner
        ctx.beginPath(); ctx.moveTo(boxX + boxWidth, boxY + 10); ctx.lineTo(boxX + boxWidth, boxY); ctx.lineTo(boxX + boxWidth - 10, boxY); ctx.stroke();
        // Bottom-left corner
        ctx.beginPath(); ctx.moveTo(boxX, boxY + boxHeight - 10); ctx.lineTo(boxX, boxY + boxHeight); ctx.lineTo(boxX + 10, boxY + boxHeight); ctx.stroke();
        // Bottom-right corner
        ctx.beginPath(); ctx.moveTo(boxX + boxWidth, boxY + boxHeight - 10); ctx.lineTo(boxX + boxWidth, boxY + boxHeight); ctx.lineTo(boxX + boxWidth - 10, boxY + boxHeight); ctx.stroke();

        // Draw classification tag
        ctx.fillStyle = isSafe ? '#10b981' : '#ef4444';
        ctx.fillRect(boxX - 1, boxY - 14, 75, 14);

        ctx.fillStyle = '#000000';
        ctx.font = 'bold 9px Orbitron';
        ctx.fillText(`WK-${String(worker.id).padStart(2, '0')} ${isSafe ? 'HELMET' : 'NO_HELMET'}`, boxX + 3, boxY - 4);

        // Draw visual indicator for worker position (head circle inside box)
        ctx.fillStyle = isSafe ? '#34d399' : '#f87171';
        ctx.beginPath();
        ctx.arc(worker.x, worker.y - 18, 5, 0, Math.PI * 2);
        ctx.fill();
      });

      // Overlay Scanline effect (faint screen lines)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.015)';
      for (let y = 0; y < canvas.height; y += 4) {
        ctx.fillRect(0, y, canvas.width, 2);
      }

      // Draw CCTV camera lens vignette
      const gradient = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, canvas.height / 2,
        canvas.width / 2, canvas.height / 2, canvas.width
      );
      gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0.7)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      setFrame(prev => prev + 1);
      animationId = requestAnimationFrame(updateAndDraw);
    };

    updateAndDraw();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [activeZoneId, zones]);

  // 1. Estimated Power Change calculation helper
  const getPowerChange = () => {
    const workers = activeZone.workers;
    if (workers === 0) {
      return { val: '-1.5', unit: 'kW', label: '최대 절감 (무인)', color: 'var(--color-green)' };
    }
    if (workers >= 4) {
      const added = ((workers - 3) * 0.4).toFixed(1);
      return { val: `+${added}`, unit: 'kW', label: '과밀 부하 증가', color: 'var(--color-red)' };
    }
    return { val: '-0.3', unit: 'kW', label: '최적화 절감 중', color: 'var(--color-green)' };
  };

  // 2. Recommended ventilation level calculation helper
  const getVentilationRate = () => {
    const w = activeZone.workers;
    if (w === 0) return { pct: 10, label: '최소 환기 (무인)' };
    if (w === 1) return { pct: 25, label: '일반 환기 (저부하)' };
    if (w === 2) return { pct: 40, label: '적정 환기 (보통)' };
    if (w === 3) return { pct: 55, label: '적정 환기 (보통)' };
    if (w === 4) return { pct: 75, label: '집중 환기 (과밀)' };
    return { pct: 100, label: '최대 환기 (위험)' };
  };

  // 3. Density hazard level helper
  const getDensityRisk = () => {
    const w = activeZone.workers;
    if (w === 0) return { text: '무인 (EMPTY)', color: 'var(--color-green)', bg: 'var(--color-green-glow)' };
    if (w >= 1 && w <= 3) return { text: '안전 (NORMAL)', color: 'var(--color-cyan)', bg: 'var(--color-cyan-glow)' };
    if (w >= 4 && w <= 5) return { text: '과밀 (CROWDED)', color: 'var(--color-amber)', bg: 'var(--color-amber-glow)' };
    return { text: '위험 (OVERCROWD)', color: 'var(--color-red)', bg: 'var(--color-red-glow)' };
  };

  // Determine if there is a safety helmet violation in the current zone
  const hasSafetyViolation = (workersRef.current[activeZoneId] || []).some(w => !w.hasHelmet);

  return (
    <div className="card-panel" style={{ display: 'flex', flexDirection: 'column', height: 'auto' }}>
      <div className="card-panel-header">
        <div className="card-panel-title">
          <Camera size={18} className="logo-icon" />
          <span>Vision AI 실시간 CCTV 모니터링</span>
        </div>
        <span className="card-panel-action" style={{ fontFamily: 'var(--font-mono)' }}>
          CAM_FEED_0{Object.keys(zones).indexOf(activeZoneId) + 1}
        </span>
      </div>

      <div className="cctv-viewport">
        {/* CCTV Meta Indicators */}
        <div className="cctv-indicator">
          <div className="status-dot active" style={{ backgroundColor: 'var(--color-red)' }}></div>
          <span>REC LIVE</span>
        </div>
        <div className="cctv-time">
          {new Date().toLocaleDateString('ko-KR')} | {new Date().toLocaleTimeString('ko-KR')}
        </div>
        
        {/* HTML5 Canvas for simulating live worker object detection */}
        <canvas 
          ref={canvasRef} 
          width={640} 
          height={360} 
          style={{ width: '100%', height: '100%', display: 'block' }}
        />

        {/* Warnings overlay in case of danger */}
        {hasSafetyViolation && (
          <div style={{
            position: 'absolute',
            bottom: '1rem',
            left: '1rem',
            background: 'rgba(239, 68, 68, 0.85)',
            color: 'white',
            padding: '0.4rem 0.8rem',
            borderRadius: '4px',
            fontSize: '0.75rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            animation: 'pulse 1s infinite alternate',
            zIndex: 10,
            border: '1px solid #ef4444',
            fontFamily: 'var(--font-sans)',
            fontWeight: 600
          }}>
            <ShieldAlert size={14} />
            <span>안전 경고: 보호구(헬멧) 미착용 작업자 감지됨!</span>
          </div>
        )}
      </div>

      {/* CCTV Camera Selectors */}
      <div className="cctv-controls">
        {Object.entries(zones).map(([zId, zone], idx) => (
          <button
            key={zId}
            className={`cctv-btn ${activeZoneId === zId ? 'active' : ''}`}
            onClick={() => onZoneChange(zId)}
          >
            <span>CAM_0{idx + 1}</span>
          </button>
        ))}
      </div>

      {/* Slider simulation to change workers */}
      <div style={{ marginTop: '1rem', background: 'rgba(255, 255, 255, 0.02)', padding: '0.75rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.03)' }}>
        <div className="slider-group">
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 500 }}>
            <Users size={14} className="logo-icon" />
            {activeZone.name} 작업 인원 변경 시뮬레이션
          </span>
          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--color-green)' }}>
            {activeZone.workers} 명
          </span>
        </div>
        <input 
          type="range" 
          min="0" 
          max="8" 
          value={activeZone.workers} 
          onChange={handleSliderChange}
          style={{ width: '100%', marginTop: '0.5rem', accentColor: 'var(--color-green)' }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
          <span>0명 (무인 구역)</span>
          <span>4명 (과밀 기준)</span>
          <span>8명 (최대)</span>
        </div>
      </div>

      {/* Aegis AI Real-time Equipment Control & Recommendation Analyzer */}
      <div style={{ 
        marginTop: '1.25rem', 
        display: 'flex', 
        flexDirection: 'column', 
        minHeight: '220px',
        background: 'rgba(21, 29, 48, 0.4)', 
        border: '1px solid var(--border-color)', 
        borderRadius: '12px',
        padding: '1.15rem 1.25rem',
        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)'
      }}>
        {/* Header */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          borderBottom: '1px solid rgba(255, 255, 255, 0.05)', 
          paddingBottom: '0.65rem',
          marginBottom: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-green)' }}>
            <Activity size={16} className="logo-icon" style={{ color: 'var(--color-green)', animationDuration: '3s' }} />
            <span>실시간 AI 설비 운영 추천 및 제어 분석기</span>
          </div>
          <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
            Aegis AI Analyzer
          </span>
        </div>

        {/* Content Columns */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: '1rem', flex: 1 }}>
          
          {/* Left Column: Real-time Control State */}
          <div style={{
            background: 'var(--bg-secondary)',
            border: '1px solid rgba(255, 255, 255, 0.03)',
            borderRadius: '8px',
            padding: '0.85rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.6rem',
            justifyContent: 'space-between'
          }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-cyan)', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.4rem', marginBottom: '0.2rem' }}>
              ⚡ {activeZone.name.split(':')[0]} 설비 제어 상태
            </div>
            
            {/* Lights */}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>💡 조명 밝기</span>
              <span style={{ fontWeight: 700, color: activeZone.lights > 20 ? 'var(--color-amber)' : 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                {activeZone.lights}%
              </span>
            </div>
            {/* Ventilation */}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>🌀 환기 속도</span>
              <span style={{ fontWeight: 700, color: activeZone.ventilation > 0 ? 'var(--color-cyan)' : 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                {activeZone.ventilation}%
              </span>
            </div>
            {/* Standby Power */}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>🔌 대기전력 차단</span>
              <span style={{
                fontWeight: 700,
                fontSize: '0.7rem',
                color: activeZone.standbyPowerCut ? 'var(--color-green)' : 'var(--color-cyan)',
                background: activeZone.standbyPowerCut ? 'var(--color-green-glow)' : 'var(--color-cyan-glow)',
                padding: '2px 6px',
                borderRadius: '4px',
                border: `1px solid ${activeZone.standbyPowerCut ? 'rgba(16, 185, 129, 0.2)' : 'rgba(6, 182, 212, 0.2)'}`
              }}>
                {activeZone.standbyPowerCut ? "차단 (절전)" : "해제 (가동)"}
              </span>
            </div>
            {/* Mode status */}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '0.4rem', marginTop: '0.2rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>제어 방식</span>
              <span style={{ color: isAiEnabled ? 'var(--color-green)' : 'var(--color-amber)', fontWeight: 700 }}>
                {isAiEnabled ? "🤖 AI 자율 최적화" : "⚙️ 수동 오버라이드"}
              </span>
            </div>
          </div>

          {/* Right Column: AI Operational Recommendation & Reasoning */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', justifyContent: 'space-between' }}>
            
            {/* Recommendation */}
            <div style={{
              background: 'rgba(6, 182, 212, 0.03)',
              border: '1px solid rgba(6, 182, 212, 0.15)',
              borderRadius: '8px',
              padding: '0.75rem 0.85rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.3rem',
              flex: 1,
              overflowY: 'auto'
            }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--color-cyan)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                📋 AI 설비 운영 추천 가이드
              </div>
              <div style={{ fontSize: '0.75rem', color: '#fff', lineHeight: 1.45, fontWeight: 500 }}>
                {equipmentRecommendations[activeZoneId] || "분석 대기 중... AI 에이전트가 상태를 확인하고 조치 가이드를 구성하고 있습니다."}
              </div>
            </div>

            {/* Reasoning / Latest Decision Log */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.01)',
              border: '1px solid rgba(255, 255, 255, 0.04)',
              borderRadius: '8px',
              padding: '0.75rem 0.85rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.3rem',
              flex: 1,
              overflowY: 'auto'
            }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 700 }}>
                🧠 AI 제어 의사결정 근거 (Reasoning)
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.45, fontStyle: 'italic' }}>
                {(() => {
                  const zoneLogs = logs.filter(l => l.zone === activeZoneId);
                  const latestLog = zoneLogs[zoneLogs.length - 1];
                  if (latestLog) {
                    if (latestLog.message.includes("사유: ")) {
                      return latestLog.message.split("사유: ")[1];
                    }
                    return latestLog.message;
                  }
                  return "대기 중: 해당 구역에 대한 최근 AI 자율제어 의사결정 기록이 없습니다.";
                })()}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default CCTVPanel;
