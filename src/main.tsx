import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'


import logger from '@/utils/logger';

// Ensure React is available globally
// Expose React for devtools in iframe
window.React = React;

// Código para forçar a remoção de Service Workers antigos que estejam bloqueando o dev server
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (let registration of registrations) {
      registration.unregister();
    }
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