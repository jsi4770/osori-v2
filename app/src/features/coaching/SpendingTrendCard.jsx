import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import transApi from '../../api/transApi';
import { getSpendingTrend } from '../../api/coachingApi';
import { getCategoryMonthlyTotals } from '../Util/analytics';
import './SpendingTrendCard.css';

// MyPage.jsx의 정규화 로직과 동일 — 백엔드가 주는 transDate("YY/MM/DD" 슬래시 포맷 포함)를
// getCategoryMonthlyTotals가 기대하는 "yyyy-MM-dd" date 필드로 변환한다.
// (MyPage는 정규화된 transactions를 다른 화면에 prop으로 내려주지만, 이 카드는 성장 리포트
// 페이지에서 독립적으로 자기 데이터를 불러오므로 직접 정규화해야 한다.)
const normalizeTransactions = (rawList) => (rawList || []).map((item) => {
  const rawDate = item.transDate || item.TRANS_DATE || item.date || '';
  let formattedDate = rawDate;
  if (rawDate && typeof rawDate === 'string' && rawDate.includes('/')) {
    const [yy, mm, dd] = rawDate.split('/');
    formattedDate = `20${yy}-${mm}-${dd}`;
  }
  return {
    amount: Number(item.originalAmount || item.ORIGINAL_AMOUNT || item.amount || 0),
    date: formattedDate,
    type: item.type || item.TYPE,
    category: item.category || item.CATEGORY || '기타',
    excludeAnalysis: (item.excludeAnalysis || item.EXCLUDE_ANALYSIS) === 'Y' ? 'Y' : 'N',
  };
});

const SpendingTrendCard = () => {
  const { user } = useAuth();
  const userId = user?.userId;

  const [status, setStatus] = useState('loading'); // loading | ready | empty
  const [content, setContent] = useState('');

  useEffect(() => {
    if (!userId) {
      setStatus('empty');
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const transactions = await transApi.getUserTrans(userId);
        if (cancelled) return;

        const monthlyTotals = getCategoryMonthlyTotals(normalizeTransactions(transactions), new Date());
        if (monthlyTotals.length === 0) {
          setStatus('empty');
          return;
        }

        const yearMonth = monthlyTotals[monthlyTotals.length - 1].yearMonth;
        const trend = await getSpendingTrend({ userId, yearMonth, monthlyTotals });
        if (cancelled) return;
        setContent(trend.content);
        setStatus('ready');
      } catch (error) {
        if (!cancelled) setStatus('empty');
      }
    })();

    return () => { cancelled = true; };
  }, [userId]);

  if (status === 'loading') {
    return (
      <section className="spending-trend-card">
        <p className="stc-empty">소비 흐름을 분석하는 중...</p>
      </section>
    );
  }
  if (status === 'empty') {
    return null;
  }

  return (
    <section className="spending-trend-card">
      <h3>이번 달 소비 흐름 분석</h3>
      <p className="stc-content">{content}</p>
    </section>
  );
};

export default SpendingTrendCard;
