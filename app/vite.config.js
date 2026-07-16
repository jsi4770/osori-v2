import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
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

