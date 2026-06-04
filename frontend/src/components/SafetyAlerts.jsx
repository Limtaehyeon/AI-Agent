import React, { useState } from 'react';
import { ShieldAlert, ShieldCheck, Volume2, CheckCircle2, Megaphone } from 'lucide-react';

const SafetyAlerts = ({ alerts, onTriggerBroadcast }) => {
  const [broadcastingId, setBroadcastingId] = useState(null);

  const handleBroadcastClick = async (alertId) => {
    setBroadcastingId(alertId);
    if (onTriggerBroadcast) {
      await onTriggerBroadcast(alertId);
    }
    setBroadcastingId(null);
  };

  return (
    <div className="card-panel" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="card-panel-header">
        <div className="card-panel-title">
          <ShieldAlert size={18} className="logo-icon" style={{ color: alerts.length > 0 ? 'var(--color-red)' : 'var(--color-green)' }} />
          <span>산업 현장 위험 및 안전 이상 상황 감지 (CCTV)</span>
        </div>
        <span className="card-panel-action" style={{ color: alerts.length > 0 ? 'var(--color-red)' : 'var(--color-green)', fontWeight: 600 }}>
          {alerts.length > 0 ? `경보 ${alerts.length}건` : '정상 운영 중'}
        </span>
      </div>

      <div className="alerts-list" style={{ overflowY: 'auto', flex: 1 }}>
        {alerts.length === 0 ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            padding: '1.5rem',
            background: 'rgba(16, 185, 129, 0.03)',
            border: '1px dashed rgba(16, 185, 129, 0.2)',
            borderRadius: '8px',
            color: 'var(--color-green)',
            fontSize: '0.8rem'
          }}>
            <ShieldCheck size={18} />
            <span>안전 상태 양호: 실시간 위반 사항 및 무단 침입 사건 감지되지 않음</span>
          </div>
        ) : (
          alerts.map((alert) => {
            const isDanger = alert.level === 'danger';
            return (
              <div 
                key={alert.id} 
                className={`alert-item ${isDanger ? 'danger' : 'warning'}`}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                  padding: '0.75rem',
                  marginBottom: '0.5rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem', width: '100%' }}>
                  <ShieldAlert size={18} className="alert-item-icon" style={{ marginTop: '0.2rem', flexShrink: 0 }} />
                  <div className="alert-item-content" style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1.25rem', width: '100%', alignItems: 'center', marginBottom: '0.35rem' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                        {isDanger ? '🚨 위험 (L1 CRITICAL)' : '⚠️ 경고 (L2 WARNING)'}
                      </span>
                      <span className="alert-item-time" style={{ fontSize: '0.7rem', opacity: 0.8, fontFamily: 'var(--font-mono)' }}>
                        {alert.timestamp}
                      </span>
                    </div>
                    <span style={{ fontSize: '0.8rem', display: 'block', lineHeight: 1.5, color: '#fff', letterSpacing: '0.01em' }}>
                      {alert.message}
                    </span>
                  </div>
                </div>

                {/* Warning broadcast verification controls */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                  paddingTop: '0.5rem',
                  marginTop: '0.35rem',
                  fontSize: '0.75rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                    <Megaphone size={12} style={{ color: alert.broadcastVerified ? 'var(--color-green)' : 'var(--color-amber)' }} />
                    <span style={{ color: 'var(--text-secondary)' }}>경고 방송 검증 상태:</span>
                    <span style={{
                      fontWeight: 700,
                      color: alert.broadcastVerified ? 'var(--color-green)' : 'var(--color-amber)',
                      background: alert.broadcastVerified ? 'var(--color-green-glow)' : 'rgba(245, 158, 11, 0.1)',
                      padding: '2px 6px',
                      borderRadius: '3px',
                      fontSize: '0.7rem'
                    }}>
                      {alert.broadcastVerified ? '검증 완료 (VERIFIED)' : '검증 대기중 (PENDING)'}
                    </span>
                  </div>

                  {!alert.broadcastVerified ? (
                    <button
                      onClick={() => handleBroadcastClick(alert.id)}
                      disabled={broadcastingId === alert.id}
                      style={{
                        background: 'rgba(245, 158, 11, 0.15)',
                        border: '1px solid var(--color-amber)',
                        borderRadius: '4px',
                        color: 'var(--color-amber)',
                        fontSize: '0.7rem',
                        padding: '0.25rem 0.6rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        fontWeight: 600,
                        transition: 'all 0.2s',
                        whiteSpace: 'nowrap'
                      }}
                      onMouseOver={(e) => { e.currentTarget.style.background = 'var(--color-amber)'; e.currentTarget.style.color = '#000'; }}
                      onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(245, 158, 11, 0.15)'; e.currentTarget.style.color = 'var(--color-amber)'; }}
                    >
                      <Volume2 size={10} className={broadcastingId === alert.id ? 'fan-spin' : ''} />
                      <span>🔊 경고 방송 송출</span>
                    </button>
                  ) : (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', color: 'var(--color-green)', fontWeight: 600, fontSize: '0.7rem' }}>
                      <CheckCircle2 size={12} />
                      <span>방송 송출 완료</span>
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default SafetyAlerts;
