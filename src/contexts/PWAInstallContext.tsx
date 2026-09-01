import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import logger from '@/utils/logger';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

// Armazena no window para não perder caso o evento dispare antes do React montar
declare global {
  interface Window {
    __pwaDeferredPrompt?: BeforeInstallPromptEvent | null;
  }
}

interface PWAInstallContextType {
  deferredPrompt: BeforeInstallPromptEvent | null;
  isInstallable: boolean;
  isInstalled: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  isMobile: boolean;
  promptInstall: () => Promise<'accepted' | 'dismissed' | 'manual'>;
  isGuideOpen: boolean;
  setIsGuideOpen: (open: boolean) => void;
  openInstallGuide: () => void;
  closeInstallGuide: () => void;
}

const PWAInstallContext = createContext<PWAInstallContextType | undefined>(undefined);

export const PWAInstallProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(
    () => window.__pwaDeferredPrompt || null
  );
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [isGuideOpen, setIsGuideOpen] = useState<boolean>(false);

  // Detecção de plataforma
  const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream;
  const isAndroid = /Android/i.test(userAgent);
  const isMobile = isIOS || isAndroid || /Mobi|Tablet|iPad/i.test(userAgent);

  // Checa se está rodando em modo standalone (PWA instalado)
  const checkIsInstalled = useCallback(() => {
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://');
    setIsInstalled(isStandalone);
    return isStandalone;
  }, []);

  useEffect(() => {
    checkIsInstalled();

    const handleBeforeInstallPrompt = (e: Event) => {
      // Previne que o mini-infobar padrão do Chrome apareça sem controle
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      window.__pwaDeferredPrompt = promptEvent;
      setDeferredPrompt(promptEvent);
      logger.info('PWA: Evento beforeinstallprompt capturado com sucesso.');
    };

    const handleAppInstalled = () => {
      logger.info('PWA: Aplicativo foi instalado pelo usuário.');
      setIsInstalled(true);
      setDeferredPrompt(null);
      window.__pwaDeferredPrompt = null;
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleMediaChange = () => checkIsInstalled();
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleMediaChange);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleMediaChange);
      }
    };
  }, [checkIsInstalled]);

  const promptInstall = useCallback(async (): Promise<'accepted' | 'dismissed' | 'manual'> => {
    const promptEvent = deferredPrompt || window.__pwaDeferredPrompt;

    if (promptEvent) {
      try {
        await promptEvent.prompt();
        const choice = await promptEvent.userChoice;
        logger.info(`PWA: Escolha do usuário na instalação: ${choice.outcome}`);
        if (choice.outcome === 'accepted') {
          setIsInstalled(true);
        }
        setDeferredPrompt(null);
        window.__pwaDeferredPrompt = null;
        return choice.outcome;
      } catch (err) {
        logger.error('PWA: Erro ao executar prompt de instalação:', err);
        setIsGuideOpen(true);
        return 'manual';
      }
    } else {
      // Não há prompt nativo disponível (iOS, Safari ou navegador que não suporta/já disparou)
      setIsGuideOpen(true);
      return 'manual';
    }
  }, [deferredPrompt]);

  const openInstallGuide = useCallback(() => setIsGuideOpen(true), []);
  const closeInstallGuide = useCallback(() => setIsGuideOpen(false), []);

  const isInstallable = !isInstalled && (!!deferredPrompt || isIOS || isAndroid);

  return (
    <PWAInstallContext.Provider
      value={{
        deferredPrompt,
        isInstallable,
        isInstalled,
        isIOS,
        isAndroid,
        isMobile,
        promptInstall,
        isGuideOpen,
        setIsGuideOpen,
        openInstallGuide,
        closeInstallGuide,
      }}
    >
      {children}
    </PWAInstallContext.Provider>
  );
};

export const usePWAInstall = () => {
  const context = useContext(PWAInstallContext);
  if (!context) {
    throw new Error('usePWAInstall deve ser usado dentro de um PWAInstallProvider');
  }
  return context;
};
