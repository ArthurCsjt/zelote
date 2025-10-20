import { useState, useEffect } from 'react';

const DESKTOP_BREAKPOINT = 768;

export function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const checkIsDesktop = () => {
      setIsDesktop(window.innerWidth >= DESKTOP_BREAKPOINT);
    };

    // Verifica no mount
    checkIsDesktop();

    // Adiciona listener para redimensionamento
    window.addEventListener('resize', checkIsDesktop);

    // Cleanup
    return () => {
      window.removeEventListener('resize', checkIsDesktop);
    };
  }, []);

  return isDesktop;
}