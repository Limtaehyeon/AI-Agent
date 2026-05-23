import React from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Zap, Landmark, Leaf, TrendingDown } from 'lucide-react';

const EnergyCharts = ({ powerHistory, cumulativeSavingsKwh, cumulativeSavingsCost, zones }) => {
  
  // Calculate current total load and base load
  let totalBaseLoad = 0;
  let totalOptimizedLoad = 0;
  Object.values(zones).forEach(z => {
    totalBaseLoad += z.basePower;
    totalOptimizedLoad += z.powerConsumption;
  });

  const liveSavingsKw = Math.max(0, totalBaseLoad - totalOptimizedLoad);
  const liveSavingsPercent = totalBaseLoad > 0 
    ? Math.round((liveSavingsKw / totalBaseLoad) * 100)
    : 0;

  return (
    <div className="card-panel" style={{ display: 'flex', flexDirection: 'column' }}>
      <div className="card-panel-header">
        <div className="card-panel-title">
          <Zap size={18} className="logo-icon" />
          <span>실시간 에너지 최적화 분석</span>
        </div>
        <span className="card-panel-action" style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', color: 'var(--color-green)' }}>
          <TrendingDown size={14} />
          실시간 절감률: {liveSavingsPercent}%
        </span>
      </div>

      {/* KPI metrics row */}
      <div className="metrics-row" style={{ marginBottom: '1.25rem' }}>
        <div className="metric-card">
          <div className="metric-icon-box green">
            <TrendingDown size={20} />
          </div>
          <div className="metric-info">
            <span className="metric-title">실시간 절감 부하</span>
            <span className="metric-value" style={{ color: 'var(--color-green)' }}>
              {liveSavingsKw.toFixed(1)} <span style={{ fontSize: '0.75rem', fontWeight: 500 }}>kW</span>
            </span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-box cyan">
            <Leaf size={20} />
          </div>
          <div className="metric-info">
            <span className="metric-title">누적 전력 절감량</span>
            <span className="metric-value" style={{ color: 'var(--color-cyan)' }}>
              {cumulativeSavingsKwh.toFixed(1)} <span style={{ fontSize: '0.75rem', fontWeight: 500 }}>kWh</span>
            </span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-box amber">
            <Landmark size={20} />
          </div>
          <div className="metric-info">
            <span className="metric-title">누적 비용 절감액</span>
            <span className="metric-value" style={{ color: 'var(--color-amber)' }}>
              ₩{cumulativeSavingsCost.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Recharts graph */}
      <div style={{ height: '260px', width: '100%', minWidth: 0, background: 'var(--bg-secondary)', padding: '0.75rem 0.5rem 0 0.5rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={powerHistory}
            margin={{ top: 5, right: 5, left: -20, bottom: 5 }}
          >
            <defs>
              <linearGradient id="colorBaseline" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-red)" stopOpacity={0.15}/>
                <stop offset="95%" stopColor="var(--color-red)" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorOptimized" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-green)" stopOpacity={0.25}/>
                <stop offset="95%" stopColor="var(--color-green)" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis 
              dataKey="time" 
              stroke="var(--text-muted)" 
              fontSize={10} 
              tickLine={false} 
              axisLine={false}
            />
            <YAxis 
              stroke="var(--text-muted)" 
              fontSize={10} 
              tickLine={false} 
              axisLine={false}
              unit="kW"
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--bg-card)',
                borderColor: 'var(--border-color)',
                borderRadius: '8px',
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-sans)',
                fontSize: '0.75rem'
              }}
            />
            <Legend 
              verticalAlign="top" 
              height={36} 
              iconType="circle" 
              iconSize={8}
              wrapperStyle={{ fontSize: '0.75rem', fontFamily: 'var(--font-sans)', color: 'var(--text-secondary)' }}
            />
            <Area 
              type="monotone" 
              name="기존 전력량 (Baseline)" 
              dataKey="baseline" 
              stroke="var(--color-red)" 
              strokeWidth={1.5}
              fillOpacity={1} 
              fill="url(#colorBaseline)" 
            />
            <Area 
              type="monotone" 
              name="AI 자율 최적화 (Aegis AI)" 
              dataKey="optimized" 
              stroke="var(--color-green)" 
              strokeWidth={2}
              fillOpacity={1} 
              fill="url(#colorOptimized)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      
      <div style={{ marginTop: '0.5rem', textAlign: 'center', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
        * 지난 24시간 동안의 구역별 전력 부하 실시간 트렌드 시각화 (5초 주기로 누적 데이터 갱신)
      </div>
    </div>
  );
};

export default EnergyCharts;
