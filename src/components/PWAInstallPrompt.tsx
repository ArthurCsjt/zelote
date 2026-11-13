import React, { useState, useEffect } from 'react';
import { usePWAInstall } from '@/contexts/PWAInstallContext';
import { Button } from '@/components/ui/button';
import { Smartphone, Download, X, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

const STORAGE_KEY = 'zelote_pwa_prompt_dismissed_until';

export const PWAInstallPrompt: React.FC = () => {
  const { isInstalled, isMobile, promptInstall } = usePWAInstall();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Se já estiver instalado em modo app, nunca exibe o banner
    if (isInstalled) {
      setIsVisible(false);
      return;
    }

    // Checa se o usuário pediu para ocultar temporariamente
    const dismissedUntil = localStorage.getItem(STORAGE_KEY);
    if (dismissedUntil && Number(dismissedUntil) > Date.now()) {
      setIsVisible(false);
      return;
    }

    // Mostra após 2 segundos de carregamento da página no celular/navegador
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, [isInstalled]);

  const handleDismiss = (days: number = 3) => {
    setIsVisible(false);
    const expireTime = Date.now() + days * 24 * 60 * 60 * 1000;
    localStorage.setItem(STORAGE_KEY, expireTime.toString());
  };

  const handleInstall = async () => {
    await promptInstall();
  };

  if (!isVisible || isInstalled) return null;

  return (
    <aside
      aria-label="Instalação do Aplicativo Zelote"
      className={cn(
        "fixed bottom-3 left-3 right-3 md:left-auto md:right-5 md:max-w-[340px] z-40",
        "bg-white dark:bg-zinc-950 border-2 sm:border-[2.5px] border-black dark:border-white",
        "shadow-[4px_4px_0px_0px_#000] dark:shadow-[4px_4px_0px_0px_#fff]",
        "p-3 transition-all duration-300 animate-in slide-in-from-bottom-3 fade-in"
      )}
    >
      <div className="flex items-start justify-between gap-2.5">
        <div className="flex items-start gap-2.5 min-w-0">
          <div className="p-1.5 bg-blue-500 border border-black dark:border-white shadow-[1.5px_1.5px_0px_0px_#000] shrink-0 mt-0.5">
            <Smartphone className="h-4 w-4 text-white" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
              <span className="text-[9px] font-black uppercase px-1 py-0.2 bg-amber-400 text-black border border-black leading-none">
                App Disponível
              </span>
              <span className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-0.5 leading-none">
                <Sparkles className="h-2.5 w-2.5 text-amber-500" /> Acesso Rápido
              </span>
            </div>
            <h3 className="text-xs font-black uppercase tracking-tight text-zinc-900 dark:text-zinc-100 truncate">
              {isMobile ? "Instale no seu Celular" : "Instale o App Zelote"}
            </h3>
            <p className="text-[11px] text-zinc-600 dark:text-zinc-400 mt-0.5 leading-snug">
              Acesso direto pela tela inicial e notificações.
            </p>
          </div>
        </div>

        <button
          onClick={() => handleDismiss(3)}
          className="p-1 text-zinc-400 hover:text-black dark:hover:text-white transition-colors shrink-0 -mr-1 -mt-1"
          title="Fechar"
          aria-label="Fechar notificação de instalação"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="mt-2.5 flex items-center justify-end gap-1.5 pt-2 border-t border-zinc-200 dark:border-zinc-800">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleDismiss(5)}
          className="text-[10px] font-bold uppercase text-zinc-500 hover:text-zinc-900 dark:hover:text-white h-7 px-2.5"
        >
          Agora Não
        </Button>
        <Button
          size="sm"
          onClick={handleInstall}
          className="neo-btn bg-blue-600 hover:bg-blue-700 text-white font-black uppercase text-[10px] h-7 px-3 shadow-[2px_2px_0px_0px_#000]"
        >
          <Download className="h-3 w-3 mr-1" />
          Instalar
        </Button>
      </div>
    </aside>
  );
};
