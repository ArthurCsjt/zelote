import path from "path"
import react from "@vitejs/plugin-react-swc"
import { defineConfig } from "vite"
import { VitePWA } from "vite-plugin-pwa"

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      registerType: 'prompt',
      injectRegister: 'auto',
      manifest: {
        name: 'Zelote - Sistema de Controle de Empréstimos',
        short_name: 'Zelote',
        description: 'Sistema de controle de empréstimos e devoluções de Chromebooks',
        theme_color: '#0a84ff',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait-primary',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/icons/icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      },
      devOptions: {
        enabled: true,
        type: 'module',
      },
      injectManifest: {
        // Removendo injectionPoint: undefined para usar o padrão self.__WB_MANIFEST
      }
    })
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