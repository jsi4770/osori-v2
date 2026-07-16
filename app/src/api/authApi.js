import { apiFetch } from "./http";

export const authApi = {
  login: (loginId, password) =>
    apiFetch("/user/login", { method: "POST", body: { loginId, password }, auth: false }),

  register: (data) =>
    apiFetch("/user/register", {
      method: "POST",
      body: data,
      auth: false,
    }),

  // API(/user/checkid?loginId=)
  checkId: (loginId) =>
    apiFetch(`/user/checkId?loginId=${encodeURIComponent(loginId)}`, { auth: false }),

  //닉네임 중복 체크
  checkNickName: (nickName) =>
    apiFetch(`/user/checkNickName?nickName=${encodeURIComponent(nickName)}`, { auth: false }),

  //이메일 중복 체크
  checkEmail: (email) =>
    apiFetch(`/user/checkEmail?email=${encodeURIComponent(email)}`, { auth: false }),

  // =============================
  // [ADDED] 아이디/비밀번호 찾기 관련 API
  // - 매핑 주소는 백엔드 구현에 맞춰 여기만 바꾸면 됨.
  // - 로그인 없이 호출하는 흐름이라 auth:false 로 둠.
  // - response 예시(가정): { message: "...", loginId: "xxx" }
  // =============================

  // 아이디 찾기: 이메일을 보내면 서버가 message/loginId 등을 내려주는 형태
  findLoginIdByEmail: (email) =>
    apiFetch("/user/findId", { method: "POST", body: { email }, auth: false }),

  // 비밀번호 찾기 1단계: 아이디 존재 여부 확인(있으면 다음 단계로 이동)
  checkLoginIdForReset: (loginId) =>
    apiFetch("/user/findPassword", { method: "POST", body: { loginId }, auth: false }),

  // 비밀번호 재설정 2단계: loginId + newPassword 전달
  resetPassword: ({ loginId, newPassword }) =>
    apiFetch("/user/resetPassword", {
      method: "PATCH",
      body: { loginId, newPassword },
      auth: false,
    }),

  logout: () => apiFetch("/user/logout", { method: "POST" }), // 로그아웃

  //추가
  kakaoLogin: (code) =>
    apiFetch(`/user/kakao/callback?code=${code}`, { 
      method: "GET", 
      auth: false 
    }),
};



