import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { toast as sonnerToast } from 'sonner' // Usando Sonner
import { ToastAction } from "@/components/ui/toast" // Mantendo o import para o ToastAction se necessário, mas vamos usar o Sonner
import logger from '@/utils/logger';

// Ensure React is available globally
// Expose React for devtools in iframe
window.React = React;

function setupServiceWorkerUpdates() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/service-worker.js')
        .then((registration) => {
          const promptUpdate = () => {
            // Usando sonnerToast para o prompt de atualização
            sonnerToast.info('Atualização disponível', {
              description: 'Reinicie para aplicar a nova versão.',
              action: {
                label: 'Reiniciar agora',
                onClick: () => {
                  const waiting = registration.waiting;
                  if (waiting) waiting.postMessage({ type: 'SKIP_WAITING' });
                },
              },
              duration: 1000000, // Manter visível até o clique
            });

            let refreshing = false
            navigator.serviceWorker.addEventListener('controllerchange', () => {
              if (refreshing) return
              refreshing = true
              window.location.reload()
            })
          }

          // If there's an already waiting SW, prompt immediately
          if (registration.waiting) {
            promptUpdate()
          }

          // Listen for new updates found
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing
            if (!newWorker) return
            newWorker.addEventListener('statechange', () => {
              if (
                newWorker.state === 'installed' &&
                navigator.serviceWorker.controller
              ) {
                promptUpdate()
              }
            })
          })
        })
        .catch((err) => {
          logger.error('SW registration failed', err);
        })
    })
  }
}

createRoot(document.getElementById("root")!).render(
  // REMOVENDO React.StrictMode para evitar duplicação de efeitos em desenvolvimento
  <App />
)

setupServiceWorkerUpdates()