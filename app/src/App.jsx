import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import MyPageLayout from "./features/auth/pages/MyPageLayout";
import MyPage from "./features/auth/pages/MyPage";
import CalendarView from "./features/menu/CalendarView";
import ProfileSettings from "./features/auth/pages/ProfileSettings";
import AuthLayout from "./layouts/AuthLayout";
import FindIdPage from "./features/auth/pages/FindIdPage";
import FindPasswordPage from "./features/auth/pages/FindPasswordPage";
import PrivateRoute from "./routes/PrivateRoute";
import { transactions } from './Data/mockData'; //목업 수입지출데이터
import RegisterPage from './features/auth/pages/RegisterPage';
import LoginPage from './features/auth/pages/LoginPage';
import ResetPasswordPage from "./features/auth/pages/ResetPasswordPage";
import MyAccountBook from "./features/auth/pages/MyAccountBook";
import ExpensePage from './features/auth/pages/ExpensePage';
import FixedTransPage from "./features/auth/pages/FixedTransPage";
import KakaoCallback from "./features/auth/pages/KakaoCallback";
import SocialRegisterPage from "./features/auth/pages/SocialRegisterPage";
import CoachChatPage from "./features/coaching/CoachChatPage";
import GrowthReportPage from "./features/coaching/GrowthReportPage";

function App() {
  const [calendarDate, setCalendarDate] = useState(new Date());

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />

        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/find-id" element={<FindIdPage />} />
          <Route path="/find-password" element={<FindPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/auth/kakao/callback" element={<KakaoCallback />} />
          <Route path="/social-register" element={<SocialRegisterPage />} />
        </Route>

        {/* 로그인 필요 */}
        <Route
          path="/mypage"
          element={
            <PrivateRoute>
              <MyPageLayout />
            </PrivateRoute>
          }
        >
          <Route index element={<MyPage />} />
          <Route path="assets" element={<MyPage />} />

          <Route
            path="calendarView"
            element={
              <CalendarView
                transactions={transactions}
                currentDate={calendarDate}
                setCurrentDate={setCalendarDate}
              />
            }
          />

          <Route path="profileSettings" element={<ProfileSettings />}/>
          <Route path="myAccountBook" element={<MyAccountBook />} />
          <Route path='expenseForm' element={<ExpensePage/>}/>
          <Route path="fixedTrans" element={<FixedTransPage />} />
          <Route path="coaching/chat/:threadId" element={<CoachChatPage />} />
          <Route path="coaching/report" element={<GrowthReportPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
