import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon-32.png", "apple-touch-icon.png"],
      manifest: {
        name: "OSORI - 오늘의 소비 리포트",
        short_name: "OSORI",
        description: "AI 재무 코칭 가계부 - 넛지 기반으로 소비 습관을 코칭해드립니다",
        theme_color: "#0066ff",
        background_color: "#ffffff",
        display: "standalone",
        start_url: "/",
        scope: "/",
        icons: [
          { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
          {
            src: "/icons/maskable-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        // 재무 데이터는 항상 최신 상태여야 하므로 API 응답은 절대 캐시하지 않고
        // 매번 네트워크로만 요청한다 (오래된 잔액/코칭 데이터 노출 방지).
        runtimeCaching: [
          {
            urlPattern: ({ url }) =>
              url.pathname.startsWith("/fincoach") ||
              url.origin === "https://fincoach-api-production.up.railway.app",
            handler: "NetworkOnly",
          },
        ],
      },
    }),
  ],
  define: {
    global: "window",
  },
  server: {
    proxy: {
      "/fincoach": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
    },
  },
});

