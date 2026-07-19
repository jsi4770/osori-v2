import "./DesktopFrame.css";

// 노트북 등 넓은 화면에서 열었을 때, 실제 폰 화면 크기의 iframe 안에 앱을 그대로 띄운다.
// (매체쿼리는 iframe 자신의 좁은 폭을 기준으로 다시 평가되므로, 앱 내부의 모바일 전용
//  반응형 레이아웃이 실제 폰에서 보는 것과 동일하게 적용된다.)
function DesktopFrame() {
  return (
    <div className="desktop-frame-backdrop">
      <div className="desktop-frame-phone">
        <iframe
          className="desktop-frame-iframe"
          src={window.location.href}
          title="OSORI"
        />
      </div>
    </div>
  );
}

export default DesktopFrame;
