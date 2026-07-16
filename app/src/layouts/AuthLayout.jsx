import { Outlet } from "react-router-dom";

export default function AuthLayout() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#fff",
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        padding: "120px 16px 80px",
        boxSizing: "border-box",
        width: "100%",
      }}
    >
      <div style={{ width: 460, maxWidth: "100%" }}>
        <Outlet />
      </div>
    </div>
  );
}
