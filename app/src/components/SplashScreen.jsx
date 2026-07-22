import { useEffect, useState } from "react";
import { useAppReady } from "../context/AppReadyContext";
import "./SplashScreen.css";

const MIN_VISIBLE_MS = 2000;
// 딥링크 등 아무도 markReady()를 호출하지 않는 페이지에서도 스플래시가 무한정 남지
// 않도록 하는 안전장치 — 이 시간이 지나면 준비 신호를 기다리지 않고 강제로 사라진다.
const MAX_WAIT_MS = 4000;
const FADE_MS = 300;

// 앱 첫 실행 시 뜨는 스플래시. 최소 MIN_VISIBLE_MS만큼은 보여주되, 그 이후에는
// 실제 화면(홈 데이터 로딩 등)이 준비됐다는 신호(ready)를 받아야만 사라지기 시작한다.
// 그래서 스플래시가 사라지는 순간 바로 완성된 화면이 보이고, 그 사이에 흰 화면/로딩
// 상태가 노출되지 않는다.
function SplashScreen() {
  const { ready } = useAppReady();
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);
  const [forceReady, setForceReady] = useState(false);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    const minTimer = setTimeout(() => setMinTimeElapsed(true), MIN_VISIBLE_MS);
    const safetyTimer = setTimeout(() => setForceReady(true), MAX_WAIT_MS);
    return () => {
      clearTimeout(minTimer);
      clearTimeout(safetyTimer);
    };
  }, []);

  // 최소 노출 시간이 지났고, 실제 화면이 준비됐을 때(또는 안전장치가 발동됐을 때)만 페이드 시작
  const isFading = minTimeElapsed && (ready || forceReady);

  useEffect(() => {
    if (!isFading) return;
    const goneTimer = setTimeout(() => setGone(true), FADE_MS);
    return () => clearTimeout(goneTimer);
  }, [isFading]);

  if (gone) return null;

  return (
    <div className={`splash-screen${isFading ? " splash-fade-out" : ""}`}>
      <span className="splash-name">OSORI</span>
    </div>
  );
}

export default SplashScreen;
