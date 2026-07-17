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

  const amountOf = (t) => Math.abs(t.amount || t.originalAmount || 0);
  const isOut = (t) => t.type?.toUpperCase() === 'OUT';
  const firstOfMonth = new Date(currentYear, currentMonth, 1);

  const meanStd = (arr) => {
    const mean = arr.reduce((sum, v) => sum + v, 0) / arr.length;
    const variance = arr.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / arr.length;
    return { mean, std: Math.sqrt(variance) };
  };

  // 1. 과거 월(이번 달 1일 이전) 카테고리별 지출 금액 집계
  const pastByCat = {};
  transactions
    .filter(t => isOut(t) && parseSafeDate(t.date || t.transDate) < firstOfMonth)
    .forEach(t => {
      const cat = t.category || '기타';
      (pastByCat[cat] = pastByCat[cat] || []).push(amountOf(t));
    });

  // 2. 이번 달 카테고리별 지출 거래 그룹
  const currentByCat = {};
  transactions
    .filter(t => {
      const d = parseSafeDate(t.date || t.transDate);
      return isOut(t) && d.getFullYear() === currentYear && d.getMonth() === currentMonth;
    })
    .forEach(t => {
      const cat = t.category || '기타';
      (currentByCat[cat] = currentByCat[cat] || []).push(amountOf(t));
    });

  // 3. 카테고리별 이상치 탐지: 과거 월 이력이 충분하면 그걸로, 없으면 이번 달 내 기준으로 판정
  Object.keys(currentByCat).forEach(category => {
    const items = currentByCat[category];
    const past = pastByCat[category];
    let outlier = null; // { amount, avg, limit }

    if (past && past.length >= 3) {
      // (A) 과거 월 기준: 과거 개별 지출의 평균 + 1.96σ를 넘는 이번 달 지출
      const { mean, std } = meanStd(past);
      const limit = mean + 1.96 * std;
      items.forEach(amount => {
        if (amount > limit && (!outlier || amount > outlier.amount)) {
          outlier = { amount, avg: mean, limit };
        }
      });
    } else if (items.length >= 3) {
      // (B) 이번 달 내 기준(leave-one-out): 같은 카테고리 나머지 거래 평균 대비 크게 튀는 지출
      items.forEach((amount, idx) => {
        const others = items.filter((_, j) => j !== idx);
        const { mean, std } = meanStd(others);
        const limit = mean + 1.96 * std;
        // std=0 등에서의 노이즈 방지: 나머지 평균의 1.5배 이상일 때만 이상치로 인정
        if (amount > limit && amount >= mean * 1.5 && (!outlier || amount > outlier.amount)) {
          outlier = { amount, avg: mean, limit };
        }
      });
    }

    if (outlier) {
      notifications.push({
        id: `anomaly-${category}-${Math.round(outlier.amount)}`,
        message: getWitMessage(category, outlier.amount, outlier.avg),
        category,
        originalAmount: Math.round(outlier.amount),
        avgAmount: Math.round(outlier.avg),
      });
    }
  });

  // 지출이 큰 이상치부터, 최대 3개까지 반환
  return notifications
    .sort((a, b) => b.originalAmount - a.originalAmount)
    .slice(0, 3);
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