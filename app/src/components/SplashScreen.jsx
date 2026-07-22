import { useEffect, useState } from "react";
import "./SplashScreen.css";

const BADGER = "/osori-badger.png";
const VISIBLE_MS = 900;
const FADE_MS = 300;

// 앱 첫 실행 시 잠깐 떴다가 사라지는 스플래시. 실제 앱 트리는 그 아래에서 이미 정상적으로
// 부팅되고 있고, 이 컴포넌트는 그 위를 잠깐 덮었다가 스스로 사라지기만 하므로 다른 기능(인증,
// 라우팅, 데이터 로딩)에는 전혀 영향을 주지 않는다.
function SplashScreen() {
  const [phase, setPhase] = useState("visible"); // visible -> fading -> gone

  useEffect(() => {
    const fadeTimer = setTimeout(() => setPhase("fading"), VISIBLE_MS);
    const goneTimer = setTimeout(() => setPhase("gone"), VISIBLE_MS + FADE_MS);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(goneTimer);
    };
  }, []);

  if (phase === "gone") return null;

  return (
    <div className={`splash-screen${phase === "fading" ? " splash-fade-out" : ""}`}>
      <img src={BADGER} alt="OSORI" className="splash-logo" />
      <span className="splash-name">OSORI</span>
    </div>
  );
}

export default SplashScreen;
