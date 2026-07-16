// src/api/fixedTransApi.js
import { apiFetch } from "./http";

/** 
 *
 * FIXEDTRANS 컬럼 기준:
 * fixedId, name, transDate, amount, category, payDay, userId
 */
export const fixedTransApi = {
  // 내 고정지출 목록 조회
  list: (userId) =>
    apiFetch(`/fixedtrans?userId=${encodeURIComponent(userId)}`),

  // 고정지출 등록
  create: (payload) =>
    apiFetch(`/fixedtrans/register`, {
      method: "POST",
      body: payload,
    }),

  // 고정지출 수정
  update: (payload) =>
    apiFetch(`/fixedtrans/update`, {
      method: "PATCH",
      body: payload,
    }),

  // 고정지출 삭제
  remove: (fixedId) =>
    apiFetch(`/fixedtrans/${encodeURIComponent(fixedId)}`, {
      method: "DELETE",
    }),
};
