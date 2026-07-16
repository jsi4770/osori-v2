import React, { useState, useEffect } from 'react';
import styles from './MyAccountBook.module.css';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import transApi from '../../../api/transApi';
import ExpenseChart from './ExpenseChart';
import MonthlyTrendChart from './MonthlyTrendChart';
import HomeCoachCard from '../../coaching/HomeCoachCard';

const EXPENSE_CATEGORIES = [
    "식비", "생활/마트", "쇼핑", "의료/건강",
    "교통", "문화/여가", "교육", "기타"
];

const INCOME_CATEGORIES = [
    "월급", "용돈", "금융소득", "상여금", "기타"
];

const TransactionModal = ({ isOpen, type, transaction, onClose, onSave, onDelete }) => {
    const [currentCategories, setCurrentCategories] = useState(EXPENSE_CATEGORIES);

    const today = new Date().toISOString().split('T')[0];

    const [formData, setFormData] = useState({
        text: '', amount: 0, date: '', category: '기타', memo: '', type: 'OUT'
    });

    useEffect(() => {
        if (transaction) {
            const transType = transaction.type || 'OUT';
            const categories = transType === 'IN' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
            setCurrentCategories(categories);

            setFormData({
                text: transaction.text,
                amount: Math.abs(transaction.amount),
                date: transaction.date,
                category: transaction.category,
                memo: transaction.memo || '',
                type: transType
            });
        }
    }, [transaction]);

    if (!isOpen) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;

        if (name === 'amount' && value < 0) {
            alert("금액은 0보다 커야 합니다.");
            return;
        }

        if (name === 'date' && value > today) {
            alert("미래 날짜는 선택할 수 없습니다.");
            setFormData(prev => ({ ...prev, [name]: today }));
            return;
        }
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleTypeChange = (e) => {
        const newType = e.target.value;
        const newCategories = newType === 'IN' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

        setCurrentCategories(newCategories);

        setFormData(prev => ({
            ...prev,
            type: newType,
            category: newCategories[0]
        }));
    };

    const isViewMode = type === 'view';
    const isDetailMode = type === 'edit' || type === 'view';

    return (
        <div className={styles['modal-overlay']} onClick={onClose}>
            <div className={styles['modal-content']} onClick={e => e.stopPropagation()}>
                {isDetailMode ? (
                    <>
                        <h3>{isViewMode ? '📄 내역 상세' : '✏️ 내역 수정'}</h3>

                        <div className={styles['modal-radio-group']}>
                            <label className={styles['radio-label']}>
                                <input
                                    type="radio" name="type" value="IN"
                                    checked={formData.type === 'IN'}
                                    onChange={handleTypeChange}
                                    disabled={isViewMode}
                                />
                                <span style={{ color: formData.type === 'IN' ? 'var(--income-color)' : '#ccc' }}>수입</span>
                            </label>
                            <label className={styles['radio-label']}>
                                <input
                                    type="radio" name="type" value="OUT"
                                    checked={formData.type === 'OUT'}
                                    onChange={handleTypeChange}
                                    disabled={isViewMode}
                                />
                                <span style={{ color: formData.type === 'OUT' ? 'var(--expense-color)' : '#ccc' }}>지출</span>
                            </label>
                        </div>

                        <div className={styles['modal-form']}>
                            <div>
                                <label className={styles['modal-label']}>날짜</label>
                                <input
                                    type="date" name="date" className={styles['modal-input']}
                                    value={formData.date} onChange={handleChange}
                                    readOnly={isViewMode} disabled={isViewMode}
                                    max={today} onBlur={(e) => {
                                        if (e.target.value > today) {
                                            alert("미래 날짜는 입력할 수 없습니다.");
                                            setFormData(prev => ({ ...prev, date: today }));
                                        }
                                    }}
                                />
                            </div>
                            <div>
                                <label className={styles['modal-label']}>내용</label>
                                <input
                                    type="text" name="text" className={styles['modal-input']}
                                    value={formData.text} onChange={handleChange}
                                    readOnly={isViewMode}
                                />
                            </div>
                            <div>
                                <label className={styles['modal-label']}>금액</label>
                                <input
                                    type="number" name="amount" className={styles['modal-input']}
                                    value={formData.amount} onChange={handleChange}
                                    readOnly={isViewMode} min="0"
                                />
                            </div>
                            <div>
                                <label className={styles['modal-label']}>카테고리</label>
                                {isViewMode ? (
                                    <input
                                        type="text" name="category" className={styles['modal-input']}
                                        value={formData.category} readOnly
                                    />
                                ) : (
                                    <select
                                        name="category"
                                        className={styles['modal-input']}
                                        value={formData.category}
                                        onChange={handleChange}
                                    >
                                        {currentCategories.map((cat, index) => (
                                            <option key={index} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                )}
                            </div>
                            <div>
                                <label className={styles['modal-label']}>메모</label>
                                <input
                                    type="text" name="memo" className={styles['modal-input']}
                                    value={formData.memo} onChange={handleChange}
                                    readOnly={isViewMode}
                                    placeholder={isViewMode ? "" : "메모를 입력하세요"}
                                />
                            </div>
                        </div>

                        <div className={styles['modal-actions']}>
                            <button className={`${styles['modal-btn']} ${styles.cancel}`} onClick={onClose}>
                                취소
                            </button>
                            {!isViewMode && (
                                <button className={`${styles['modal-btn']} ${styles.confirm}`} onClick={() => onSave({ ...transaction, ...formData })}>
                                    수정
                                </button>
                            )}
                        </div>
                    </>
                ) : (
                    <>
                        <h3>🗑️ 삭제 확인</h3>
                        <p style={{ textAlign: 'center', color: '#666', fontSize: '1rem', margin: '20px 0' }}>
                            <strong>"{transaction?.text}"</strong> 내역을<br />정말 삭제하시겠습니까?
                        </p>
                        <div className={styles['modal-actions']}>
                            <button className={`${styles['modal-btn']} ${styles.cancel}`} onClick={onClose}>취소</button>
                            <button className={`${styles['modal-btn']} ${styles.delete}`} onClick={() => onDelete(transaction.id)}>삭제</button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

function MyAccountBook() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [transactions, setTransactions] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [showIncome, setShowIncome] = useState(false);
    const [showExpense, setShowExpense] = useState(false);
    const [showShared, setShowShared] = useState(false);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const [analysisDate, setAnalysisDate] = useState(new Date());

    const handlePrevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalType, setModalType] = useState('view');
    const [selectedItem, setSelectedItem] = useState(null);

    const { user } = useAuth();
    const navigate = useNavigate();

    const fetchTransactions = () => {
        const userId = user?.userId || user?.USER_ID || user?.id || 1;

        transApi.getUserTrans(userId)
            .then(data => {
                if (!data || !Array.isArray(data)) {
                    setTransactions([]);
                    return;
                }
                const mappedData = data.map(item => {
                    const rawDate = item.transDate || item.TRANS_DATE || "";
                    let formattedDate = rawDate;
                    if (rawDate && typeof rawDate === 'string' && rawDate.includes('/')) {
                        const [yy, mm, dd] = rawDate.split('/');
                        formattedDate = `20${yy}-${mm}-${dd}`;
                    }

                    return {
                        id: item.transId || item.TRAN_ID || item.trans_id || item.id || 0,
                        text: item.title || item.TITLE,
                        amount: Number(item.originalAmount || item.ORIGINAL_AMOUNT || 0),
                        date: formattedDate,
                        type: item.type || item.TYPE,
                        category: item.category || item.CATEGORY || '기타',
                        memo: item.memo || item.MEMO || '',
                        isShared: item.isShared || item.IS_SHARED || 'N'
                    };
                });
                setTransactions(mappedData);
            })
            .catch(error => console.error("데이터 로드 실패:", error));
    };

    useEffect(() => {
        fetchTransactions();
    }, [user]);

    const openViewModal = (item) => {
        setSelectedItem(item);
        setModalType('view');
        setIsModalOpen(true);
    };

    const openEditModal = (e, item) => {
        e.stopPropagation();
        setSelectedItem(item);
        setModalType('edit');
        setIsModalOpen(true);
    };

    const openDeleteModal = (e, item) => {
        e.stopPropagation();
        setSelectedItem(item);
        setModalType('delete');
        setIsModalOpen(true);
    };

    const handleSave = async (updatedData) => {
        try {
            const currentUserId = user?.userId || user?.USER_ID || user?.id;

            if (!currentUserId) {
                alert("로그인 정보가 없습니다.");
                return;
            }

            const updateData = {
                transId: updatedData.id,
                title: updatedData.text,
                transDate: updatedData.date,
                originalAmount: Number(updatedData.amount),
                category: updatedData.category,
                type: updatedData.type,
                memo: updatedData.memo || '',
                userId: Number(currentUserId),
                isShared: 'N'
            };

            await transApi.updateTrans(updateData);
            alert("수정되었습니다.");
            setIsModalOpen(false);
            fetchTransactions();
        } catch (error) {
            console.error(error);
            alert("수정 중 오류가 발생했습니다.");
        }
    };

    const handleDelete = async (id) => {
        try {
            await transApi.deleteTrans(id);
            alert("삭제되었습니다.");
            setIsModalOpen(false);
            fetchTransactions();
        } catch (error) {
            console.error(error);
            alert("삭제 중 오류가 발생했습니다.");
        }
    };

    const filteredTransactions = [...transactions]
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .filter((t) => {
            const matchesSearch = t.text.toLowerCase().includes(searchTerm.toLowerCase());

            let matchesType = true;
            if (showIncome || showExpense || showShared) {
                if (showIncome && t.type?.toUpperCase() !== 'IN') matchesType = false;
                if (showExpense && t.type?.toUpperCase() !== 'OUT') matchesType = false;
                if (showShared && t.isShared !== 'Y') matchesType = false;
            }

            let matchesDate = true;
            if (startDate && t.date < startDate) matchesDate = false;
            if (endDate && t.date > endDate) matchesDate = false;

            return matchesSearch && matchesType && matchesDate;
        });

    const handleIncomeToggle = () => {
        if (showIncome) { setShowIncome(false); }
        else { setShowIncome(true); setShowExpense(false); setShowShared(false); }
    };

    const handleExpenseToggle = () => {
        if (showExpense) { setShowExpense(false); }
        else { setShowExpense(true); setShowIncome(false); setShowShared(false); }
    };

    const handleSharedToggle = () => {
        if (showShared) { setShowShared(false); }
        else { setShowShared(true); setShowIncome(false); setShowExpense(false); }
    };

    return (
        <main className="fade-in">
            <div className={styles.card}>
                <TransactionModal
                    isOpen={isModalOpen}
                    type={modalType}
                    transaction={selectedItem}
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleSave}
                    onDelete={handleDelete}
                />
                <div className={styles['left-side']}>
                    <div className={styles['list-card']}>
                        <header><h2 className={styles['header-title']}>💰 나의 가계부</h2></header>

                        <div className={styles['search-wrapper']}>
                            <div className={styles['filter-group']}>
                                <label className={styles['checkbox-label']}>
                                    <input
                                        type="checkbox"
                                        checked={showIncome}
                                        onChange={handleIncomeToggle}
                                    />
                                    <span className={`${styles['label-text']} ${styles.income}`}>수입</span>
                                </label>
                                <label className={styles['checkbox-label']}>
                                    <input
                                        type="checkbox"
                                        checked={showExpense}
                                        onChange={handleExpenseToggle}
                                    />
                                    <span className={`${styles['label-text']} ${styles.expense}`}>지출</span>
                                </label>
                                <label className={styles['checkbox-label']}>
                                    <input
                                        type="checkbox"
                                        checked={showShared}
                                        onChange={handleSharedToggle}
                                    />
                                    <span className={`${styles['label-text']} ${styles.shared}`}>그룹 지출</span>
                                </label>
                            </div>

                            <input
                                type="text"
                                className={styles['search-input']}
                                placeholder="내역 검색"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: '700' }}>거래 내역</h3>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={{ padding: '4px', borderRadius: '4px', border: '1px solid #ddd' }} />
                                <span>~</span>
                                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={{ padding: '4px', borderRadius: '4px', border: '1px solid #ddd' }} />
                            </div>
                        </div>

                        <div style={{ flex: 1, overflowY: 'auto', borderTop: '2px solid #2d3436' }}>
                            {filteredTransactions.length > 0 ? (
                                filteredTransactions.map((t, index) => (
                                    <div
                                        key={t.id || index}
                                        className={styles['list-item']}
                                        onClick={() => openViewModal(t)}
                                        style={{
                                            display: 'flex', justifyContent: 'space-between', padding: '15px 0', borderBottom: '1px solid #eee', cursor: 'pointer'
                                        }}
                                    >
                                        <div>
                                            <span className={styles['item-text']}>{t.text}</span>
                                            <span className={styles['item-date']}>{t.date}</span>
                                        </div>

                                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                            <span className={`${styles['item-amount']} ${t.type?.toUpperCase() === 'IN' ? styles.income : styles.expense}`}>
                                                {t.type?.toUpperCase() === 'IN' ? '+' : '-'}
                                                {Math.abs(t.amount).toLocaleString()}원
                                            </span>

                                            <div className={styles['item-actions']}>
                                                <button className={styles['action-btn']} onClick={(e) => openEditModal(e, t)}>수정</button>
                                                <button className={`${styles['action-btn']} ${styles['del-btn']}`} onClick={(e) => openDeleteModal(e, t)}>삭제</button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p style={{ textAlign: 'center', color: '#999', padding: '40px 0' }}>표시할 내역이 없습니다.</p>
                            )}
                        </div>
                    </div>
                    <button className={styles['add-btn']} onClick={() => navigate('/mypage/expenseForm')}>새 내역 추가하기</button>
                </div>

                <div className={styles['right-side']}>

                    <HomeCoachCard />

                    <div className={styles['month-selector-container']}>
                        <div className={styles['month-nav-group']}>
                            <button onClick={handlePrevMonth} className={styles['nav-btn']}>◀</button>
                            <span style={{ fontWeight: '800', fontSize: '1.2rem' }}>{currentYear}년 {currentMonth}월 분석</span>
                            <button onClick={handleNextMonth} className={styles['nav-btn']}>▶</button>
                        </div>
                    </div>
                    <div className={styles['chart-card']}>
                        <div className={styles['chart-main-container']}>
                            <ExpenseChart transactions={transactions} currentDate={currentDate} />
                        </div>
                    </div>

                    <div className={styles['chart-card']}>
                        <div className={styles['chart-main-container']}>
                            <MonthlyTrendChart transactions={transactions} currentDate={currentDate} />
                        </div>
                    </div>

                </div>
            </div>
        </main>
    );
}

export default MyAccountBook;