import React from 'react';
import { ShieldAlert, CheckCircle, ShieldCheck } from 'lucide-react';

const SafetyAlerts = ({ alerts }) => {
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

      <div className="alerts-list">
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
          alerts.map((alert) => (
            <div key={alert.id} className={`alert-item ${alert.level === 'danger' ? 'danger' : 'warning'}`}>
              <ShieldAlert size={16} className="alert-item-icon" />
              <div className="alert-item-content">
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', width: '100%' }}>
                  <span style={{ fontWeight: 600 }}>{alert.level === 'danger' ? '위험 (DANGER)' : '경고 (WARNING)'}</span>
                  <span className="alert-item-time">{alert.timestamp}</span>
                </div>
                <span style={{ marginTop: '0.15rem' }}>{alert.message}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default SafetyAlerts;
