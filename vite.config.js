import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    // Redireciona /master para o index.html (SPA routing)
    historyApiFallback: true,
  },
});
