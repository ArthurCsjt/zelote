import path from "path"
import react from "@vitejs/plugin-react-swc" // Mantive o seu plugin -swc
import { defineConfig } from "vite"
import basicSsl from '@vitejs/plugin-basic-ssl' // Importamos o plugin SSL

export default defineConfig({
  plugins: [
    react(),
    basicSsl() // Adicionamos o plugin aqui
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ['react', 'react-dom'],
  },
  server: {
    host: true, // Permite acesso pela rede
    https: true // Habilita o HTTPS
  }
})