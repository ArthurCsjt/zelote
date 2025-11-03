import { useState, useEffect } from 'react';

// Detector de tema do sistema
export function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches 
    ? 'dark' 
    : 'light';
}

// Inicializar tema na montagem do app
export function initTheme() {
  const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
  const theme = savedTheme || getSystemTheme();
  
  // Adiciona a classe 'no-transition' temporariamente para evitar flash de transição no load
  document.documentElement.classList.add('no-transition');
  document.documentElement.classList.add(theme);
  
  // Remove a classe 'no-transition' após um pequeno timeout
  setTimeout(() => {
    document.documentElement.classList.remove('no-transition');
  }, 10);
}

// Hook React para tema
export function useTheme() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return localStorage.getItem('theme') as 'light' | 'dark' || getSystemTheme();
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggle = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  return { theme, setTheme, toggle };
}