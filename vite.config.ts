import path from "path"
import react from "@vitejs/plugin-react-swc"
import { defineConfig } from "vite"
import basicSsl from '@vitejs/plugin-basic-ssl'

export default defineConfig({
  plugins: [
    react(),
    basicSsl()
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ['react', 'react-dom'],
  },
  server: {
    host: true,   // Permite acesso pela rede
    https: true,  // <-- CORREÇÃO: Ativa o HTTPS para o servidor de desenvolvimento
  }
})