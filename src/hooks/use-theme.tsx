import { useEffect, useState, useCallback } from 'react';

type Theme = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'vite-ui-theme';

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === 'undefined') return 'light';
    try {
      return (localStorage.getItem(STORAGE_KEY) as Theme) || 'system';
    } catch {
      return 'system';
    }
  });

  const applyTheme = useCallback((theme: Theme) => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
      return systemTheme;
    }

    root.classList.add(theme);
    return theme;
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // 1. Aplica o tema inicial
    applyTheme(theme);

    // 2. Listener para mudanças no tema do sistema (se o tema for 'system')
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemChange = () => {
      if (theme === 'system') {
        applyTheme('system');
      }
    };
    mediaQuery.addEventListener('change', handleSystemChange);

    return () => mediaQuery.removeEventListener('change', handleSystemChange);
  }, [theme, applyTheme]);

  const setTheme = useCallback((newTheme: Theme) => {
    try {
      localStorage.setItem(STORAGE_KEY, newTheme);
    } catch {}
    setThemeState(newTheme);
    applyTheme(newTheme);
  }, [applyTheme]);

  // Retorna o tema atual (que pode ser 'light', 'dark' ou 'system')
  // E a função para alterá-lo
  return {
    theme,
    setTheme,
  };
}