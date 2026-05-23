import React from 'react';
import { Terminal, ShieldAlert, Cpu, Eye, Info } from 'lucide-react';

const AgentControlLog = ({ logs }) => {
  // Helper to resolve icon based on log type
  const getLogIcon = (type) => {
    switch (type) {
      case 'system':
        return <Info size={12} style={{ color: 'var(--color-cyan)' }} />;
      case 'ai':
        return <Cpu size={12} style={{ color: 'var(--color-green)' }} />;
      case 'vision':
        return <Eye size={12} style={{ color: 'var(--color-amber)' }} />;
      case 'danger':
        return <ShieldAlert size={12} style={{ color: 'var(--color-red)' }} />;
      default:
        return <Terminal size={12} />;
    }
  };

  const getLogClass = (type) => {
    return `log-entry log-${type}`;
  };

  return (
    <div className="card-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <div className="card-panel-header">
        <div className="card-panel-title">
          <Terminal size={18} className="logo-icon" />
          <span>AI Agent 실시간 자율 운영 의사결정 로그</span>
        </div>
        <span className="card-panel-action">{logs.length}개 기록됨</span>
      </div>

      <div className="logs-container" style={{ flex: 1 }}>
        {logs.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', padding: '2rem' }}>
            대기 중... 로그 데이터가 곧 수집됩니다.
          </div>
        ) : (
          [...logs].reverse().map((log, idx) => (
            <div key={idx} className={getLogClass(log.type)} style={{ marginBottom: '0.4rem' }}>
              <div className="log-meta">
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: 600 }}>
                  {getLogIcon(log.type)}
                  {log.type.toUpperCase()}
                </span>
                <span>{log.timestamp}</span>
              </div>
              <div className="log-message">
                {log.message}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AgentControlLog;
