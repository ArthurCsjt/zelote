import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'


import logger from '@/utils/logger';

// Ensure React is available globally
// Expose React for devtools in iframe
window.React = React;

// Registro do Service Worker para PWA e Notificações Push
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => {
        logger.info('ServiceWorker registrado com sucesso:', { scope: registration.scope });
      })
      .catch(error => {
        logger.error('Falha ao registrar ServiceWorker:', error);
      });
  });
}

const rootElement = document.getElementById("root");

if (!rootElement) {
  logger.error('Fatal Error: Root element not found');
} else {
  try {
    createRoot(rootElement).render(
      <App />
    );
  } catch (error) {
    logger.error('Fatal Error: Failed to mount application', error);
  }
}