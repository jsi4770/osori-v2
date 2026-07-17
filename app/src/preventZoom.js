// iOS Safari(일반 브라우저)는 viewport의 user-scalable=no / maximum-scale를 접근성 이유로 무시한다.
// 그래서 이 브라우저에서만 핀치/더블탭 줌을 JS로 직접 차단한다.
// (Android Chrome/Naver/삼성인터넷, iOS PWA·WKWebView는 viewport 메타로 이미 차단됨)
// 멀티터치(2손가락) 제스처만 선별 차단하므로 일반 스크롤·탭·스와이프에는 영향이 없다.
export function preventZoom() {
  // 핀치 줌: iOS Safari 전용 gesture 이벤트
  const blockGesture = (e) => e.preventDefault();
  document.addEventListener("gesturestart", blockGesture);
  document.addEventListener("gesturechange", blockGesture);
  document.addEventListener("gestureend", blockGesture);

  // 손가락 2개 이상의 이동(핀치)만 차단 → 한 손가락 스크롤은 그대로 동작
  document.addEventListener(
    "touchmove",
    (e) => {
      if (e.touches.length > 1) e.preventDefault();
    },
    { passive: false }
  );

  // 더블탭 확대 방지 (touch-action: manipulation 보강)
  let lastTouchEnd = 0;
  document.addEventListener(
    "touchend",
    (e) => {
      const now = Date.now();
      if (now - lastTouchEnd <= 300) e.preventDefault();
      lastTouchEnd = now;
    },
    { passive: false }
  );
}
