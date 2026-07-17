import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getGrowthReport, requestNudge } from '../../api/coachingApi';
import { manualCoachingTarget } from '../Util/zScore';
import './HomeCoachCard.css';

const HomeCoachCard = ({ transactions = [] }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const userId = user?.userId;

  const [latestNudge, setLatestNudge] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | ready | error
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    if (!userId) {
      setStatus('ready');
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const report = await getGrowthReport(userId);
        if (cancelled) return;
        setLatestNudge(Array.isArray(report) && report.length > 0 ? report[0] : null);
        setStatus('ready');
      } catch (error) {
        if (!cancelled) setStatus('error');
      }
    })();

    return () => { cancelled = true; };
  }, [userId]);

  const handleManualCoaching = async () => {
    if (!userId || requesting) return;

    const target = manualCoachingTarget(transactions, new Date());
    if (!target) {
      alert('이번 달 지출 내역이 아직 없어요. 지출을 등록한 뒤 다시 시도해주세요.');
      return;
    }

    setRequesting(true);
    try {
      const nudge = await requestNudge({ userId, ...target });
      setLatestNudge(nudge);
      setStatus('ready');
    } catch (error) {
      const message = error?.response?.data?.message || '코칭 요청에 실패했어요. 잠시 후 다시 시도해주세요.';
      alert(message);
    } finally {
      setRequesting(false);
    }
  };

  return (
    <div className="home-coach-card">
      <div className="hcc-header">
        <h3>🤖 오늘의 코칭</h3>
        <button className="hcc-report-link" onClick={() => navigate('/mypage/coaching/report')}>
          성장 리포트 →
        </button>
      </div>

      {status === 'loading' && (
        <p className="hcc-empty">코칭 메시지를 불러오는 중...</p>
      )}

      {status === 'error' && (
        <p className="hcc-empty">코칭 기능을 잠시 사용할 수 없어요.</p>
      )}

      {status === 'ready' && !latestNudge && (
        <>
          <p className="hcc-empty">아직 코칭 메시지가 없어요.</p>
          <button className="hcc-chat-btn" onClick={handleManualCoaching} disabled={requesting}>
            {requesting ? '코칭 준비 중...' : '지금 코칭 받기'}
          </button>
        </>
      )}

      {status === 'ready' && latestNudge && (
        <>
          <p className="hcc-content">{latestNudge.content}</p>
          {latestNudge.category && (
            <p className="hcc-meta">
              #{latestNudge.category}
              {latestNudge.originalAmount != null && latestNudge.avgAmount != null && (
                <>
                  {' · '}이번 {latestNudge.originalAmount.toLocaleString()}원
                  {' / '}평소 {latestNudge.avgAmount.toLocaleString()}원
                </>
              )}
            </p>
          )}
          <div className="hcc-actions">
            <button
              className="hcc-chat-btn"
              onClick={() => navigate(`/mypage/coaching/chat/${latestNudge.threadId}`)}
            >
              대화하기
            </button>
            <button className="hcc-refresh-btn" onClick={handleManualCoaching} disabled={requesting}>
              {requesting ? '갱신 중...' : '다시 받기'}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default HomeCoachCard;
