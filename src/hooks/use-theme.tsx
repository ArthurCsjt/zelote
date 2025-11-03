import { useEffect, useState, useCallback } from 'react';

type Theme = 'light'; // Simplificado para apenas 'light'

const STORAGE_KEY = 'vite-ui-theme';

export function useTheme() {
  const theme: Theme = 'light'; // Força o tema para light

  const applyTheme = useCallback(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add('light');
    return 'light';
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Aplica o tema light imediatamente
    applyTheme();

    // Remove qualquer classe 'dark' que possa ter sido definida
    window.document.documentElement.classList.remove('dark');
    
  }, [applyTheme]);

  // A função setTheme agora é um mock que não faz nada, mas mantém a interface
  const setTheme = useCallback((newTheme: Theme) => {
    console.warn(`Dark Mode desabilitado. Tentativa de definir tema para: ${newTheme}`);
  }, []);

  // Retorna o tema atual (light) e a função mock
  return {
    theme,
    setTheme,
  };
}