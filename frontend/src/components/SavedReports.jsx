import React, { useState, useEffect } from 'react';
import { FileText, Calendar, CheckCircle2, AlertCircle, RefreshCw, Download } from 'lucide-react';

const SavedReports = ({ onPreviewReport, refreshTrigger }) => {
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5050';

  const fetchReports = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/reports`);
      if (response.ok) {
        const data = await response.json();
        setReports(data);
      }
    } catch (error) {
      console.error("Error fetching reports:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [refreshTrigger]);

  const handlePreview = async (id) => {
    try {
      const response = await fetch(`${API_BASE}/api/reports/${id}`);
      if (response.ok) {
        const data = await response.json();
        onPreviewReport(data.content);
      }
    } catch (error) {
      console.error("Error fetching report content:", error);
      alert("보고서 내용을 가져오는 중 오류가 발생했습니다.");
    }
  };

  const handleDownload = async (e, id, filename) => {
    e.stopPropagation(); // Prevent preview overlay trigger
    try {
      const response = await fetch(`${API_BASE}/api/reports/${id}`);
      if (response.ok) {
        const data = await response.json();
        const element = document.createElement("a");
        const file = new Blob([data.content], { type: 'text/markdown' });
        element.href = URL.createObjectURL(file);
        element.download = filename;
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
      }
    } catch (error) {
      console.error("Error downloading report:", error);
      alert("보고서 파일 다운로드 중 오류가 발생했습니다.");
    }
  };

  // Helper to format date
  const formatDate = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  return (
    <div className="card-panel" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="card-panel-header">
        <div className="card-panel-title">
          <FileText size={18} className="logo-icon" style={{ color: 'var(--color-cyan)' }} />
          <span>자동 보관된 운영 보고서 내역</span>
        </div>
        <button 
          onClick={fetchReports} 
          disabled={isLoading}
          style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
        >
          <RefreshCw size={12} className={isLoading ? 'fan-spin' : ''} />
          <span style={{ fontSize: '0.7rem' }}>새로고침</span>
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingRight: '2px' }}>
        {isLoading && reports.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            보관된 보고서 로딩 중...
          </div>
        ) : reports.length === 0 ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
            background: 'rgba(255,255,255,0.01)',
            border: '1px dashed var(--border-color)',
            borderRadius: '8px',
            color: 'var(--text-secondary)',
            fontSize: '0.8rem',
            textAlign: 'center',
            height: '100%'
          }}>
            <FileText size={24} style={{ marginBottom: '0.5rem', opacity: 0.5 }} />
            <span>저장된 보고서가 없습니다.<br />(AI 자율 모드가 가동되면 1분마다 보고서가 자동 자동 보관됩니다.)</span>
          </div>
        ) : (
          reports.map((report) => {
            const isAuto = report.filename.startsWith('auto_');
            const broadcastRate = report.alerts_count > 0 
              ? Math.round((report.broadcast_count / report.alerts_count) * 100)
              : 100;

            return (
              <div
                key={report.id}
                onClick={() => handlePreview(report.id)}
                style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  padding: '0.65rem 0.8rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'all 0.2s',
                  position: 'relative'
                }}
                onMouseOver={(e) => { e.currentTarget.style.borderColor = 'var(--color-cyan)'; e.currentTarget.style.background = 'var(--bg-card-hover)'; }}
                onMouseOut={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.background = 'var(--bg-secondary)'; }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span style={{
                      fontSize: '0.6rem',
                      fontWeight: 'bold',
                      padding: '1px 5px',
                      borderRadius: '3px',
                      background: isAuto ? 'var(--color-cyan-glow)' : 'var(--color-green-glow)',
                      color: isAuto ? 'var(--color-cyan)' : 'var(--color-green)',
                      border: `1px solid ${isAuto ? 'rgba(6,182,212,0.2)' : 'rgba(16,185,129,0.2)'}`
                    }}>
                      {isAuto ? 'AUTO' : 'MANUAL'}
                    </span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#fff' }}>
                      {isAuto ? `실시간 자율 운영 보고서 #${report.id}` : `수동 운영 분석 보고서 #${report.id}`}
                    </span>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.65rem', color: 'var(--text-secondary)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.15rem' }}>
                      <Calendar size={10} />
                      {formatDate(report.created_at)}
                    </span>
                  </div>
                </div>

                <div 
                  onClick={(e) => handleDownload(e, report.id, report.filename)}
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    color: 'var(--color-cyan)', 
                    opacity: 0.8,
                    padding: '0.25rem',
                    borderRadius: '4px',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => { e.currentTarget.style.background = 'var(--color-cyan-glow)'; }}
                  onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <Download size={14} />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default SavedReports;
