/**
 * 1. 급여 지급일 계산 헬퍼 함수 (주말/공휴일 시 직전 평일)
 */
const getActualSalaryDate = (year, month, targetDay) => {
  const holidays = ["2025-08-15", "2025-10-03", "2025-10-06", "2025-10-07", "2025-10-08", "2025-10-09", "2025-12-25", "2026-01-01"];
  let date = new Date(year, month, targetDay);
  while (date.getDay() === 0 || date.getDay() === 6 || holidays.includes(date.toISOString().split('T')[0])) {
    date.setDate(date.getDate() - 1);
  }
  return date.toISOString().split('T')[0];
};

const generateMockData = () => {
  const allData = [];
  let currentId = 1;

  // 가계부 정의
  const ledgers = [
    { id: 'personal', name: '내 가계부', color: '#0066ff' },
    { id: 'group_1', name: '모임 가계부', color: '#ff9f43' },
    { id: 'group_2', name: '커플 가계부', color: '#ee5253' }
  ];

  const categoryConfig = {
    "식비": { stores: ["스타벅스", "맥도날드", "식당", "파리바게뜨"], memos: ["점심 식사", "퇴근 후 혼밥", "카페 공부"] },
    "생활/마트": { stores: ["이마트", "GS25", "다이소", "미용실"], memos: ["주간 장보기", "생필품 보충", "커트 비용"] },
    "쇼핑": { stores: ["백화점", "올리브영", "무신사", "교보문고"], memos: ["새 옷 쇼핑", "화장품 구매", "도서 구매"] },
    "의료/건강": { stores: ["약국", "치과", "헬스장"], memos: ["정기 검진", "비타민 구매", "운동 센터 등록"] },
    "교통/차량": { stores: ["지하철", "시내버스", "주유소", "택시"], memos: ["출근길 교통비", "이동 택시비", "차량 주유"] },
    "문화/여가": { stores: ["CGV", "노래방", "넷플릭스", "PC방"], memos: ["영화 관람", "주말 여가", "구독료 결제"] }
  };

  const categories = Object.keys(categoryConfig);

  // --- 구간 1: 2025년 7월 ~ 2026년 1월 (일반 데이터 생성) ---
  for (let year = 2025; year <= 2026; year++) {
    const startMonth = (year === 2025) ? 6 : 0; 
    const endMonth = (year === 2025) ? 11 : 0; // 2026년은 1월만 생성

    for (let month = startMonth; month <= endMonth; month++) {
      // 해당 월의 급여일 계산
      const salaryDate = getActualSalaryDate(year, month, 10);
      
      for (let i = 1; i <= 25; i++) {
        const isSalary = (i === 1); 
        const rand = Math.random();
        const ledger = rand < 0.6 ? ledgers[0] : (rand < 0.8 ? ledgers[1] : ledgers[2]);
        const randomCat = categories[Math.floor(Math.random() * categories.length)];
        const config = categoryConfig[randomCat];

        allData.push({
          tran_id: currentId++,
          store_name: isSalary ? "정기 급여" : config.stores[Math.floor(Math.random() * config.stores.length)],
          date: isSalary ? salaryDate : `${year}-${String(month + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`,
          amount: isSalary ? 3500000 : (Math.floor(Math.random() * 50) + 1) * 1000,
          is_shared: ledger.id === 'personal' ? 'N' : 'Y',
          ledger_id: ledger.id,
          ledger_name: ledger.name,
          ledger_color: ledger.color,
          category: isSalary ? "급여" : randomCat,
          type: isSalary ? "INCOME" : "EXPENSE",
          memo: isSalary ? `${month + 1}월 정기 월급` : config.memos[Math.floor(Math.random() * config.memos.length)],
          user_id: 101
        });
      }
    }
  }

  // --- 구간 2: 2026년 1월 3일 (집중 지출 20건 복구) ---
  const jan3rdItems = [
    { s: "맥도날드", c: "식비", m: "맥모닝 세트" }, { s: "김밥천국", c: "식비", m: "돈까스 단품" }, { s: "스타벅스", c: "식비", m: "아이스 라떼" },
    { s: "비비큐", c: "식비", m: "치킨 배달" }, { s: "투썸", c: "식비", m: "티타임" }, { s: "GS25", c: "생활/마트", m: "생수 구매" },
    { s: "다이소", c: "생활/마트", m: "청소 용품" }, { s: "이마트", c: "생활/마트", m: "롤화장지" }, { s: "세븐일레븐", c: "생활/마트", m: "건전지" },
    { s: "교보문고", c: "쇼핑", m: "자기계발서" }, { s: "무신사", c: "쇼핑", m: "양말 세트" }, { s: "올리브영", c: "쇼핑", m: "핸드크림" },
    { s: "유니클로", c: "쇼핑", m: "히트텍" }, { s: "온누리약국", c: "의료/건강", m: "소화제" }, { s: "헬스장", c: "의료/건강", m: "일일권" },
    { s: "카카오택시", c: "교통/차량", m: "약속 이동" }, { s: "지하철", c: "교통/차량", m: "귀가" }, { s: "CGV", c: "문화/여가", m: "영화 티켓" },
    { s: "PC방", c: "문화/여가", m: "게임 이용" }, { s: "코인노래방", c: "문화/여가", m: "스트레스 해소" }
  ];

  jan3rdItems.forEach((item, index) => {
    // 1월 3일 데이터도 가계부 랜덤 배정
    const rand = Math.random();
    const ledger = rand < 0.7 ? ledgers[0] : (rand < 0.9 ? ledgers[1] : ledgers[2]);

    allData.push({
      tran_id: currentId++,
      store_name: item.s,
      date: "2026-01-03",
      amount: (Math.floor(Math.random() * 30) + 5) * 1000,
      is_shared: ledger.id === 'personal' ? 'N' : 'Y',
      ledger_id: ledger.id,
      ledger_name: ledger.name,
      ledger_color: ledger.color,
      category: item.c,
      type: "EXPENSE",
      memo: item.m,
      user_id: 101
    });
  });

  return allData.sort((a, b) => new Date(a.date) - new Date(b.date));
};

export const transactions = generateMockData();