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