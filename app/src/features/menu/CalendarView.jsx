import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './CalendarView.css';
import transApi from '../../api/transApi';
import { fetchHolidays } from '../../api/holidayApi';

function CalendarView({ currentDate, setCurrentDate }) {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toLocaleDateString('en-CA'));
  const [holidays, setHolidays] = useState({});

  const userId = user?.userId || user?.USER_ID || user?.id;

  const normalizeDate = (dateStr) => {
    if (!dateStr) return "";
    const cleanStr = String(dateStr).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(cleanStr)) return cleanStr;
    const parts = cleanStr.split(/[/|-]/);
    if (parts.length === 3) {
      let [y, m, d] = parts;
      if (y.length === 2) y = "20" + y;
      return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    }
    return cleanStr;
  };

  // 내가 등록한 수입/지출 내역을 가계부와 동일하게 불러온다(로그인 토큰 기반 api 인스턴스 사용).
  useEffect(() => {
    if (!userId) return;
    transApi.getUserTrans(userId)
      .then(data => {
        if (!Array.isArray(data)) {
          setTransactions([]);
          return;
        }
        const mapped = data.map(t => ({
          date: normalizeDate(t.transDate || t.TRANS_DATE || t.date || t.DATE),
          title: t.title || t.TITLE || '내역 없음',
          category: t.category || t.CATEGORY || '기타',
          type: (t.type || t.TYPE || 'OUT').toUpperCase(),
          amount: Number(t.originalAmount || t.ORIGINAL_AMOUNT || t.amount || 0),
          memo: t.memo || t.MEMO || '',
        }));
        setTransactions(mapped);
      })
      .catch(err => console.error("내역 로드 실패:", err));
  }, [userId]);

  //공휴일
  useEffect(() => {
    const getHolidays = async () => {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      const data = await fetchHolidays(year, month);
      setHolidays(data);
    };
    getHolidays();
  }, [currentDate]);

  const getTileClassName = ({ date, view }) => {
    if (view === 'month') {
      const dateStr = date.toLocaleDateString('en-CA');
      if (holidays[dateStr] || date.getDay() === 0) return 'holiday-red';
      if (date.getDay() === 6) return 'holiday-blue';
    }
    return null;
  };

  const details = useMemo(() => {
    if (!selectedDate) return [];
    return transactions.filter(item => item.date === selectedDate);
  }, [transactions, selectedDate]);

  const monthlyTotalExpense = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    return transactions
      .filter(item => {
        const itemDate = new Date(item.date);
        return item.type === 'OUT' &&
               itemDate.getFullYear() === year &&
               itemDate.getMonth() === month;
      })
      .reduce((sum, item) => sum + item.amount, 0);
  }, [transactions, currentDate]);

  const renderTileContent = ({ date, view }) => {
    if (view === 'month' && date instanceof Date) {
      const dateStr = date.toLocaleDateString('en-CA');
      const dayData = transactions.filter(item => item.date === dateStr);
      if (dayData.length > 0) {
        const income = dayData.filter(i => i.type === 'IN').reduce((s, i) => s + i.amount, 0);
        const expense = dayData.filter(i => i.type === 'OUT').reduce((s, i) => s + i.amount, 0);
        return (
          <div className="amount-container">
            {income > 0 && <div className="income-tag">+{income.toLocaleString()}</div>}
            {expense > 0 && <div className="expense-tag">-{expense.toLocaleString()}</div>}
          </div>
        );
      }
    }
    return null;
  };

  return (
    <main className="fade-in calendar-page-container">
      <div className="calendar-content-wrapper" style={{ display: 'flex', gap: '20px' }}>
        <div className="calendar-card">
          <div className='calender-title'>
            <div className="calendar-summary">
              <span style={{ fontSize: '0.9rem', color: 'var(--text-weak)', marginRight: '5px' }}>
                {currentDate.getMonth() + 1}월 총 지출:
              </span>
              <strong style={{ color: 'var(--expense-color)', fontSize: '1.3rem' }}>
                {monthlyTotalExpense.toLocaleString()}
              </strong>원
            </div>
          </div>

          <Calendar
            onClickDay={(date) => setSelectedDate(date.toLocaleDateString('en-CA'))}
            tileContent={renderTileContent}
            formatDay={(locale, date) => date.getDate()}
            activeStartDate={currentDate}
            onActiveStartDateChange={({ activeStartDate }) => setCurrentDate(activeStartDate)}
            calendarType="gregory"
            tileClassName={getTileClassName}
          />
        </div>

        <div className="detail-card">
          <h3 className="detail-title">{selectedDate} 내역</h3>
          <div className="detail-list-container">
            {details.length > 0 ? (
              <ul className="detail-list">
                {details.map((item, idx) => (
                  <li key={idx} className="detail-item">
                    <div className="item-info">
                      <div className="item-store">{item.title}</div>
                      <div className="item-body">
                        <span className="item-category">{item.category}</span>
                        {item.memo && <span className="item-memo">{item.memo}</span>}
                      </div>
                    </div>
                    <div
                      className={`item-amount ${item.type}`}
                      style={{ color: item.type === 'IN' ? 'var(--income-color)' : 'var(--expense-color)' }}
                    >
                      {item.type === 'IN' ? '+' : '-'}{item.amount.toLocaleString()}원
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p>거래 내역이 없습니다.</p>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

export default CalendarView;
