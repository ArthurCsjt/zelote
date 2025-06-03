
import { useState, useEffect, useMemo } from "react";

export function useMobile() {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Função otimizada para detectar mudanças de tamanho
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    // Throttle para otimizar performance
    let timeoutId: NodeJS.Timeout;
    const throttledResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(handleResize, 100);
    };

    // Set initial size e marcar como ready
    handleResize();
    setIsReady(true);

    window.addEventListener("resize", throttledResize);
    return () => {
      window.removeEventListener("resize", throttledResize);
      clearTimeout(timeoutId);
    };
  }, []);

  // Memoizar o resultado para evitar re-renders desnecessários
  const isMobile = useMemo(() => {
    return windowSize.width < 768;
  }, [windowSize.width]);

  return { isMobile, isReady, windowSize };
}
