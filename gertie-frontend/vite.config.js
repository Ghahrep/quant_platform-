import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/test/setup.js",
  },
  // ADD THIS 'server' BLOCK
  server: {
    proxy: {
      // This rule says that any request starting with '/api'
      // will be sent to your backend server at http://127.0.0.1:8000
      "/api": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
      },
    },
  },
});
