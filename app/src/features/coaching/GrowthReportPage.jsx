import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getGrowthReport } from '../../api/coachingApi';
import { IconCheck, IconSkip, IconClock } from '../../components/icons';
import SpendingTrendCard from './SpendingTrendCard';
import './GrowthReportPage.css';

const formatDate = (value) => {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
};

const acceptedBadge = (accepted) => {
  if (accepted === 'Y') return { icon: IconCheck, text: '실행함', className: 'accepted' };
  if (accepted === 'N') return { icon: IconSkip, text: '건너뜀', className: 'dismissed' };
  return { icon: IconClock, text: '미응답', className: 'pending' };
};

const GrowthReportPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const userId = user?.userId;

  const [nudges, setNudges] = useState([]);
  const [status, setStatus] = useState('loading'); // loading | ready | error

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
        setNudges(Array.isArray(report) ? report : []);
        setStatus('ready');
      } catch (error) {
        if (!cancelled) setStatus('error');
      }
    })();
    return () => { cancelled = true; };
  }, [userId]);

  return (
    <main className="growth-report-page fade-in">
      <SpendingTrendCard />

      {status === 'loading' && <p className="grp-empty">불러오는 중...</p>}
      {status === 'error' && <p className="grp-empty">코칭 기능을 잠시 사용할 수 없어요.</p>}

      {status === 'ready' && nudges.length === 0 && (
        <p className="grp-empty">아직 코칭 이력이 없어요.</p>
      )}

      {status === 'ready' && nudges.length > 0 && (
        <>
          <section className="grp-timeline">
            {nudges.map((n) => {
              const badge = acceptedBadge(n.accepted);
              const BadgeIcon = badge.icon;
              return (
                <div key={n.messageId} className="grp-item">
                  <div className="grp-item-top">
                    <span className="grp-category">{n.category || '기타'}</span>
                    <span className={`grp-badge ${badge.className}`}><BadgeIcon size={13} /> {badge.text}</span>
                  </div>

                  <p className="grp-content">{n.content}</p>

                  {n.originalAmount != null && n.avgAmount != null && (
                    <p className="grp-amounts">
                      이번 {Number(n.originalAmount).toLocaleString()}원
                      {' · '}평소 {Number(n.avgAmount).toLocaleString()}원
                    </p>
                  )}

                  <div className="grp-item-bottom">
                    <span className="grp-date">{formatDate(n.createdAt)}</span>
                    <div className="grp-actions">
                      <button
                        className="grp-chat-btn"
                        onClick={() => navigate(`/mypage/coaching/chat/${n.threadId}`)}
                      >
                        대화하기
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </section>
        </>
      )}
    </main>
  );
};

export default GrowthReportPage;
