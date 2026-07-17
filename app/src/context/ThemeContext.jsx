import React, { createContext, useContext, useEffect, useState, useCallback } from "react";

const ThemeContext = createContext(null);
const STORAGE_KEY = "osori_theme"; // 'system' | 'light' | 'dark'

const getSystemDark = () =>
  typeof window !== "undefined" &&
  window.matchMedia &&
  window.matchMedia("(prefers-color-scheme: dark)").matches;

// 선호값(pref)을 실제 테마('light'|'dark')로 해석해 <html data-theme>에 반영
function applyTheme(pref) {
  const resolved = pref === "dark" || (pref === "system" && getSystemDark()) ? "dark" : "light";
  document.documentElement.setAttribute("data-theme", resolved);
  return resolved;
}

export function ThemeProvider({ children }) {
  const [pref, setPref] = useState(() => localStorage.getItem(STORAGE_KEY) || "system");
  const [resolved, setResolved] = useState(() =>
    document.documentElement.getAttribute("data-theme") || "light"
  );

  // 선호값이 바뀌면 저장 + 즉시 적용
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, pref);
    setResolved(applyTheme(pref));
  }, [pref]);

  // 'system'일 때만 OS 테마 변경을 실시간 추종
  useEffect(() => {
    if (pref !== "system" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => setResolved(applyTheme("system"));
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [pref]);

  const setTheme = useCallback((next) => setPref(next), []);

  const value = { pref, resolved, setTheme };
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
