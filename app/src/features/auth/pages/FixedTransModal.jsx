import React, { useEffect, useMemo, useState } from "react";
import { fixedTransApi } from "../../../api/fixedTransApi";
import { EXPENSE_CATEGORIES } from "../../../constants/categories";
import "./FixedTransModal.css";
const CATEGORY_OPTIONS = EXPENSE_CATEGORIES;

export default function FixedTransModal({
  userId,
  mode = "create", // "create" | "edit"
  initialValue = null, // 수정 시 기존 값
  onClose,
  onSuccess,
}) {
  const isEdit = mode === "edit";

  const today = useMemo(() => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }, []);

  const [isLoading, setIsLoading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    amount: "",
    category: "",
    payDay: 1, // int (1~31)
    transDate: today, // DB에 NOT NULL이라 일단 오늘로 보냄(서버에서 sysdate로 처리해도 됨)
  });

  useEffect(() => {
    if (isEdit && initialValue) {
      setForm({
        name: initialValue.name ?? "",
        amount: initialValue.amount ?? "",
        category: initialValue.category ?? "",
        payDay: Number(initialValue.payDay ?? 1),
        transDate: (initialValue.transDate ?? today)?.toString().slice(0, 10),
      });
    }
  }, [isEdit, initialValue, today]);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    if (!form.name.trim()) return "고정지출 이름을 입력해주시기 바랍니다.";
    const amountNum = Number(form.amount);
    if (!Number.isFinite(amountNum) || amountNum <= 0) return "금액은 0원보다 커야합니다.";
    if (!form.category?.toString().trim()) return "카테고리를 선택해주시기 바랍니다.";
    const payDayNum = Number(form.payDay);
    if (!Number.isInteger(payDayNum) || payDayNum < 1 || payDayNum > 31) return "결제일은 1일~31일 사이어야합니다.";
    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const msg = validate();
    if (msg) return alert(msg);

    setIsLoading(true);
    try {
      const payload = {
        userId,
        name: form.name.trim(),
        amount: Number(form.amount),
        category: form.category.toString().trim(),
        payDay: Number(form.payDay),
        transDate: form.transDate,
      };

      if (isEdit) {
        //await fixedTransApi.update(initialValue.fixedId, payload);
        await fixedTransApi.update({...payload, fixedId: initialValue.fixedId});
        alert("수정이 완료되었습니다.");
      } else {
        await fixedTransApi.create(payload);
        alert("고정지출이 등록되었습니다.");
      }

      onSuccess?.();
      onClose?.();
    } catch (err) {
      console.error(err);
      alert("고정지출 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="ftmOverlay" onMouseDown={onClose}>
      <div className="ftmModal" onMouseDown={(e) => e.stopPropagation()}>
        <h3 className="ftmTitle">{isEdit ? "고정지출 수정" : "고정지출 추가"}</h3>

        <form onSubmit={handleSubmit} className="ftmForm">
          <label className="ftmLabel" htmlFor="name">
            이름
          </label>
          <input
            className="ftmInput"
            id="name"
            name="name"
            type="text"
            placeholder="예) 넷플릭스, 월세, 통신비"
            value={form.name}
            onChange={onChange}
          />

          <label className="ftmLabel" htmlFor="amount">
            금액
          </label>
          <input
            className="ftmInput"
            id="amount"
            name="amount"
            type="number"
            placeholder="예) 15000"
            value={form.amount}
            onChange={onChange}
          />

          <label className="ftmLabel" htmlFor="category">
            카테고리
          </label>
          <div className="ftmSelectWrap">
            <select
              className="ftmSelect"
              id="category"
              name="category"
              value={form.category}
              onChange={onChange}
            >
              <option value="" disabled>
                카테고리 선택
              </option>
              {CATEGORY_OPTIONS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <span className="ftmSelectArrow" aria-hidden="true">
              ▾
            </span>
          </div>

          <label className="ftmLabel" htmlFor="payDay">
            결제일(매달)
          </label>
          <div className="ftmSelectWrap">
            <select className="ftmSelect" id="payDay" name="payDay" value={form.payDay} onChange={onChange}>
              {Array.from({ length: 30 }, (_, i) => i + 1).map((d) => (
                <option key={d} value={d}>
                  매달 {d}일
                </option>
              ))}
              {/* 31은 달마다 마지막 날(28~31일)로 클램핑되어 처리되므로 "말일"로 안내한다 */}
              <option value={31}>매월 말일</option>
            </select>
            <span className="ftmSelectArrow" aria-hidden="true">
              ▾
            </span>
          </div>

          <input type="hidden" name="transDate" value={form.transDate} readOnly />

          <div className="ftmButtonGroup">
            <button className="ftmBtn ftmPrimary" type="submit" disabled={isLoading}>
              {isLoading ? "처리중..." : isEdit ? "수정" : "추가"}
            </button>
            <button className="ftmBtn ftmGhost" type="button" onClick={onClose} disabled={isLoading}>
              취소
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

