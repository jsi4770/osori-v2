import { apiFetch } from "./http";

export const userApi = {
  
  checkNickName: (nickName) =>
    apiFetch(`/user/checkNickName?nickName=${encodeURIComponent(nickName)}`),

  checkEmail: (email) => apiFetch(`/user/checkEmail?email=${encodeURIComponent(email)}`),

  // 내 정보 수정 (닉네임/이름/이메일 등)
  updateMe: (payload) => apiFetch("/user/update", { method: "PATCH", body: payload }),

  // 비밀번호 변경
  changePassword: ({ currentPassword, newPassword }) =>
    apiFetch("/user/updatePassword", {
      method: "PATCH",
      body: { currentPassword, newPassword },
    }),

  // 회원탈퇴
  // 예시: POST /osori/user/delete 
  // (DELETE + body는 서버에서 막는 경우가 많아서 POST로 잡아둠)
  withdraw: ({ password }) =>
    apiFetch("/user/delete", {
      method: "DELETE",
      body: { password },
    }),

  unlinkKakao: () => {
    return apiFetch("/user/kakao/unlink", {
      method: "POST", // 연동 해제는 데이터를 변경하므로 POST 방식이 적합합니다.
    });
  },  
};


