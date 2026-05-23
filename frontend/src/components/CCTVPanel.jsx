import React, { useRef, useEffect, useState } from 'react';
import { Camera, AlertTriangle, Users, ShieldAlert } from 'lucide-react';

const CCTVPanel = ({ zones, activeZoneId, onZoneChange, onWorkerCountChange }) => {
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

  // Determine if there is a safety helmet violation in the current zone
  const hasSafetyViolation = (workersRef.current[activeZoneId] || []).some(w => !w.hasHelmet);

  return (
    <div className="card-panel" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
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
    </div>
  );
};

export default CCTVPanel;
