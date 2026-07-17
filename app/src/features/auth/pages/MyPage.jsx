import React, { useEffect, useState, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./MyPage.css";
import { useAuth } from "../../../context/AuthContext";
import ZScoreNotification from "../../Util/ZScoreNotification";
import transApi from "../../../api/transApi";
import ExpenseChart from "./ExpenseChart";
import MonthlyTrendChart from "./MonthlyTrendChart";

const MyPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [, setIsLoading] = useState(true);
  const [currentDate] = useState(new Date());
  const [transactions, setTransactions] = useState([]);
  const [showRecent, setShowRecent] = useState(true);
  const [analysisDate, setAnalysisDate] = useState(new Date());
  const [activeSlide, setActiveSlide] = useState(0);
  const carouselRef = useRef(null);

  const analysisYear = analysisDate.getFullYear();
  const analysisMonth = analysisDate.getMonth() + 1;

  const handleCarouselScroll = () => {
    const el = carouselRef.current;
    if (!el) return;
    const index = Math.round(el.scrollLeft / el.clientWidth);
    setActiveSlide(index);
  };

  const goToSlide = (index) => {
    const el = carouselRef.current;
    if (!el) return;
    el.scrollTo({ left: index * el.clientWidth, behavior: "smooth" });
  };

  const handlePrevMonth = () => {
    setAnalysisDate(new Date(analysisDate.getFullYear(), analysisDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setAnalysisDate(new Date(analysisDate.getFullYear(), analysisDate.getMonth() + 1, 1));
  };

  //내 가계부 지출액 표시 함수
  const loadData = async () => {
    setIsLoading(true);
    try {
      if (user?.userId) {
        const transData = await transApi.getUserTrans(user.userId);
        const mappedData = (transData || []).map((item) => {
          const rawDate = item.transDate || item.TRANS_DATE || item.date || "";
          let formattedDate = rawDate;
          if (rawDate && typeof rawDate === "string" && rawDate.includes("/")) {
            const [yy, mm, dd] = rawDate.split("/");
            formattedDate = `20${yy}-${mm}-${dd}`;
          }

          return {
            id: item.transId || item.TRAN_ID || item.trans_id || item.id || 0,
            text: item.title || item.TITLE || item.text || "",
            amount: Number(item.originalAmount || item.ORIGINAL_AMOUNT || item.amount || 0),
            date: formattedDate,
            type: item.type || item.TYPE,
            category: item.category || item.CATEGORY || "기타",
          };
        });
        setTransactions(mappedData);
      }
    } catch (error) {
      console.error('데이터 로딩 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const totalMonthlyExpenditure = useMemo(() => {
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();

    return transactions
      .filter((t) => {
        // 날짜 파싱 (26/01/28 또는 2026-01-28 대응)
        const dateStr = t.date;
        if (!dateStr) return false;

        const parts = dateStr.split(/[/.-]/);
        let year, month;

        if (parts.length === 3) {
          year = parseInt(parts[0]);
          if (year < 100) year += 2000; // 26 -> 2026 변환
          month = parseInt(parts[1]) - 1;
        } else {
          const d = new Date(dateStr);
          year = d.getFullYear();
          month = d.getMonth();
        }

        // 이번 달 지출(OUT)만 필터링
        return (
          year === currentYear &&
          month === currentMonth &&
          t.type?.toUpperCase() === 'OUT'
        );
      })
      .reduce((sum, t) => sum + Math.abs(t.amount || 0), 0);
  }, [transactions, currentDate]);

  const recentExpenses = useMemo(() => {
    return transactions
      .filter((t) => t.type?.toUpperCase() === 'OUT')
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 3);
  }, [transactions]);

  useEffect(() => {
    loadData();
  }, [user?.userId]);

  return (
    <main className="fade-in">
      <div className="home-summary-card">
        <div className="expense-summary-bar">
          <span className="expense-summary-label">이번 달 지출</span>
          <span className="expense-summary-amount">{totalMonthlyExpenditure.toLocaleString()}원</span>
        </div>

        <ZScoreNotification transactions={transactions} currentDate={currentDate} />

        <div className="home-shortcut-row">
          <button className="home-shortcut-btn" onClick={() => navigate("/mypage/expenseForm")}>
            지출 등록
          </button>
          <button className="home-shortcut-btn" onClick={() => navigate("/mypage/myAccountBook")}>
            내역 보기
          </button>
        </div>

        <div className="recent-expense-section">
          <div className="recent-expense-header">
            <h3>최근 지출</h3>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={showRecent}
                onChange={() => setShowRecent((prev) => !prev)}
              />
              <span className="toggle-slider" />
            </label>
          </div>

          {showRecent && (
            <ul className="recent-expense-list">
              {recentExpenses.length > 0 ? (
                recentExpenses.map((t) => (
                  <li key={t.id} className="recent-expense-item">
                    <div className="recent-expense-info">
                      <span className="recent-expense-name">{t.text}</span>
                      <span className="recent-expense-date">{t.date}</span>
                    </div>
                    <span className="recent-expense-amount">{Math.abs(t.amount).toLocaleString()}원</span>
                  </li>
                ))
              ) : (
                <li className="recent-expense-empty">최근 지출 내역이 없습니다.</li>
              )}
            </ul>
          )}
        </div>
      </div>

      <div className="home-analysis-section">
        <div className="month-selector-container">
          <div className="month-nav-group">
            <button onClick={handlePrevMonth} className="nav-btn">◀</button>
            <span className="month-nav-label">{analysisYear}년 {analysisMonth}월 분석</span>
            <button onClick={handleNextMonth} className="nav-btn">▶</button>
          </div>
        </div>

        <div
          className="chart-carousel"
          ref={carouselRef}
          onScroll={handleCarouselScroll}
        >
          <div className="chart-slide">
            <ExpenseChart transactions={transactions} currentDate={analysisDate} />
          </div>
          <div className="chart-slide">
            <MonthlyTrendChart transactions={transactions} currentDate={analysisDate} />
          </div>
        </div>

        <div className="carousel-dots">
          {[0, 1].map((i) => (
            <button
              key={i}
              className={`carousel-dot ${activeSlide === i ? "active" : ""}`}
              onClick={() => goToSlide(i)}
              aria-label={`${i + 1}번째 분석 보기`}
            />
          ))}
        </div>
      </div>
    </main>
  );
};

export default MyPage;
