import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { toast } from "@/components/ui/use-toast"
import { ToastAction } from "@/components/ui/toast"

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
            toast({
              title: 'Atualização disponível',
              description: 'Reinicie para aplicar a nova versão.',
              action: (
                <ToastAction
                  altText="Reiniciar agora"
                  onClick={() => {
                    const waiting = registration.waiting;
                    if (waiting) waiting.postMessage({ type: 'SKIP_WAITING' });
                  }}
                >
                  Reiniciar
                </ToastAction>
              ),
            })

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
          console.error('SW registration failed:', err)
        })
    })
  }
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)

setupServiceWorkerUpdates()

