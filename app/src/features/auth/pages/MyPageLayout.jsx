
import React, { useEffect } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import "./MyPage.css";
import { useAuth } from "../../../context/AuthContext";
import { useState,useRef } from "react";
import { faqApi } from "../../../api/faqApi";
import { IconHome, IconCalendar, IconTrendingUp, IconUser, IconReceipt } from "../../../components/icons";

const MyPageLayout = ({refreshGroupList}) => {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const scrollRef = useRef();
  const [isFaqModalOpen,setIsFaqModalOpen] =useState(false);
  const [faqList, setFaqList] = useState([]);
  const [newQuestion,setNewQuestion] = useState('');
  const [isInputVisible, setIsInputVisible] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      type: 'bot',
      message: '반가워요! 😊 똑똑한 돈 관리, 무엇부터 도와드릴까요?'
    }
  ]);

  const handleLogout = () => {
    logout();
    navigate("/", { replace: true });
  };

  //faq 리스트 불러오기
  const fetchFaqList = async()=>{
      try{
        const data = await faqApi.faqList();

        setFaqList(data);
      }catch(error){
        console.error('FAQ 질문 목록 조회 실패',error);
        navigate('/mypage');    
      }
  }

  useEffect(() => {
  if (isFaqModalOpen) {
    fetchFaqList();
    setMessages([{
      id: 'welcome',
      type: 'bot',
      message: '반가워요! 😊 똑똑한 돈 관리, 무엇부터 도와드릴까요?'
    }]);
  }
}, [isFaqModalOpen]);

  const handleQuestionClick = (faqId) => {
    // 해당 질문과 답변 데이터
    const selectedFaq = faqList.find(item => item.faqId === faqId);
    
    if (!selectedFaq) return;

    const userMsg = { id: Date.now(), type: 'user', message: selectedFaq.question };
    setMessages(prev => [...prev, userMsg]);

    setTimeout(() => {
      const botMsg = { id: Date.now() + 1, type: 'bot', message: selectedFaq.answer };
      setMessages(prev => [...prev, botMsg]);
    }, 600); // 0.6초 뒤에 답변 등장
  };

  const handleNewQuestioSubmit = async() => {
    try{
      const response = await faqApi.addNewQuestion(newQuestion);
      console.log(response);

      alert("질문이 성공적으로 저장되었습니다.");
      setIsInputVisible(false);
    }catch(error){
      console.log("질문 등록 오류 발생",error);
      alert("질문 등록중에 오류가 발생했습니다. 다시 시도해 주세요.");
    }
    setNewQuestion('');
  };


  const displayName = user?.nickName || user?.nickname || user?.userName || "회원";

  return (
    <div className="mypage-container">
      <div className="mobile-topbar">
        <div className="mobile-topbar-logo" onClick={() => navigate("/mypage/assets")}>OSORI</div>

        <button
          className="mobile-profile-chip"
          onClick={() => navigate("/mypage/profileSettings")}
          aria-label="프로필 설정으로 이동"
        >
          <span className="mobile-profile-avatar">
            <IconUser size={15} aria-hidden />
          </span>
          <span className="mobile-profile-name">{displayName}</span>
        </button>
      </div>

      <aside className="sidebar">
        <div className="logo" onClick={() => navigate("/mypage/assets")} style={{ cursor: "pointer", padding: "0 20px 30px" }}>
          OSORI
        </div>

        <ul className="sidebar-menu">
          <li>
            <NavLink to="/mypage/assets" className={({ isActive }) => `menu-item ${isActive ? "active" : ""}`}>
              <IconHome size={19} /> <span>홈</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/mypage/calendarView" className={({ isActive }) => `menu-item ${isActive ? "active" : ""}`}>
              <IconCalendar size={19} /> <span>캘린더뷰</span>
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/mypage/fixedTrans"
              className={({ isActive }) => `menu-item ${isActive ? "active" : ""}`}
            >
              <IconReceipt size={19} /> <span>고정지출</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/mypage/coaching/report" className={({ isActive }) => `menu-item ${isActive ? "active" : ""}`}>
              <IconTrendingUp size={19} /> <span>성장 리포트</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/mypage/profileSettings" className={({ isActive }) => `menu-item ${isActive ? "active" : ""}`}>
              <IconUser size={19} /> <span>프로필 설정</span>
            </NavLink>
          </li>

        </ul>

        <button className="logout-btn" onClick={handleLogout}>
          로그아웃
        </button>
      </aside>

      <nav className="mobile-bottom-nav">
        <NavLink to="/mypage/fixedTrans" className={({ isActive }) => `mbn-item ${isActive ? "active" : ""}`}>
          <span className="mbn-icon"><IconReceipt size={21} /></span>
          <span className="mbn-label">고정지출</span>
        </NavLink>
        <NavLink to="/mypage/calendarView" className={({ isActive }) => `mbn-item ${isActive ? "active" : ""}`}>
          <span className="mbn-icon"><IconCalendar size={21} /></span>
          <span className="mbn-label">캘린더</span>
        </NavLink>
        <NavLink to="/mypage/assets" className={({ isActive }) => `mbn-item ${isActive ? "active" : ""}`}>
          <span className="mbn-icon"><IconHome size={21} /></span>
          <span className="mbn-label">홈</span>
        </NavLink>
        <NavLink to="/mypage/coaching/report" className={({ isActive }) => `mbn-item ${isActive ? "active" : ""}`}>
          <span className="mbn-icon"><IconTrendingUp size={21} /></span>
          <span className="mbn-label">리포트</span>
        </NavLink>
        <NavLink to="/mypage/profileSettings" className={({ isActive }) => `mbn-item ${isActive ? "active" : ""}`}>
          <span className="mbn-icon"><IconUser size={21} /></span>
          <span className="mbn-label">설정</span>
        </NavLink>
      </nav>

      <div className="faq-container">
        {isFaqModalOpen && (
            <div className="faq-dropdown">
              <h4 style={{ textAlign: "center", marginBottom: "15px" }}>FAQ</h4>
              
              {/* 채팅 영역 */}
              <div className="faq-chat-area" ref={scrollRef}>
                {messages.map((msg, index) => (
                  <div key={index} className={`chat-row ${msg.type}`}>
                    <div className="chat-bubble">
                      {msg.message}
                    </div>
                  </div>
                ))}

                {/* 질문 선택 버튼 영역 */}
                {messages[messages.length - 1]?.type === 'bot' && (
                  <div className="question-list-area">
                    {faqList.length === 0 ? (
                      <p className="empty-msg">등록되어 있는 FAQ가 없습니다.</p>
                    ) : (
                      faqList.map((faq) => (
                        <button 
                          key={faq.faqId} 
                          className="faq-item-btn"
                          onClick={() => handleQuestionClick(faq.faqId)}
                        >
                          {faq.question}
                        </button>
                      ))
                    )}
                    {!isInputVisible ? (
                      <button 
                          className="faq-item-btn"
                          onClick={() => setIsInputVisible(true)}
                      >
                          새로운 질문을 등록해주세요.
                      </button>
                    ) : (
                        <div className="new-question-input-area">
                            <input 
                                type="text"
                                id="question"
                                name="question"
                                value={newQuestion}
                                onChange={(e) => setNewQuestion(e.target.value)}
                                placeholder="질문을 입력하세요."
                            />
                            <button onClick={handleNewQuestioSubmit}>등록</button>
                            <button onClick={() => setIsInputVisible(false)}>취소</button>
                        </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          <img className="qBot" 
            src="https://img.icons8.com/?size=100&id=f6ABPUNqMjFa&format=png&color=0066ff" 
            alt="질문봇 이미지"
            onClick={() => setIsFaqModalOpen(!isFaqModalOpen)}
          />
        </div>

      <main className="mypage-content">
        <Outlet />
      </main>
    </div>
  );
};

export default MyPageLayout;
