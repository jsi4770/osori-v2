import { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./FindPasswordPage.module.css";
import { authApi } from "../../../api/authApi";

export default function FindPasswordPage() {
  const navigate = useNavigate();

  // [CHANGED]
  const [loginId, setLoginId] = useState("");
  const [error, setError] = useState("");

  // [ADDED] 서버 응답 메시지/로딩
  const [serverMessage, setServerMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = (e) => {
    e.preventDefault();
    setError("");
    // [ADDED] 이전 서버 메시지 초기화
    setServerMessage("");

    const id = loginId.trim();
    if (!id) {
      setError("아이디를 입력해 주세요.");
      return;
    }

    // TODO: 여기서 원래는 서버로 "비밀번호 재설정 요청" API를 호출하는 게 정석
    // 지금은 2단계 화면 이동만 처리
   
    // - 매핑 주소는 authApi.checkLoginIdForReset 안에서 맞춰서 바꾸면 됨
    (async () => {
      try {
        setLoading(true);
        const data = await authApi.checkLoginIdForReset(id);
        const msg = data?.message || "확인이 완료되었습니다.";
        setServerMessage(msg);

        navigate("/reset-password", { state: { loginId: id } });
      } catch (err) {
        const msg = err?.data?.message || err?.data || "아이디 확인에 실패했습니다.";
        setError(String(msg));
      } finally {
        setLoading(false);
      }
    })();
  };

  return (
    <div className={styles.wrap}>
      <h1 className={styles.title}>비밀번호 찾기</h1>

      <form className={styles.form} onSubmit={onSubmit}>
        <div className={styles.label}>아이디</div>
        <input
          className={styles.input}
          value={loginId}
          onChange={(e) => setLoginId(e.target.value)}
          placeholder="아이디를 입력해 주세요."
          autoComplete="username"
        />

        {error && <div className={styles.error}>{error}</div>}

        {/* [ADDED] 서버 응답 메시지 */}
        {serverMessage && <div className={styles.ok}>{serverMessage}</div>}

        <button className={styles.submitBtn} type="submit" disabled={loading}>
          {loading ? "확인 중..." : "다음"}
        </button>
      </form>

      <button className={styles.subBtn} type="button" onClick={() => navigate("/login")}>
        로그인으로
      </button>
    </div>
  );
}

