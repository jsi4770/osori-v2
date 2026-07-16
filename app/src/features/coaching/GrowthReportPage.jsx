import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { useAuth } from '../../context/AuthContext';
import { getGrowthReport, respondToNudge } from '../../api/coachingApi';
import './GrowthReportPage.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const formatDate = (value) => {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
};

const acceptedBadge = (accepted) => {
  if (accepted === 'Y') return { text: '✅ 실행함', className: 'accepted' };
  if (accepted === 'N') return { text: '⏭️ 건너뜀', className: 'dismissed' };
  return { text: '⏳ 미응답', className: 'pending' };
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

  const handleRespond = async (messageId, accepted) => {
    try {
      await respondToNudge(messageId, accepted);
      setNudges(prev => prev.map(n =>
        n.messageId === messageId ? { ...n, accepted: accepted ? 'Y' : 'N' } : n
      ));
    } catch (error) {
      alert(error?.response?.data?.message || '코칭 기능을 잠시 사용할 수 없어요.');
    }
  };

  const categoryChart = useMemo(() => {
    const counts = {};
    nudges.forEach(n => {
      const cat = n.category || '기타';
      counts[cat] = (counts[cat] || 0) + 1;
    });
    const labels = Object.keys(counts);
    return {
      labels,
      datasets: [{
        label: '넛지 수',
        data: labels.map(l => counts[l]),
        backgroundColor: '#0066ff',
        borderRadius: 6,
      }],
    };
  }, [nudges]);

  return (
    <main className="growth-report-page fade-in">
      <header className="grp-header">
        <h2>📈 성장 리포트</h2>
        <p className="grp-subtitle">코치의 제안을 얼마나 따랐는지 돌아봐요.</p>
      </header>

      {status === 'loading' && <p className="grp-empty">불러오는 중...</p>}
      {status === 'error' && <p className="grp-empty">코칭 기능을 잠시 사용할 수 없어요.</p>}

      {status === 'ready' && nudges.length === 0 && (
        <p className="grp-empty">아직 코칭 이력이 없어요.</p>
      )}

      {status === 'ready' && nudges.length > 0 && (
        <>
          <section className="grp-chart-card">
            <h3>카테고리별 넛지</h3>
            <Bar
              data={categoryChart}
              options={{
                responsive: true,
                plugins: { legend: { display: false } },
                scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
              }}
            />
          </section>

          <section className="grp-timeline">
            {nudges.map((n) => {
              const badge = acceptedBadge(n.accepted);
              return (
                <div key={n.messageId} className="grp-item">
                  <div className="grp-item-top">
                    <span className="grp-category">#{n.category || '기타'}</span>
                    <span className={`grp-badge ${badge.className}`}>{badge.text}</span>
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
                      {(n.accepted === null || n.accepted == null) && (
                        <>
                          <button
                            className="grp-accept-btn"
                            onClick={() => handleRespond(n.messageId, true)}
                          >
                            실행할게요
                          </button>
                          <button
                            className="grp-dismiss-btn"
                            onClick={() => handleRespond(n.messageId, false)}
                          >
                            넘어갈게요
                          </button>
                        </>
                      )}
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
