import React, { useState } from 'react';
import { ShieldAlert, ShieldCheck, CheckCircle2, Megaphone } from 'lucide-react';

const parseAlertMessage = (message) => {
  if (!message) return { category: '안전 경보', zones: ['현장 전역'], description: '', action: '상황 확인 및 대응이 필요합니다.' };

  let category = '안전 경보';
  let zones = [];
  let description = '';
  let action = '';

  // 1. Extract bracketed category (e.g. [안전 위반])
  let text = message.trim();
  const bracketMatch = text.match(/^\[([^\]]+)\]/);
  if (bracketMatch) {
    category = bracketMatch[1];
    text = text.replace(/^\[[^\]]+\]\s*/, '').trim();
  } else if (text.includes('밀집도')) {
    category = '밀집도 초과';
  }

  // 2. Extract zones (e.g. Zone C: 조립 구역 (Assembly Area), Zone D)
  const zoneRegex = /(Zone\s*[A-D](?:\s*:\s*[^,!(]+(?:\([^)]+\))?|\([^)]+\))?)/gi;
  const matches = text.match(zoneRegex);

  if (matches) {
    zones = matches.map(z => {
      let cleaned = z.trim();
      // Remove trailing Korean postpositions or keywords
      cleaned = cleaned.replace(/(?:에서|의|구역|구역의)$/, '').trim();
      return cleaned;
    });

    // Find end of zones to get the rest of text
    let lastMatchIndex = 0;
    let lastMatchLen = 0;
    let match;
    zoneRegex.lastIndex = 0;
    while ((match = zoneRegex.exec(text)) !== null) {
      lastMatchIndex = match.index;
      lastMatchLen = match[0].length;
    }

    let rest = text.substring(lastMatchIndex + lastMatchLen).trim();
    // Clean up leading punctuation or words like "에서", "및", etc.
    rest = rest.replace(/^(?:에서|의|구역의|및|,\s*|에서\s*)+/, '').trim();
    text = rest;
  }

  // 3. Separate description and action
  if (text.includes('!')) {
    const parts = text.split('!');
    description = parts[0].trim() + '!';
    action = parts.slice(1).join('!').trim();
  } else if (text.includes('.')) {
    const parts = text.split('.');
    description = parts[0].trim() + '.';
    action = parts.slice(1).join('.').trim();
  } else {
    const parenMatch = text.match(/\(([^)]+)\)$/);
    if (parenMatch) {
      action = parenMatch[0];
      description = text.replace(/\(([^)]+)\)$/, '').trim();
    } else {
      description = text;
      action = '즉시 현장 상황을 파악하고 대처하십시오.';
    }
  }

  if (!action) {
    action = '즉시 현장 상황을 파악하고 대처하십시오.';
  }

  return {
    category,
    zones: zones.length > 0 ? zones : ['현장 전역'],
    description,
    action
  };
};

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

      <div className="alerts-list" style={{ overflowY: 'auto', flex: 1, paddingRight: '4px' }}>
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
            const parsed = parseAlertMessage(alert.message);

            return (
              <div 
                key={alert.id} 
                className={`alert-item ${isDanger ? 'danger' : 'warning'}`}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.6rem',
                  padding: '0.85rem',
                  marginBottom: '0.65rem',
                  borderRadius: '8px',
                  background: isDanger ? 'rgba(239, 68, 68, 0.04)' : 'rgba(245, 158, 11, 0.04)',
                  border: `1px solid ${isDanger ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)'}`
                }}
              >
                {/* Header Row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                    {/* Severity Badge */}
                    <span style={{
                      fontWeight: 700,
                      fontSize: '0.7rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.02em',
                      background: isDanger ? 'rgba(239, 68, 68, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                      border: `1px solid ${isDanger ? 'rgba(239, 68, 68, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
                      color: isDanger ? 'var(--color-red)' : 'var(--color-amber)',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.2rem'
                    }}>
                      <span>{isDanger ? '🚨 위험' : '⚠️ 경고'}</span>
                    </span>

                    {/* Category Badge */}
                    <span style={{
                      fontWeight: 700,
                      fontSize: '0.7rem',
                      background: 'rgba(255, 255, 255, 0.06)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      color: 'var(--text-secondary)',
                      padding: '2px 6px',
                      borderRadius: '4px'
                    }}>
                      {parsed.category}
                    </span>
                  </div>

                  <span className="alert-item-time" style={{ fontSize: '0.7rem', opacity: 0.8, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                    {alert.timestamp}
                  </span>
                </div>

                {/* Location Info */}
                <div style={{ 
                  fontSize: '0.82rem', 
                  color: '#fff', 
                  fontWeight: 700, 
                  marginTop: '0.25rem' 
                }}>
                  {parsed.zones.join(', ')}
                </div>

                {/* Issue Description */}
                <div style={{
                  fontSize: '0.8rem',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.4,
                  marginTop: '0.15rem'
                }}>
                  {parsed.description}
                </div>

                {/* Action Card */}
                <div style={{
                  background: isDanger ? 'rgba(239, 68, 68, 0.08)' : 'rgba(245, 158, 11, 0.08)',
                  borderLeft: `3px solid ${isDanger ? 'var(--color-red)' : 'var(--color-amber)'}`,
                  padding: '0.45rem 0.6rem',
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                  color: isDanger ? '#fee2e2' : '#fef3c7',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  marginTop: '0.1rem'
                }}>
                  <Megaphone size={12} style={{ flexShrink: 0, color: isDanger ? 'var(--color-red)' : 'var(--color-amber)' }} />
                  <div style={{ lineHeight: 1.35 }}>
                    <span style={{ fontWeight: 700, marginRight: '0.25rem' }}>현장 대응 지침:</span>
                    {parsed.action}
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
                  fontSize: '0.75rem',
                  gap: '1rem'
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
                        whiteSpace: 'nowrap',
                        marginLeft: 'auto'
                      }}
                      onMouseOver={(e) => { e.currentTarget.style.background = 'var(--color-amber)'; e.currentTarget.style.color = '#000'; }}
                      onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(245, 158, 11, 0.15)'; e.currentTarget.style.color = 'var(--color-amber)'; }}
                    >
                      <span>🔊 경고 방송 송출</span>
                    </button>
                  ) : (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', color: 'var(--color-green)', fontWeight: 600, fontSize: '0.7rem', marginLeft: 'auto' }}>
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
