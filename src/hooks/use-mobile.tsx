
import { useState, useEffect } from 'react';

const MOBILE_BREAKPOINT = 768;

export function useMobile() {
  const [isMobile, setIsMobile] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      try {
        const userAgent = typeof window !== 'undefined' ? window.navigator.userAgent : '';
        const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
        const isMobileUA = mobileRegex.test(userAgent);
        const isMobileWidth = typeof window !== 'undefined' ? window.innerWidth < MOBILE_BREAKPOINT : false;
        
        setIsMobile(isMobileUA || isMobileWidth);
        setIsReady(true);
      } catch (error) {
        console.error('Erro ao detectar dispositivo móvel:', error);
        // Em caso de erro, assumir desktop
        setIsMobile(false);
        setIsReady(true);
      }
    };

    // Verificar imediatamente
    checkMobile();

    // Adicionar listener para mudanças de tamanho
    const handleResize = () => {
      try {
        const isMobileWidth = window.innerWidth < MOBILE_BREAKPOINT;
        const userAgent = window.navigator.userAgent;
        const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
        const isMobileUA = mobileRegex.test(userAgent);
        
        setIsMobile(isMobileUA || isMobileWidth);
      } catch (error) {
        console.error('Erro no resize:', error);
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  return { isMobile, isReady };
}
