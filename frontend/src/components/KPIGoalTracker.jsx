import React, { useState } from 'react';
import { Target, Timer, Zap, BellRing, ShieldAlert, HelpCircle } from 'lucide-react';

const KPIGoalTracker = ({ kpis }) => {
  const [hoveredGoal, setHoveredGoal] = useState(null);

  const getKpiActual = (kpiId) => {
    if (!kpis) return '대기중';
    const val = kpis[kpiId];
    if (val === undefined || val === 0) return '대기중';
    
    switch (kpiId) {
      case 'accuracy': return `${val}%`;
      case 'speed': return `${val}초`;
      case 'powerSavings': return `${val}%`;
      case 'responseTime': return `${val}%`;
      case 'detectionRate': return `${val}%`;
      default: return '대기중';
    }
  };

  const getKpiProgress = (kpiId) => {
    if (!kpis) return '0%';
    const val = kpis[kpiId];
    if (val === undefined || val === 0) return '0%';
    
    switch (kpiId) {
      case 'accuracy': return `${val}%`;
      case 'speed': 
        return `${Math.max(10, Math.min(100, Math.round((1.0 - val) * 100)))}%`;
      case 'powerSavings': 
        return `${Math.max(10, Math.min(100, Math.round((val / 30) * 100)))}%`;
      case 'responseTime': 
        return `${Math.max(10, Math.min(100, Math.round((val / 40) * 100)))}%`;
      case 'detectionRate': 
        return `${val}%`;
      default: return '0%';
    }
  };

  const isKpiAchieved = (kpiId) => {
    if (!kpis) return false;
    const val = kpis[kpiId];
    if (val === undefined || val === 0) return false;
    
    switch (kpiId) {
      case 'accuracy': return val >= 90.0;
      case 'speed': return val <= 1.0;
      case 'powerSavings': return val >= 20.0;
      case 'responseTime': return val >= 30.0;
      case 'detectionRate': return val >= 85.0;
      default: return false;
    }
  };

  const goals = [
    {
      id: 'accuracy',
      title: 'Vision 객체 탐지 정확도',
      icon: <Target size={20} />,
      target: '90.0%',
      color: 'var(--color-green)',
      glowColor: 'var(--color-green-glow)',
      criteria: '현장 CCTV 비디오 데이터셋(1,200개 학습/검증 이미지)에서 안전모 미착용 작업자 및 위험 구역 침입 인원에 대한 바운딩 박스 탐지의 평균 정밀도(mAP@0.5) 기준입니다.',
    },
    {
      id: 'speed',
      title: '실시간 처리 속도',
      icon: <Timer size={20} />,
      target: '1.0초 이내',
      color: 'var(--color-cyan)',
      glowColor: 'var(--color-cyan-glow)',
      criteria: 'Vision Edge 장비에서 미디어 스트림 프레임을 디코딩한 시점부터 객체 감지, 제어 제안 연산, 그리고 UI 대시보드 상태 갱신이 최종 완료되기까지의 단방향 지연시간(Latency) 평균입니다.',
    },
    {
      id: 'powerSavings',
      title: '에너지 전력 절감량',
      icon: <Zap size={20} />,
      target: '20% ~ 30%',
      color: 'var(--color-green)',
      glowColor: 'var(--color-green-glow)',
      criteria: 'AI 자율 제어 모드가 비활성화되어 모든 설비(조명 최대, 환기팬 표준, 대기전력 상시 유지)가 기본 모드로 동작할 때의 소비 전력(Baseline) 대비, 실시간 디밍 및 대기 차단이 실행될 때의 소비 전력 절감비율입니다.',
    },
    {
      id: 'responseTime',
      title: '운영 대응 시간 단축',
      icon: <BellRing size={20} />,
      target: '30.0% 단축',
      color: 'var(--color-amber)',
      glowColor: 'var(--color-amber-glow)',
      criteria: '위험 상황(예: 보호구 미착용) 감지 경보가 최초 발생한 시점부터 관리자의 경고 방송(Broadcast)이 송출되거나 현장 조치가 보고되어 시스템 상태가 안전(Normal)으로 회복되는 시간의 단축 수준(기존 수동 대응 평균 시간 대비)입니다.',
    },
    {
      id: 'detectionRate',
      title: '위험 이벤트 감지율',
      icon: <ShieldAlert size={20} />,
      target: '85.0% 이상',
      color: 'var(--color-cyan)',
      glowColor: 'var(--color-cyan-glow)',
      criteria: '테스트 시나리오(인원 과밀 50회, 헬멧 미착용 50회, 위험지역 진입 20회 등 총 120회 임의 유도 상황) 중, AI 에이전트 및 로컬 비전 알고리즘이 누락 없이 위반 경보를 즉각 띄운 비율입니다.',
    }
  ];

  return (
    <div className="card-panel" style={{ display: 'flex', flexDirection: 'column' }}>
      <div className="card-panel-header">
        <div className="card-panel-title">
          <Target size={18} className="logo-icon" style={{ color: 'var(--color-cyan)' }} />
          <span>산업성 정량적 목표 평가 대시보드</span>
        </div>
        <span className="card-panel-action" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
          <HelpCircle size={14} style={{ color: 'var(--color-cyan)' }} />
          카드 위에 마우스를 올리면 평가 기준이 표시됩니다
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
        {goals.map((goal) => {
          const isHovered = hoveredGoal === goal.id;
          const actualVal = getKpiActual(goal.id);
          const activeProgress = getKpiProgress(goal.id);
          const isGoalMet = isKpiAchieved(goal.id);

          return (
            <div
              key={goal.id}
              style={{
                background: 'var(--bg-secondary)',
                border: `1px solid ${isHovered ? goal.color : 'var(--border-color)'}`,
                borderRadius: '8px',
                padding: '0.85rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'all 0.25s ease',
                position: 'relative',
                boxShadow: isHovered ? `0 0 10px ${goal.glowColor}` : 'none',
                minHeight: '135px',
                cursor: 'pointer'
              }}
              onMouseEnter={() => setHoveredGoal(goal.id)}
              onMouseLeave={() => setHoveredGoal(null)}
            >
              <div>
                {/* Header info */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '6px',
                    background: goal.glowColor,
                    color: goal.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {goal.icon}
                  </div>
                  <span style={{
                    fontSize: '0.65rem',
                    fontWeight: 600,
                    padding: '2px 6px',
                    borderRadius: '4px',
                    background: isGoalMet ? 'var(--color-green-glow)' : 'rgba(255, 255, 255, 0.05)',
                    color: isGoalMet ? 'var(--color-green)' : 'var(--text-secondary)',
                    border: `1px solid ${isGoalMet ? 'rgba(16, 185, 129, 0.2)' : 'var(--border-color)'}`
                  }}>
                    {isGoalMet ? '목표 달성' : actualVal === '대기중' ? '측정 대기' : '분석 중'}
                  </span>
                </div>

                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {goal.title}
                </div>
              </div>

              {/* Progress and values */}
              <div style={{ marginTop: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>
                  <span>목표: {goal.target}</span>
                  <span style={{ fontWeight: 700, color: actualVal === '대기중' ? 'var(--text-muted)' : goal.color }}>
                    실측: {actualVal}
                  </span>
                </div>
                {/* Progress bar */}
                <div style={{ width: '100%', height: '4px', background: 'var(--border-color)', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{
                    width: activeProgress,
                    height: '100%',
                    background: goal.color,
                    boxShadow: `0 0 4px ${goal.color}`,
                    transition: 'width 0.4s ease-out'
                  }}></div>
                </div>
              </div>

              {/* Floating Criteria Tooltip Overlay */}
              {isHovered && (
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  background: 'rgba(16, 21, 36, 0.96)',
                  borderRadius: '8px',
                  padding: '0.6rem',
                  zIndex: 20,
                  fontSize: '0.65rem',
                  lineHeight: '1.4',
                  color: 'var(--text-primary)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  border: `1px solid ${goal.color}`
                }}>
                  <strong style={{ color: goal.color, marginBottom: '0.2rem' }}>🔍 산정 기준:</strong>
                  {goal.criteria}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default KPIGoalTracker;
