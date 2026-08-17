import React, { useEffect, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { toast } from 'sonner';
import { RefreshCw, Download, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import logger from '@/utils/logger';

export const PWAUpdater: React.FC = () => {
  const [lastCheck, setLastCheck] = useState<number>(Date.now());
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  // Intervalo de verificação: 5 minutos
  const CHECK_INTERVAL = 5 * 60 * 1000;

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      if (r) {
        logger.info('Service Worker registrado com sucesso');
        setInterval(() => {
          logger.info('Verificando atualizações do sistema...');
          r.update();
          setLastCheck(Date.now());
        }, CHECK_INTERVAL);
      }
    },
    onRegisterError(error) {
      logger.error('Erro ao registrar Service Worker:', error);
    },
  });

  // Listener para reload automático quando o novo ServiceWorker assume o controle
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      let refreshing = false;
      const handleControllerChange = () => {
        if (!refreshing) {
          refreshing = true;
          logger.info('Novo Service Worker ativado: recarregando a página.');
          window.location.reload();
        }
      };
      navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);
      return () => {
        navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
      };
    }
  }, []);

  const handleUpdate = async (toastId?: string | number) => {
    if (isUpdating) return;
    setIsUpdating(true);
    if (toastId) toast.dismiss(toastId);
    
    logger.info('Iniciando atualização do sistema...');
    try {
      await updateServiceWorker(true);
    } catch (err) {
      logger.error('Erro ao atualizar Service Worker:', err);
    }
    
    // Forçar recarga limpa da página se o controllerchange não recarregar em 500ms
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  useEffect(() => {
    if (needRefresh) {
      const isPWA = window.matchMedia('(display-mode: standalone)').matches || 
                    (window.navigator as any).standalone || 
                    document.referrer.includes('android-app://');

      if (!isPWA) {
        logger.info('Web detectado: Atualizando automaticamente para a versão mais recente.');
        handleUpdate();
        return;
      }

      logger.info('PWA detectado: Mostrando notificação de atualização.');
      
      toast.custom((t) => (
        <div className={cn(
          "bg-white dark:bg-zinc-950 border-4 border-black dark:border-white p-5 shadow-[8px_8px_0px_0px_rgba(59,130,246,1)]",
          "flex flex-col gap-4 min-w-[320px] transform transition-all animate-in fade-in slide-in-from-top-4 duration-500"
        )}>
          <div className="flex items-start gap-4">
            <div className="bg-primary p-2 border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
              <RefreshCw className="h-6 w-6 text-white animate-spin" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-black uppercase tracking-tighter leading-none mb-1">
                Nova Versão Disponível
              </h3>
              <p className="text-xs font-bold text-muted-foreground uppercase opacity-80">
                Uma atualização crítica do sistema está pronta para ser instalada.
              </p>
            </div>
            <button 
              onClick={() => toast.dismiss(t)} 
              className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => handleUpdate(t)}
              disabled={isUpdating}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-black text-white dark:bg-white dark:text-black",
                "font-black uppercase italic tracking-wider text-[11px] border-2 border-black dark:border-white",
                "shadow-[4px_4px_0px_0px_rgba(59,130,246,0.5)] transform hover:-translate-x-1 hover:-translate-y-1 transition-all",
                "disabled:opacity-50 cursor-pointer"
              )}
            >
              <Download className={cn("h-4 w-4", isUpdating && "animate-bounce")} />
              {isUpdating ? "REINICIANDO..." : "Atualizar Agora"}
            </button>
            <button
              onClick={() => {
                setNeedRefresh(false);
                toast.dismiss(t);
              }}
              disabled={isUpdating}
              className={cn(
                "px-4 py-3 bg-white dark:bg-zinc-900 text-black dark:text-white",
                "font-black uppercase text-[10px] border-2 border-black dark:border-white",
                "hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              )}
            >
              Depois
            </button>
          </div>
          <div className="text-[8px] font-black uppercase text-muted-foreground opacity-40 text-center tracking-[0.2em] mt-2">
            Zelote Core Engine v{new Date().toISOString().split('T')[0].replace(/-/g, '.')}
          </div>
        </div>
      ), {
        duration: Infinity,
        position: 'top-center'
      });
    }
  }, [needRefresh, setNeedRefresh]);

  // Verificar atualizações ao focar a aba/app
  useEffect(() => {
    const handleFocus = () => {
      // Se passou mais de 1 minuto desde a última verificação, verifica novamente ao focar
      if (Date.now() - lastCheck > 60000) {
        navigator.serviceWorker.getRegistration().then(registration => {
          if (registration) {
            logger.info('Aba focada. Verificando atualizações...');
            registration.update();
            setLastCheck(Date.now());
          }
        });
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [lastCheck]);

  return null;
};
