// 가중 선형 회귀 분석을 통한 다음 달 예측 함수
export const predictNextMonthExpense = (historyData) => {
  const n = historyData.length;
  if (n < 2) return 0;

  // 최근 달에 더 큰 가중치 부여 
  // 오래된 달 1.0 -> 점점 증가
  // 최근 달이 가장 큰 가중치(6개월 전보가 2.5배)
  const weights = historyData.map((_, idx) => 1 + idx * 0.3);
  let sumW = 0;
  let sumWX = 0;
  let sumWY = 0;
  let sumWXY = 0;
  let sumWXX = 0;

  for (let i = 0; i < n; i++) {
    const { monthIndex: x, amount: y } = historyData[i];
    const w = weights[i];

    sumW += w;
    sumWX += w * x;
    sumWY += w * y;
    sumWXY += w * x * y;
    sumWXX += w * x * x;
  }

  // 가중 평균
  const xBar = sumWX / sumW;
  const yBar = sumWY / sumW;

  // 기울기
  const numerator = sumWXY - sumWX * yBar;
  const denominator = sumWXX - sumWX * xBar;

  if (denominator === 0) return Math.max(0, Math.round(yBar));

  const slope = numerator / denominator;

  // 절편
  const intercept = yBar - slope * xBar;

  // 다음 달 예측
  const nextMonthIndex = historyData[n - 1].monthIndex + 1;
  const predictedAmount = slope * nextMonthIndex + intercept;

  return Math.max(0, Math.round(predictedAmount));
};

// 카테고리별 월간 지출 합계 — 거시 트렌드 분석(Gemini)에 보낼 데이터를 만든다.
// MonthlyTrendChart.jsx와 같은 월 범위 규칙(최대 6개월, 데이터만큼 동적으로 좁힘)을 재사용하되,
// 트렌드 분석은 1개월치만 있어도 "이번 달 구성" 코멘트로 대응 가능하므로 최소 1개월부터 반환한다
// (신규 유저를 위한 갭 메우기 — 2개월 미만이면 아예 분석을 못 받던 문제 해결).
export const getCategoryMonthlyTotals = (transactions, currentDate) => {
  const targetYear = currentDate.getFullYear();
  const targetMonth = currentDate.getMonth();

  const expenseTransactions = transactions.filter(
    (t) => t.type?.toUpperCase() === 'OUT' || t.type?.toUpperCase() === 'EXPENSE'
  );
  if (expenseTransactions.length === 0) return [];

  const oldestDate = new Date(Math.min(...expenseTransactions.map((t) => new Date(t.date))));
  const monthDiff =
    (targetYear - oldestDate.getFullYear()) * 12 + (targetMonth - oldestDate.getMonth());
  const startMonthOffset = Math.min(Math.max(monthDiff, 0), 5);

  const monthKeys = [];
  for (let i = startMonthOffset; i >= 0; i--) {
    const d = new Date(targetYear, targetMonth - i, 1);
    monthKeys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }

  const totals = {};
  monthKeys.forEach((key) => { totals[key] = {}; });

  expenseTransactions.forEach((t) => {
    const monthKey = t.date.substring(0, 7);
    if (!totals[monthKey]) return;
    const cat = t.category || '기타';
    totals[monthKey][cat] = (totals[monthKey][cat] || 0) + Math.abs(t.amount || t.originalAmount || 0);
  });

  return monthKeys
    .filter((key) => Object.keys(totals[key]).length > 0)
    .map((key) => ({ yearMonth: key, categories: totals[key] }));
};

// 이번 달 말 예상 지출 계산 함수
export const calculateProjectedExpense = (currentExpense, currentDate) => {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const today = currentDate.getDate();

  // 이번 달의 총 일수
  const lastDayOfMonth = new Date(year, month + 1, 0).getDate();

  if (today === 0) return currentExpense; // 1일 이전 예외처리

  // (현재지출 / 오늘날짜) * 총일수
  const projected = (currentExpense / today) * lastDayOfMonth;
  
  return Math.round(projected);
};

export default predictNextMonthExpense;