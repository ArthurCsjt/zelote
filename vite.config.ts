import path from "path"
import react from "@vitejs/plugin-react-swc"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ['react', 'react-dom'],
  },
  server: {
    host: true,   // Permite acesso pela rede
    // Removendo https: true
    hmr: {
      protocol: 'ws',
      host: 'localhost',
    }
  }
})