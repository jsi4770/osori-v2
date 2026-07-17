const getWitMessage = (category, amount, limit) => {
  const diff = Math.round(amount - limit);
  const messages = {
    '식비': [`🍽️ 미슐랭 가이드 찍으러 가셨나요? (평소 대비 ${diff.toLocaleString()}원 ↑)`],
    '생활/마트': [`🛒장바구니가 꽤 무겁네요 (평소 대비 ${diff.toLocaleString()}원 ↑)`],
    '쇼핑': [`🛍️ 지름신이 강림하셨군요! (평소 대비 ${diff.toLocaleString()}원 ↑)`],
    '의료/건강': [`🏥 건강이 최고지만, 지갑 건강도 챙겨주세요! (평소 대비 ${diff.toLocaleString()}원 ↑)`],
    '교통': [`🚗 이번 달은 이동이 정말 많으시네요! (평소 대비 ${diff.toLocaleString()}원 ↑)`],
    '문화/여가': [`🎭 인생은 즐겁지만 예산도 즐거워야 해요 (평소 대비 ${diff.toLocaleString()}원 ↑)`],
    '교육': [`📚 지식의 창고가 넓어지고 있어요 (평소 대비 ${diff.toLocaleString()}원 ↑)`],
    '기타': [`🤔 어디에 쓰셨나요? 예상치 못한 지출이 생겼어요! (평소 대비 ${diff.toLocaleString()}원 ↑)`]
  };
  const categoryMessages = messages[category] || messages['기타'];
  return categoryMessages[Math.floor(Math.random() * categoryMessages.length)];
};

export const zScore = (transactions, currentDate) => {
  const notifications = [];
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  const parseSafeDate = (dateStr) => {
    if (!dateStr) return new Date();
    const parts = dateStr.split(/[/.-]/); 
    if (parts.length === 3) {
      let year = parseInt(parts[0]);
      let month = parseInt(parts[1]) - 1;
      let day = parseInt(parts[2]);
      if (year < 100) year += 2000; 
      return new Date(year, month, day);
    }
    return new Date(dateStr);
  };

  const categoryStats = {};
  
  // 1. 과거 데이터 집계
  transactions
    .filter(t => parseSafeDate(t.date || t.transDate) < new Date(currentYear, currentMonth, 1) && t.type?.toUpperCase() === 'OUT')
    .forEach(t => {
      const cat = t.category; 
      if (!categoryStats[cat]) categoryStats[cat] = [];
      categoryStats[cat].push(Math.abs(t.amount || t.originalAmount));
    });

  const thresholds = {};
  const means = {};
  Object.keys(categoryStats).forEach(category => {
    const amounts = categoryStats[category];
    if (amounts.length < 3) return;
    const mean = amounts.reduce((sum, val) => sum + val, 0) / amounts.length;
    const variance = amounts.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / amounts.length;
    const stdDev = Math.sqrt(variance);
    means[category] = mean;
    thresholds[category] = mean + (1.96 * stdDev);
  });

  // 2. 이번 달 지출 분석 및 중복 제거
  const seenCategories = new Set(); // 이미 알림을 생성한 카테고리 체크용

  transactions
    .filter(t => {
      const d = parseSafeDate(t.date || t.transDate);
      return d.getFullYear() === currentYear && d.getMonth() === currentMonth && t.type?.toUpperCase() === 'OUT';
    })
    .forEach(t => {
      // 이미 해당 카테고리에 대한 알림이 있다면 스킵
      if (seenCategories.has(t.category)) return;

      const limit = thresholds[t.category];
      const amount = Math.abs(t.amount || t.originalAmount);
      
      if (limit && amount > limit) {
        notifications.push({
          id: `anomaly-${t.tranId || Math.random()}`,
          message: getWitMessage(t.category, amount, limit),
          category: t.category,
          originalAmount: Math.round(amount),
          avgAmount: Math.round(means[t.category]),
        });

        seenCategories.add(t.category); //카테고리 등록
      }
    });

  // 최대 3개까지만 반환
  return notifications.slice(0, 3);
};

// 자동 이상치 감지(zScore)는 과거 달 데이터가 없으면 절대 발동하지 않는다(첫 달 공백 문제).
// 사용자가 수동으로 "코칭 받기"를 눌렀을 때 쓸 대상을 항상 하나 골라준다:
// 이번 달 지출이 가장 큰 카테고리 + (과거 평균이 있으면 그 평균, 없으면 현재 금액과 동일 = 중립 체크인).
export const manualCoachingTarget = (transactions, currentDate) => {
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  const parseSafeDate = (dateStr) => {
    if (!dateStr) return new Date();
    const parts = dateStr.split(/[/.-]/);
    if (parts.length === 3) {
      let year = parseInt(parts[0]);
      let month = parseInt(parts[1]) - 1;
      let day = parseInt(parts[2]);
      if (year < 100) year += 2000;
      return new Date(year, month, day);
    }
    return new Date(dateStr);
  };

  const thisMonthTotals = {};
  transactions
    .filter(t => {
      const d = parseSafeDate(t.date || t.transDate);
      return d.getFullYear() === currentYear && d.getMonth() === currentMonth && t.type?.toUpperCase() === 'OUT';
    })
    .forEach(t => {
      const cat = t.category || '기타';
      const amount = Math.abs(t.amount || t.originalAmount || 0);
      thisMonthTotals[cat] = (thisMonthTotals[cat] || 0) + amount;
    });

  const categories = Object.keys(thisMonthTotals);
  if (categories.length === 0) return null;

  const topCategory = categories.reduce((a, b) => (thisMonthTotals[a] >= thisMonthTotals[b] ? a : b));
  const originalAmount = Math.round(thisMonthTotals[topCategory]);

  const pastAmounts = [];
  transactions
    .filter(t => parseSafeDate(t.date || t.transDate) < new Date(currentYear, currentMonth, 1) && t.type?.toUpperCase() === 'OUT' && (t.category || '기타') === topCategory)
    .forEach(t => pastAmounts.push(Math.abs(t.amount || t.originalAmount || 0)));

  const avgAmount = pastAmounts.length >= 3
    ? Math.round(pastAmounts.reduce((sum, v) => sum + v, 0) / pastAmounts.length)
    : originalAmount; // 과거 데이터 부족 → 중립(같은 값)으로 전달, 백엔드가 "순조로워요" 톤으로 응답

  return { category: topCategory, originalAmount, avgAmount };
};