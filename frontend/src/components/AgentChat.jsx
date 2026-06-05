import React, { useState, useRef, useEffect } from 'react';
import { Cpu, Send, RefreshCw, FileText } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis } from 'recharts';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5050';

const AgentChat = ({ onGenerateReport }) => {
  const [messages, setMessages] = useState([
    { role: 'agent', text: '안녕하세요! Aegis Factory의 AI 자율 운영 비서입니다. 공장의 실시간 운영 수치, 에너지 최적화 제어 내역 및 안전 상태에 대해 질문하실 수 있습니다.' }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatContainerRef = useRef(null);

  // Auto-scroll chat within container to avoid page layout shifts
  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async (textToSend) => {
    const text = textToSend || inputText;
    if (!text.trim()) return;

    // Add user message
    const userMsg = { role: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      // Build conversation history (excluding the very first system greeting)
      const chatHistory = messages.slice(1).map(msg => ({
        role: msg.role,
        text: msg.text
      }));

      const response = await fetch(`${API_BASE}/api/agent/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history: chatHistory })
      });

      if (!response.ok) {
        throw new Error('API server response failed');
      }

      const data = await response.json();
      setMessages(prev => [...prev, { role: 'agent', text: data.reply }]);
    } catch (error) {
      console.error("Error chatting with AI agent:", error);
      setMessages(prev => [...prev, { 
        role: 'agent', 
        text: `죄송합니다. 백엔드 에이전트와 통신 도중 오류가 발생했습니다. (서버 연결을 확인해 주세요)` 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Convert markdown-ish text to basic HTML (paragraphs, tables, bullet lists)
  const formatAgentReply = (text) => {
    if (!text) return '';

    // Bold text **word**
    let processedText = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // Split into lines to parse tables and lists
    const lines = processedText.split('\n');
    let inTable = false;
    let inList = false;

    const parsedLines = lines.map(line => {
      const trimmed = line.trim();

      // 1. Table Parsing
      if (trimmed.startsWith('|')) {
        const cols = line.split('|').map(c => c.trim()).filter(c => c !== '');
        if (cols.length === 0) return '';
        if (cols[0].includes('---') || cols[0].includes('===')) return '';

        // Close list if open
        let prefix = '';
        if (inList) {
          inList = false;
          prefix = '</ul>';
        }

        const rowHtml = '<tr>' + cols.map(c => inTable ? `<td>${c}</td>` : `<th>${c}</th>`).join('') + '</tr>';
        if (!inTable) {
          inTable = true;
          return `${prefix}<table>${rowHtml}`;
        }
        return rowHtml;
      }

      // Close table if open
      let prefix = '';
      if (inTable) {
        inTable = false;
        prefix = '</table>';
      }

      // 2. List Parsing
      if (trimmed.startsWith('*') || trimmed.startsWith('-')) {
        const content = trimmed.substring(1).trim();
        if (!inList) {
          inList = true;
          return `${prefix}<ul><li>${content}</li>`;
        }
        return `${prefix}<li>${content}</li>`;
      }

      // Close list if open
      if (inList) {
        inList = false;
        return `${prefix}</ul>${line}`;
      }

      return prefix + line;
    });

    // Make sure to close any open tables or lists at the end
    if (inTable) {
      parsedLines.push('</table>');
    }
    if (inList) {
      parsedLines.push('</ul>');
    }

    const html = parsedLines.join('<br />');
    return <div dangerouslySetInnerHTML={{ __html: html }} />;
  };

  // Preset query macros
  const macros = [
    { label: "💡 구역별 상태 요약", text: "현재 공장 내 구역들의 상태와 인원, 전력 부하 현황을 전체적으로 요약해줘." },
    { label: "⚡️ 실시간 에너지 절약 현황", text: "AI 최적화를 가동해서 얻은 누적 전력 절감량(kWh)과 비용 절감 금액(원)을 분석해줘." },
    { label: "🛡️ 안전 상태 확인", text: "현재 공장에 감지된 안전 미착용이나 과밀 경보 상황이 있는지 확인하고 대처 방안을 알려줘." }
  ];

  // Parse chat reply content to generate inline charts & widgets
  const parseChatData = (text) => {
    if (!text) return null;

    // 1. Extract KPI values
    const kwhMatch = text.match(/([\d.]+)\s*kWh/);
    const costMatch = text.match(/₩([\d,]+)\s*원?/);
    const kpiSavingsKwh = kwhMatch ? parseFloat(kwhMatch[1]) : null;
    const kpiSavingsCost = costMatch ? parseInt(costMatch[1].replace(/[^\d]/g, '')) : null;

    // 2. Extract zone table rows
    const zoneData = [];
    const lines = text.split('\n');
    lines.forEach(line => {
      // Matches: | Zone Name | 3명 | ... | 10.5 kW |
      const match = line.match(/^\|\s*([^|:]+?)\s*\|\s*(\d+)명\s*\|\s*([^|:]+?)\s*\|\s*([^|:]+?)\s*\|\s*([^|:]+?)\s*\|\s*([\d.]+)\s*kW/);
      if (match) {
        zoneData.push({
          name: match[1].trim(),
          workers: parseInt(match[2]),
          power: parseFloat(match[6])
        });
      }
    });

    const complianceMatch = text.match(/준수율.*?\s*(\d+)%/);
    const complianceRate = complianceMatch ? parseInt(complianceMatch[1]) : null;

    return {
      kpiSavingsKwh,
      kpiSavingsCost,
      zoneData: zoneData.length > 0 ? zoneData : null,
      complianceRate
    };
  };

  return (
    <div className="card-panel chat-container">
      <div className="card-panel-header">
        <div className="card-panel-title">
          <Cpu size={18} className="logo-icon" />
          <span>Aegis AI Operation Agent 챗 인터페이스</span>
        </div>
        <button 
          onClick={onGenerateReport} 
          style={{
            background: 'var(--color-green-glow)',
            border: '1px solid var(--color-green)',
            color: 'var(--color-green)',
            fontSize: '0.75rem',
            padding: '0.25rem 0.6rem',
            borderRadius: '4px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem',
            fontWeight: 600,
            transition: 'all 0.2s'
          }}
          onMouseOver={(e) => { e.currentTarget.style.background = 'var(--color-green)'; e.currentTarget.style.color = '#000'; }}
          onMouseOut={(e) => { e.currentTarget.style.background = 'var(--color-green-glow)'; e.currentTarget.style.color = 'var(--color-green)'; }}
        >
          <FileText size={12} />
          <span>운영 분석 레포트 생성</span>
        </button>
      </div>

      {/* Chat Messages Log */}
      <div ref={chatContainerRef} className="chat-messages">
        {messages.map((msg, idx) => {
          if (msg.role === 'agent') {
            const parsed = parseChatData(msg.text);
            const hasWidgets = parsed && (parsed.kpiSavingsKwh || parsed.zoneData || parsed.complianceRate !== null);

            return (
              <div key={idx} className={`chat-bubble ${msg.role}`} style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', width: '92%', alignSelf: 'flex-start' }}>
                {/* Visual widgets inline inside chat bubble */}
                {hasWidgets && (
                  <div style={{
                    background: 'rgba(0, 0, 0, 0.2)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    padding: '0.75rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem',
                    width: '100%',
                    boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.3)'
                  }}>
                    {/* Glowing KPI Metrics row */}
                    {parsed.kpiSavingsKwh && parsed.kpiSavingsCost && (
                      <div style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
                        <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', padding: '0.5rem', borderRadius: '6px', flex: 1 }}>
                          <div style={{ fontSize: '0.55rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>누적 전력 절감</div>
                          <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--color-green)', fontFamily: 'var(--font-mono)' }}>{parsed.kpiSavingsKwh} kWh</div>
                        </div>
                        <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', padding: '0.5rem', borderRadius: '6px', flex: 1 }}>
                          <div style={{ fontSize: '0.55rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>누적 비용 절감</div>
                          <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--color-cyan)', fontFamily: 'var(--font-mono)' }}>₩{parsed.kpiSavingsCost.toLocaleString()}</div>
                        </div>
                      </div>
                    )}

                    {/* Mini Bar Chart for zone power load comparison */}
                    {parsed.zoneData && (
                      <div style={{ height: '140px', width: '100%', background: 'var(--bg-primary)', padding: '0.5rem', borderRadius: '6px', display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '0.25rem' }}>📊 구역별 실시간 전력 부하 비교 (kW)</span>
                        <div style={{ width: '100%', flex: 1, minHeight: 0 }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={parsed.zoneData} margin={{ top: 5, right: 5, left: -35, bottom: 0 }}>
                              <XAxis dataKey="name" fontSize={8} stroke="var(--text-muted)" tickLine={false} />
                              <YAxis fontSize={8} stroke="var(--text-muted)" tickLine={false} axisLine={false} />
                              <Bar dataKey="power" fill="var(--color-cyan)" radius={[2, 2, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                <div style={{ width: '100%' }}>
                  {formatAgentReply(msg.text)}
                </div>
              </div>
            );
          } else {
            return (
              <div key={idx} className={`chat-bubble ${msg.role}`}>
                {msg.text}
              </div>
            );
          }
        })}
        {isLoading && (
          <div className="chat-bubble agent" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
            <RefreshCw size={14} className="fan-spin" style={{ animationDuration: '1s' }} />
            <span>Gemini Agent가 상태를 분석하는 중...</span>
          </div>
        )}
      </div>

      {/* Preset Action Buttons */}
      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
        {macros.map((m, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(m.text)}
            disabled={isLoading}
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-secondary)',
              fontSize: '0.7rem',
              padding: '0.3rem 0.5rem',
              borderRadius: '4px',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s'
            }}
            onMouseOver={(e) => { e.currentTarget.style.borderColor = 'var(--color-cyan)'; e.currentTarget.style.color = '#fff'; }}
            onMouseOut={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Message Input Box */}
      <form 
        onSubmit={(e) => { e.preventDefault(); handleSend(); }} 
        className="chat-input-row"
      >
        <input
          type="text"
          className="chat-input"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="AI Agent에게 물어보세요... (예: Zone B 에어컨 제어 사유는?)"
          disabled={isLoading}
        />
        <button 
          type="submit" 
          className="chat-send-btn"
          disabled={isLoading || !inputText.trim()}
        >
          <Send size={14} />
        </button>
      </form>
    </div>
  );
};

export default AgentChat;
