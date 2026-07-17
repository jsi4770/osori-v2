import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import "./MyPage.css";
import { useAuth } from "../../../context/AuthContext";
import ZScoreNotification from "../../Util/ZScoreNotification";
import transApi from "../../../api/transApi";

const MyPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [, setIsLoading] = useState(true);
  const [currentDate] = useState(new Date());
  const [transactions, setTransactions] = useState([]);

  //내 가계부 지출액 표시 함수
  const loadData = async () => {
    setIsLoading(true);
    try {
      if (user?.userId) {
        const transData = await transApi.getUserTrans(user.userId);
        setTransactions(transData);
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
        const dateStr = t.date || t.transDate;
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
      .reduce((sum, t) => sum + Math.abs(t.amount || t.originalAmount || 0), 0);
  }, [transactions, currentDate]);

  useEffect(() => {
    loadData();
  }, [user?.userId]);

  return (
    <main className="fade-in">
      <div className="account-book-grid">
        <div className="info-card"
          onClick={() => navigate("/mypage/myAccountBook")}
          style={{ cursor: "pointer" }}
        >
          <div className="card-title-area">
            <h3>내 가계부</h3>
          </div>
          <div className="account-detail">
            <p className="amount-title" style={{ justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>이번 달 지출 </p>
            <p className="amount" style={{ justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>{totalMonthlyExpenditure.toLocaleString()}원</p>

            <ZScoreNotification transactions={transactions} currentDate={currentDate} />
          </div>
        </div>
      </div>
    </main>
  );
};

export default MyPage;
