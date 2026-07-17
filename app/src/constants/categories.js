// 수입/지출 카테고리 공용 상수. FixedTransModal/TransactionModal/ExpenseForm/ExpenseChart가
// 각자 하드코딩하던 목록을 여기 하나로 모아 추가/변경 시 한 곳만 고치면 되게 한다.

// 주거/월세, 통신비, 보험, 구독서비스는 고정지출과 강하게 연관된 카테고리라
// FIXED_EXPENSE_CATEGORIES로 따로 표시해 차트에서 고정비/변동비를 구분하는 데 쓴다.
export const FIXED_EXPENSE_CATEGORIES = ["주거/월세", "통신비", "보험", "구독서비스"];

export const EXPENSE_CATEGORIES = [
  "식비",
  "생활/마트",
  "쇼핑",
  "의료/건강",
  "교통",
  "문화/여가",
  "교육",
  ...FIXED_EXPENSE_CATEGORIES,
  "기타",
];

export const INCOME_CATEGORIES = ["월급", "용돈", "금융소득", "상여금", "기타"];

export const isFixedCategory = (category) => FIXED_EXPENSE_CATEGORIES.includes(category);
