import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getGrowthReport, sendChatMessage } from '../../api/coachingApi';
import './CoachChatPage.css';

const CoachChatPage = () => {
  const { threadId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const userId = user?.userId;

  const [messages, setMessages] = useState([]); // {id, role, content}
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef(null);

  // 진입 시 이 thread의 최초 넛지를 코치의 첫 말풍선으로 보여준다.
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    (async () => {
      try {
        const report = await getGrowthReport(userId);
        if (cancelled || !Array.isArray(report)) return;
        const nudge = report.find(n => String(n.threadId) === String(threadId));
        if (nudge) {
          setMessages([{ id: nudge.messageId, role: nudge.role || 'NUDGE', content: nudge.content }]);
        }
      } catch (error) {
        // 초기 넛지 로드 실패는 조용히 무시 — 사용자는 그대로 대화를 시작할 수 있다.
      }
    })();
    return () => { cancelled = true; };
  }, [userId, threadId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, sending]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending) return;

    const userMsg = { id: `user-${Date.now()}`, role: 'USER', content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setSending(true);

    try {
      const reply = await sendChatMessage({ threadId, userId, message: text });
      setMessages(prev => [...prev, {
        id: reply.messageId || `coach-${Date.now()}`,
        role: reply.role || 'COACH',
        content: reply.content,
      }]);
    } catch (error) {
      const message = error?.response?.data?.message || '코칭 기능을 잠시 사용할 수 없어요.';
      setMessages(prev => [...prev, {
        id: `error-${Date.now()}`,
        role: 'COACH',
        content: message,
      }]);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <main className="coach-chat-page fade-in">
      <header className="ccp-header">
        <button className="ccp-back" onClick={() => navigate(-1)}>←</button>
        <h2>💬 AI 재무 코치</h2>
      </header>

      <div className="ccp-messages" ref={scrollRef}>
        {messages.length === 0 && (
          <p className="ccp-empty">코치와 대화를 시작해보세요.</p>
        )}
        {messages.map((m) => (
          <div key={m.id} className={`ccp-bubble-row ${m.role === 'USER' ? 'user' : 'coach'}`}>
            <div className={`ccp-bubble ${m.role === 'USER' ? 'user' : 'coach'}`}>
              {m.content}
            </div>
          </div>
        ))}
        {sending && (
          <div className="ccp-bubble-row coach">
            <div className="ccp-bubble coach ccp-typing">코치가 입력 중...</div>
          </div>
        )}
      </div>

      <div className="ccp-input-area">
        <input
          type="text"
          className="ccp-input"
          placeholder="메시지를 입력하세요"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={sending}
        />
        <button className="ccp-send" onClick={handleSend} disabled={sending || !input.trim()}>
          전송
        </button>
      </div>
    </main>
  );
};

export default CoachChatPage;
