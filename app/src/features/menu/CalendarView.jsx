import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './CalendarView.css';
import transApi from '../../api/transApi';
import { fetchHolidays } from '../../api/holidayApi';
import TransactionModal from '../auth/pages/TransactionModal';

// 달력 칸은 폭이 좁아 십만 단위 이상이면 잘리므로 만/억 단위로 축약해 표기한다.
// (우측 가계부 패널은 전체 금액을 그대로 보여준다)
const fmtCompact = (n) => {
  const abs = Math.abs(n);
  if (abs >= 1e8) return (n / 1e8).toFixed(abs % 1e8 === 0 ? 0 : 1).replace(/\.0$/, "") + "억";
  if (abs >= 1e4) return (n / 1e4).toFixed(abs % 1e4 === 0 ? 0 : 1).replace(/\.0$/, "") + "만";
  return n.toLocaleString();
};

function CalendarView({ currentDate, setCurrentDate }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toLocaleDateString('en-CA'));
  const [holidays, setHolidays] = useState({});
  const [listMode, setListMode] = useState('day'); // 'day' | 'month'
  const [searchTerm, setSearchTerm] = useState('');

  // 수정/삭제 모달
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState('view'); // 'view' | 'edit' | 'delete'
  const [selectedItem, setSelectedItem] = useState(null);

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
  const fetchTransactions = () => {
    if (!userId) return;
    transApi.getUserTrans(userId)
      .then(data => {
        if (!Array.isArray(data)) {
          setTransactions([]);
          return;
        }
        const mapped = data.map(t => ({
          id: t.transId || t.TRANS_ID || t.trans_id || t.id || 0,
          text: t.title || t.TITLE || '내역 없음',
          date: normalizeDate(t.transDate || t.TRANS_DATE || t.date || t.DATE),
          category: t.category || t.CATEGORY || '기타',
          type: (t.type || t.TYPE || 'OUT').toUpperCase(),
          amount: Number(t.originalAmount || t.ORIGINAL_AMOUNT || t.amount || 0),
          memo: t.memo || t.MEMO || '',
        }));
        setTransactions(mapped);
      })
      .catch(err => console.error("내역 로드 실패:", err));
  };

  useEffect(() => { fetchTransactions(); }, [userId]);

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

  // 우측 목록: '이 날' 또는 '이 달 전체' + 검색어
  const listItems = useMemo(() => {
    let base;
    if (listMode === 'day') {
      base = transactions.filter(item => item.date === selectedDate);
    } else {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      base = transactions
        .filter(item => {
          const d = new Date(item.date);
          return d.getFullYear() === year && d.getMonth() === month;
        })
        .sort((a, b) => new Date(b.date) - new Date(a.date));
    }
    const term = searchTerm.trim().toLowerCase();
    if (!term) return base;
    return base.filter(item =>
      item.text.toLowerCase().includes(term) || item.category.toLowerCase().includes(term)
    );
  }, [transactions, selectedDate, listMode, currentDate, searchTerm]);

  const monthlyTotalExpense = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    return transactions
      .filter(item => {
        const itemDate = new Date(item.date);
        return item.type === 'OUT' && itemDate.getFullYear() === year && itemDate.getMonth() === month;
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
            {income > 0 && <div className="income-tag">+{fmtCompact(income)}</div>}
            {expense > 0 && <div className="expense-tag">-{fmtCompact(expense)}</div>}
          </div>
        );
      }
    }
    return null;
  };

  // ---- 모달 열기/저장/삭제 ----
  const openView = (item) => { setSelectedItem(item); setModalType('view'); setIsModalOpen(true); };
  const openEdit = (e, item) => { e.stopPropagation(); setSelectedItem(item); setModalType('edit'); setIsModalOpen(true); };
  const openDelete = (e, item) => { e.stopPropagation(); setSelectedItem(item); setModalType('delete'); setIsModalOpen(true); };

  const handleSave = async (updated) => {
    if (!userId) { alert("로그인 정보가 없습니다."); return; }
    try {
      await transApi.updateTrans({
        transId: updated.id,
        title: updated.text,
        transDate: updated.date,
        originalAmount: Number(updated.amount),
        category: updated.category,
        type: updated.type,
        memo: updated.memo || '',
        userId: Number(userId),
        isShared: 'N',
      });
      alert("수정되었습니다.");
      setIsModalOpen(false);
      fetchTransactions();
    } catch (err) {
      console.error(err);
      alert("수정 중 오류가 발생했습니다.");
    }
  };

  const handleDelete = async (id) => {
    try {
      await transApi.deleteTrans(id);
      alert("삭제되었습니다.");
      setIsModalOpen(false);
      fetchTransactions();
    } catch (err) {
      console.error(err);
      alert("삭제 중 오류가 발생했습니다.");
    }
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
            onClickDay={(date) => { setSelectedDate(date.toLocaleDateString('en-CA')); setListMode('day'); }}
            tileContent={renderTileContent}
            formatDay={(locale, date) => date.getDate()}
            activeStartDate={currentDate}
            onActiveStartDateChange={({ activeStartDate }) => setCurrentDate(activeStartDate)}
            calendarType="gregory"
            tileClassName={getTileClassName}
          />
        </div>

        <div className="detail-card">
          <div className="ledger-head">
            <h3 className="detail-title">
              {listMode === 'day' ? `${selectedDate} 내역` : `${currentDate.getMonth() + 1}월 전체`}
            </h3>
            <button type="button" className="ledger-add-btn" onClick={() => navigate('/mypage/expenseForm')}>
              + 추가
            </button>
          </div>

          <div className="ledger-toggle" role="group" aria-label="목록 범위">
            <button type="button" className={`ledger-toggle-btn ${listMode === 'day' ? 'active' : ''}`} onClick={() => setListMode('day')}>이 날</button>
            <button type="button" className={`ledger-toggle-btn ${listMode === 'month' ? 'active' : ''}`} onClick={() => setListMode('month')}>이 달 전체</button>
          </div>

          <input
            type="text"
            className="ledger-search"
            placeholder="내역 검색 (내용/카테고리)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <div className="detail-list-container">
            {listItems.length > 0 ? (
              <ul className="detail-list">
                {listItems.map((item) => (
                  <li key={item.id} className="ledger-item">
                    <div className="ledger-item-main" onClick={() => openView(item)}>
                      <div className="ledger-item-title">{item.text}</div>
                      <div className="ledger-item-sub">
                        {item.category}{listMode === 'month' ? ` · ${item.date}` : ''}
                      </div>
                    </div>
                    <div className="ledger-item-right">
                      <div
                        className="ledger-item-amt"
                        style={{ color: item.type === 'IN' ? 'var(--income-color)' : 'var(--expense-color)' }}
                      >
                        {item.type === 'IN' ? '+' : '-'}{item.amount.toLocaleString()}원
                      </div>
                      <div className="ledger-item-actions">
                        <button type="button" onClick={(e) => openEdit(e, item)}>수정</button>
                        <button type="button" className="del" onClick={(e) => openDelete(e, item)}>삭제</button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="ledger-empty">
                {searchTerm.trim()
                  ? '검색 결과가 없어요.'
                  : (listMode === 'day' ? '이 날 등록된 내역이 없어요.' : '이 달 등록된 내역이 없어요.')}
              </p>
            )}
          </div>
        </div>
      </div>

      <TransactionModal
        isOpen={isModalOpen}
        type={modalType}
        transaction={selectedItem}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        onDelete={handleDelete}
      />
    </main>
  );
}

export default CalendarView;
