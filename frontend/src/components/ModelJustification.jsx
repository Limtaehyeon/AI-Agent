import React from 'react';
import { Cpu, Brain, Layers, ShieldCheck, Zap } from 'lucide-react';

const ModelJustification = () => {
  return (
    <div className="card-panel" style={{ display: 'flex', flexDirection: 'column' }}>
      <div className="card-panel-header">
        <div className="card-panel-title">
          <Layers size={18} className="logo-icon" style={{ color: 'var(--color-green)' }} />
          <span>CCTV & 설비 제어 AI 모델 구성 및 도입 사유</span>
        </div>
        <span className="card-panel-action" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--color-green)' }}>
          DUAL-AI ARCHITECTURE
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
        {/* Left Side: YOLO Edge Vision */}
        <div style={{
          background: 'rgba(21, 29, 48, 0.4)',
          border: '1px solid var(--border-color)',
          borderRadius: '8px',
          padding: '1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
            <Cpu size={20} style={{ color: 'var(--color-cyan)' }} />
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff' }}>1. Edge 비전 분석 모델 (YOLOv8 Custom)</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            <div>
              <strong style={{ color: '#fff' }}>🎯 역할:</strong> 실시간 객체 탐지 (인원 계산, 안전모 미착용 식별, 구역 무단 침입 감지)
            </div>
            <div>
              <strong style={{ color: '#fff' }}>💡 선정 이유:</strong>
              <ul style={{ paddingLeft: '1.1rem', marginTop: '0.2rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <li>초당 30프레임 이상의 CCTV 미디어 피드를 로컬(Edge 디바이스)에서 <strong style={{ color: 'var(--color-cyan)' }}>실시간 처리(지연시간 &lt; 50ms)</strong>하기 위해 초경량 객체 감지 알고리즘 필수.</li>
                <li>한정된 임베디드 리소스에서도 대기전력 소모를 최소화하며 고성능 모니터링 가능.</li>
                <li>보안 상의 이유로 현장 비디오 피드를 외부 클라우드로 전송하지 않고 로컬에서 즉각 분석하여 개인정보 및 데이터 유출 방지.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Right Side: Gemini Flash Agent */}
        <div style={{
          background: 'rgba(21, 29, 48, 0.4)',
          border: '1px solid var(--border-color)',
          borderRadius: '8px',
          padding: '1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
            <Brain size={20} style={{ color: 'var(--color-green)' }} />
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff' }}>2. Cognitive AI 에이전트 (Gemini Flash)</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            <div>
              <strong style={{ color: '#fff' }}>🎯 역할:</strong> 인과 분석, 위험 상황 조치 우선순위 평가, 구역 설비 운영 의사결정 및 보고서 자동 작성
            </div>
            <div>
              <strong style={{ color: '#fff' }}>💡 선정 이유:</strong>
              <ul style={{ paddingLeft: '1.1rem', marginTop: '0.2rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <li>단순 룰 기반 제어(Rule-based)의 한계를 넘어 온도, 습도, 작업 인원, 경보 기록 등을 종합해 최적의 <strong style={{ color: 'var(--color-green)' }}>설비 제어 우선순위 및 행동(Action)</strong>을 추론.</li>
                <li>사건 로그 데이터를 다각도로 파악하여 관리자가 위험에 신속히 대응할 수 있도록 우선순위를 판정(Critical, Warning, Info).</li>
                <li>자연어 질의(Chatbot) 대응 및 하루 운영 데이터를 종합하여 일일 보고서를 마크다운 문서로 자동 요약하는 생성형 역량 보유.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div style={{
        marginTop: '0.8rem',
        padding: '0.6rem 0.8rem',
        background: 'rgba(6, 182, 212, 0.03)',
        border: '1px dashed rgba(6, 182, 212, 0.15)',
        borderRadius: '6px',
        fontSize: '0.7rem',
        color: 'var(--text-secondary)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
      }}>
        <Zap size={14} style={{ color: 'var(--color-cyan)', flexShrink: 0 }} />
        <span>Aegis Factory는 이 <strong>이중화 인공지능 아키텍처(Dual-AI)</strong>를 통해 <strong>실시간 객체 탐지(YOLO)</strong>와 <strong>인공지능의 자율적인 최적화 및 보고 추론(Gemini)</strong>을 모두 완벽히 충족하고 있습니다.</span>
      </div>
    </div>
  );
};

export default ModelJustification;
