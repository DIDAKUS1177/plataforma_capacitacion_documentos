import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwind from "@tailwindcss/postcss";

export default defineConfig({
  plugins: [react()],
  css: { postcss: { plugins: [tailwind()] } },
  server: {
    port: 5175,
    // En desarrollo, `wrangler pages dev` levanta las funciones en el 8788.
    // Así `npm run dev` solo no se queda sin backend.
    proxy: {
      "/api": { target: "http://127.0.0.1:8788", changeOrigin: true },
    },
  },
  build: { outDir: "dist", sourcemap: false },
});
