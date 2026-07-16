import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { authApi } from "../../../api/authApi";
import styles from "./RegisterPage.module.css"; 

export default function SocialRegisterPage() {
  const navigate = useNavigate();
  const location = useLocation();

  
  const RULES = {
    loginId: {
      //  최소 하나의 영문자와 최소 하나의 숫자를 포함하는 8~16자 조합
      re: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,16}$/,
      msg: "영문과 숫자를 조합하여 8~16자로 입력해 주세요.",
    },
    userName: {
      re: /^[가-힣]{3,5}$/,
      msg: "한글 3~5자로 입력해 주세요.",
    }
  };

  // LoginPage에서 전달한 카카오 정보 (이메일, 닉네임, 고유ID)
  const { kakaoEmail, kakaoNickname, providerUserId } = location.state || {};

  const [form, setForm] = useState({
    loginId: "",
    password: "",
    userName: "",
    nickName: kakaoNickname || "",
    email: kakaoEmail || "",
    loginType : "KAKAO"
  });

  // 필드 에러 상태 관리
  const [fieldError, setFieldError] = useState({
    loginId: "",
    password: "",
    userName: "",
  });

  // 상태 관리
  const [idCheck, setIdCheck] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // 개별 필드 검증 함수
  const validateField = (name, rawValue) => {
    const value = (rawValue ?? "").trim();
    if (name === "password") return value ? "" : "비밀번호를 입력해 주세요.";

    const rule = RULES[name];
    if (!rule) return "";
    if (!value) return rule.msg;

    return rule.re.test(value) ? "" : rule.msg;
  };

  // 데이터 없으면 입구컷
  useEffect(() => {
    if (!kakaoEmail) {
      alert("카카오 인증 정보가 없습니다. 다시 로그인해주세요.");
      navigate("/login");
    }
  }, [kakaoEmail, navigate]);

  // 아이디 중복 체크 함수
  const handleCheckId = async () => {
    setError("");
    setIdCheck(null);

    const loginId = form.loginId.trim();
    if (!loginId) {
      setError("아이디를 입력해 주세요.");
      return;
    }

    // 중복체크 버튼 클릭 시에도 유효성 검사 수행
    const loginIdMsg = validateField("loginId", loginId);
    setFieldError((p) => ({ ...p, loginId: loginIdMsg }));
    if (loginIdMsg) return;

    try {
      const res = await authApi.checkId(loginId);
      const count = Number(res?.count ?? 0);
      setIdCheck({
        count,
        msg: count === 0 ? "사용 가능한 아이디입니다." : "이미 사용중인 아이디입니다.",
      });
    } catch (e) {
      setError("아이디 중복체크 실패");
    }
  };

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    setError("");
    if (name === "loginId") setIdCheck(null);

    // touched 조건 없이 입력 즉시 에러 상태 업데이트
    setFieldError((p) => ({
      ...p,
      [name]: validateField(name, value)
    }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // 제출 시 최종 검사
    const nextFieldError = {
      loginId: validateField("loginId", form.loginId),
      password: validateField("password", form.password),
      userName: validateField("userName", form.userName),
    };

    setFieldError(nextFieldError);

    const hasError = Object.values(nextFieldError).some(Boolean);
    if (hasError) {
      setError("입력값을 확인해 주세요.");
      return;
    }

    if (!idCheck || idCheck.count > 0) {
      setError("아이디 중복 확인을 완료해주세요.");
      return;
    }

    const payload = {
      user : {
        loginId : form.loginId.trim(),
        password : form.password,
        userName : form.userName.trim(),
        nickName : form.nickName,
        email : form.email
      }, 
      loginType : form.loginType,
      providerUserId : providerUserId
    };

    setIsLoading(true);
    try {
      await authApi.register(payload);
      alert("카카오 계정 가입 완료!");
      navigate("/login", { replace: true });
    } catch (err) {
      const msg = err?.data?.message || "가입 실패";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.wrap}>

      <div style={{
        backgroundColor: "#fffbe6",
        border: "1px solid #ffe58f",
        padding: "20px",
        borderRadius: "12px",
        marginBottom: "25px",
        fontSize: "14px",
        color: "#856404",
        lineHeight: "1.7",
        textAlign: "left",
        boxShadow: "0 2px 8px rgba(0,0,0,0.05)"
      }}>
        <div style={{ fontWeight: "bold", fontSize: "16px", marginBottom: "10px", display: "flex", alignItems: "center" }}>
          💡 기존 계정과 연결하고 싶으신가요?
        </div>
        <ul style={{ margin: "0", paddingLeft: "18px", fontSize: "13.5px" }}>
          <li style={{ marginBottom: "5px" }}>
            <b>기존 계정을 쓰시려면:</b> 일반 로그인을 통해 접속한 후, 기존 계정을 <b>탈퇴</b>하고 현재 카카오 계정으로 다시 가입해 주세요.
          </li>
          <li style={{ marginBottom: "5px" }}>
            <b>새로 가입하시려면:</b> 아래 양식을 작성하여 가입을 완료해 주시면 됩니다.
          </li>
          <li>
            보안을 위해 가입 후에는 <b>이메일 변경이 불가능</b>하니 신중히 확인해 주세요.
          </li>
        </ul>
      </div>

      <h1 className={styles.title}>소셜 회원가입</h1>

      <form className={styles.form} onSubmit={onSubmit}>
        
        {/* 아이디 섹션 */}
        <div className={styles.labelRow}>
          <div className={styles.label}>아이디</div>
          <button className={styles.checkBtn} type="button" onClick={handleCheckId}>
            중복체크
          </button>
        </div>
        <input
          className={styles.input}
          name="loginId"
          value={form.loginId}
          onChange={onChange}
          placeholder="영어/숫자 8~16자로 입력해 주세요."
        />
        {/* ✅ touched 조건 제거: 에러가 있으면 즉시 빨간 글씨 노출 */}
        {fieldError.loginId ? (
          <div className={`${styles.hint} ${styles.bad}`}>{fieldError.loginId}</div>
        ) : (
          idCheck && (
            <div className={`${styles.hint} ${idCheck.count === 0 ? styles.ok : styles.bad}`}>
              {idCheck.msg}
            </div>
          )
        )}

        {/* 비밀번호 섹션 */}
        <div className={styles.label}>비밀번호</div>
        <input
          className={styles.input}
          type="password"
          name="password"
          value={form.password}
          onChange={onChange}
          placeholder="비밀번호를 입력해 주세요."
        />
        {fieldError.password && (
          <div className={`${styles.hint} ${styles.bad}`}>{fieldError.password}</div>
        )}

        {/* 이름 섹션 */}
        <div className={styles.label}>이름</div>
        <input
          className={styles.input}
          name="userName"
          value={form.userName}
          onChange={onChange}
          placeholder="한글 3~5자로 입력해 주세요."
        />
        {fieldError.userName && (
          <div className={`${styles.hint} ${styles.bad}`}>{fieldError.userName}</div>
        )}

        {/* 닉네임 (소셜 고정 정보) */}
        <div className={styles.label}>닉네임 (소셜 정보)</div>
        <input 
          className={styles.input} 
          style={{ backgroundColor: '#f5f5f5', color: '#888' }} 
          value={form.nickName} 
          readOnly 
        />

        {/* 이메일 (소셜 고정 정보) */}
        <div className={styles.label}>이메일 (소셜 정보)</div>
        <input 
          className={styles.input} 
          style={{ backgroundColor: '#f5f5f5', color: '#888' }} 
          value={form.email} 
          readOnly 
        />

        {error && <div className={styles.error}>{error}</div>}

        <button className={styles.submitBtn} type="submit" disabled={isLoading}>
          {isLoading ? "가입 중..." : "가입하기"}
        </button>
      </form>

      <button className={styles.subBtn} type="button" onClick={() => navigate("/login")}>
        로그인으로 돌아가기
      </button>
    </div>
  );
}
