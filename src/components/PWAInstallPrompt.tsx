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
        "fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:max-w-md z-40",
        "bg-white dark:bg-zinc-950 border-4 border-black dark:border-white",
        "shadow-[6px_6px_0px_0px_#000] dark:shadow-[6px_6px_0px_0px_#fff]",
        "p-4 transition-all duration-300 animate-in slide-in-from-bottom-5 fade-in"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="p-2.5 bg-blue-500 border-2 border-black dark:border-white shadow-[2px_2px_0px_0px_#000] shrink-0">
            <Smartphone className="h-6 w-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-[10px] font-black uppercase px-1.5 py-0.5 bg-amber-400 text-black border border-black">
                App Disponível
              </span>
              <span className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-amber-500" /> Acesso Rápido
              </span>
            </div>
            <h3 className="text-sm font-black uppercase tracking-tight text-zinc-900 dark:text-zinc-100">
              Instale o Zelote no seu Celular
            </h3>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5 leading-snug">
              Tenha acesso direto pela tela inicial, notificações e desempenho otimizado.
            </p>
          </div>
        </div>

        <button
          onClick={() => handleDismiss(3)}
          className="p-1 text-zinc-400 hover:text-black dark:hover:text-white transition-colors"
          title="Fechar"
          aria-label="Fechar notificação de instalação"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-3.5 flex items-center justify-end gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleDismiss(5)}
          className="text-xs font-bold uppercase text-zinc-500 hover:text-zinc-900 dark:hover:text-white h-8 px-3"
        >
          Agora Não
        </Button>
        <Button
          size="sm"
          onClick={handleInstall}
          className="neo-btn bg-blue-600 hover:bg-blue-700 text-white font-bold uppercase text-xs h-8 px-4"
        >
          <Download className="h-3.5 w-3.5 mr-1.5" />
          Baixar / Instalar
        </Button>
      </div>
    </aside>
  );
};
