import { useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';

export function useTheme() {
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add('light');
  }, []);

  const setThemeValue = (_newTheme: Theme) => {
    try {
      localStorage.setItem('theme', 'light');
    } catch {}
    setTheme('light');
  };

  return {
    theme: 'light' as Theme,
    setTheme: setThemeValue,
  };
}