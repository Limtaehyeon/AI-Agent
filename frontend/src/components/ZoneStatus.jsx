import React from 'react';
import { Lightbulb, Wind, Power, Thermometer, Droplets, Users, ShieldAlert } from 'lucide-react';

const ZoneStatus = ({ zones, activeZoneId, onSelectZone }) => {
  // Density badge formatting helper
  const getDensityBadge = (density) => {
    switch (density) {
      case 'Empty':
        return <span style={{ color: 'var(--color-green)', background: 'var(--color-green-glow)', padding: '2px 6px', borderRadius: '4px', fontSize: '0.7rem' }}>무인 (Empty)</span>;
      case 'Crowded':
        return <span style={{ color: 'var(--color-red)', background: 'var(--color-red-glow)', padding: '2px 6px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 600, animation: 'pulse 1s infinite alternate' }}>밀집 (Crowded)</span>;
      default:
        return <span style={{ color: 'var(--color-cyan)', background: 'var(--color-cyan-glow)', padding: '2px 6px', borderRadius: '4px', fontSize: '0.7rem' }}>정상 (Normal)</span>;
    }
  };

  return (
    <div className="card-panel" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Dynamic inline styles for rotating fan icons */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .fan-spin {
          animation: spin 3s linear infinite;
        }
      `}</style>

      <div className="card-panel-header">
        <div className="card-panel-title">
          <Wind size={18} className="logo-icon" />
          <span>구역별 실시간 설비 및 센서 상태</span>
        </div>
        <span className="card-panel-action">실시간 연동 중</span>
      </div>

      <div className="zone-grid" style={{ flex: 1 }}>
        {Object.entries(zones).map(([zoneId, zone]) => {
          const isActive = activeZoneId === zoneId;
          const isDanger = zone.density === 'Crowded';
          
          // Calculate dynamic animation speed for the fan based on RPM %
          const fanDuration = zone.ventilation > 0 ? `${100 / zone.ventilation}s` : '0s';

          return (
            <div
              key={zoneId}
              className={`zone-card ${isActive ? 'active-zone' : ''} ${isDanger ? 'alert-active' : ''}`}
              onClick={() => onSelectZone(zoneId)}
              style={{
                cursor: 'pointer',
                borderWidth: '1px',
                borderStyle: 'solid',
                borderColor: isActive ? 'var(--color-cyan)' : isDanger ? 'var(--color-red)' : 'var(--border-color)',
                backgroundColor: isActive ? 'rgba(6, 182, 212, 0.03)' : 'var(--bg-secondary)',
                boxShadow: isActive ? '0 0 12px rgba(6, 182, 212, 0.15)' : 'none'
              }}
            >
              {/* Zone Header */}
              <div className="zone-header">
                <span className="zone-title" style={{ color: isActive ? '#fff' : 'var(--text-primary)', fontWeight: isActive ? '700' : '600' }}>
                  {zone.name.split(': ')[0]} <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{zone.name.split(': ')[1]}</span>
                </span>
                <div style={{ display: 'flex', gap: '0.4rem', alignHeight: 'center' }}>
                  {getDensityBadge(zone.density)}
                </div>
              </div>

              {/* Telemetry Metrics */}
              <div className="zone-telemetry-grid">
                <div className="telemetry-item">
                  <span className="telemetry-label">실시간 전력 부하</span>
                  <span className="telemetry-value highlight-cyan">
                    {zone.powerConsumption} <span style={{ fontSize: '0.7rem' }}>kW</span>
                  </span>
                  <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>
                    기준: {zone.basePower} kW
                  </span>
                </div>

                <div className="telemetry-item">
                  <span className="telemetry-label">작업 인원</span>
                  <span className="telemetry-value" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Users size={12} style={{ color: zone.workers > 0 ? 'var(--color-green)' : 'var(--text-secondary)' }} />
                    {zone.workers} 명
                  </span>
                  <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>
                    CCTV 실시간 감지
                  </span>
                </div>
              </div>

              {/* Equipment Control Statuses */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '0.5rem' }}>
                {/* Lighting status */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--text-secondary)' }}>
                    <Lightbulb size={12} style={{ color: zone.lights > 20 ? 'var(--color-amber)' : 'var(--text-muted)' }} />
                    조명 밝기
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: zone.lights > 20 ? 'var(--color-amber)' : 'var(--text-muted)' }}>
                    {zone.lights}%
                  </span>
                </div>

                {/* Ventilation status */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--text-secondary)' }}>
                    <Wind
                      size={12}
                      className={zone.ventilation > 0 ? "fan-spin" : ""}
                      style={{
                        animationDuration: fanDuration,
                        color: zone.ventilation > 0 ? 'var(--color-cyan)' : 'var(--text-muted)'
                      }}
                    />
                    환기 속도 (RPM)
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: zone.ventilation > 0 ? 'var(--color-cyan)' : 'var(--text-muted)' }}>
                    {zone.ventilation}%
                  </span>
                </div>

                {/* Standby power cutoff */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--text-secondary)' }}>
                    <Power size={12} style={{ color: zone.standbyPowerCut ? 'var(--color-green)' : 'var(--text-muted)' }} />
                    대기전력 차단
                  </span>
                  <span style={{
                    fontWeight: 600,
                    fontSize: '0.7rem',
                    color: zone.standbyPowerCut ? 'var(--color-green)' : 'var(--text-muted)',
                    background: zone.standbyPowerCut ? 'var(--color-green-glow)' : 'transparent',
                    padding: zone.standbyPowerCut ? '1px 4px' : '0',
                    borderRadius: '2px'
                  }}>
                    {zone.standbyPowerCut ? "ACTIVE" : "STANDBY"}
                  </span>
                </div>
              </div>

              {/* Environmental Sensors */}
              <div style={{ display: 'flex', gap: '0.75rem', borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '0.5rem', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.15rem' }}>
                  <Thermometer size={10} style={{ color: '#fca5a5' }} />
                  {zone.temp}°C
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.15rem' }}>
                  <Droplets size={10} style={{ color: '#93c5fd' }} />
                  {zone.humidity}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ZoneStatus;
