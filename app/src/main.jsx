import { StrictMode } from "react";
import React from "react"
import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import "./index.css";
import App from "./App.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { ThemeProvider } from "./context/ThemeContext.jsx";
import { preventZoom } from "./preventZoom";

registerSW({ immediate: true });

// iOS Safari 일반 브라우저에서도 핀치/더블탭 줌 차단
preventZoom();

createRoot(document.getElementById("root")).render(
  //<StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <App/>
      </AuthProvider>
    </ThemeProvider>
  //</StrictMode>
);

