import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { zScore } from './zScore';
import { requestNudge } from '../../api/coachingApi';
import { useAuth } from '../../context/AuthContext';
import './ZScoreNotification.css';

const EMPTY_MESSAGES = [
  "✅ 이번 달은 아주 계획적으로 소비하고 계시네요!",
  "💰 지갑이 오소리 덕분에 튼튼해요!",
];

const ZScoreNotification = ({ transactions, currentDate, onStatusChange }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState(null); // null = 분석 전, [] = 이상치 없음
  const userId = user?.userId;

  useEffect(() => {
    if (!currentDate) return;

    const anomalies = zScore(transactions, currentDate);
    onStatusChange?.(anomalies.length > 0);
    if (anomalies.length === 0) {
      setItems([]);
      return;
    }

    // 백엔드 응답 전에도 로컬 메시지를 즉시 보여준다.
    setItems(anomalies.map(a => ({ id: a.id, content: a.message, threadId: null })));

    if (!userId) return;

    let cancelled = false;
    (async () => {
      const results = await Promise.all(anomalies.map(async (a) => {
        try {
          const nudge = await requestNudge({
            userId,
            category: a.category,
            originalAmount: a.originalAmount,
            avgAmount: a.avgAmount,
          });
          return { id: a.id, content: nudge.content, threadId: nudge.threadId };
        } catch (error) {
          // 코칭 기능 사용 불가(503/429 등) 시 로컬 메시지로 폴백
          return { id: a.id, content: a.message, threadId: null };
        }
      }));
      if (!cancelled) setItems(results);
    })();

    return () => { cancelled = true; };
  }, [transactions, currentDate, userId, onStatusChange]);

  if (items === null) {
    return (
      <div className="notification-list-container">
        <div className="notification-list">
          <div className="notification-item">데이터를 분석 중입니다...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="notification-list-container">
      <div className="notification-list">
        {items.length === 0
          ? EMPTY_MESSAGES.map((text, index) => (
              <div key={index} className="notification-item">{text}</div>
            ))
          : items.map((n) => (
              <div
                key={n.id}
                className={`notification-item ${n.threadId ? 'clickable' : ''}`}
                onClick={n.threadId ? () => navigate(`/mypage/coaching/chat/${n.threadId}`) : undefined}
              >
                <span className="notification-text">{n.content}</span>
                {n.threadId && (
                  <button
                    className="notification-action"
                    onClick={(e) => { e.stopPropagation(); navigate(`/mypage/coaching/chat/${n.threadId}`); }}
                  >
                    대화하기
                  </button>
                )}
              </div>
            ))}
      </div>
    </div>
  );
};

export default ZScoreNotification;
