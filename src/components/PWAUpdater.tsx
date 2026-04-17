import React, { useEffect, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { toast } from 'sonner';
import { RefreshCw, Download, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import logger from '@/utils/logger';

export const PWAUpdater: React.FC = () => {
  const [lastCheck, setLastCheck] = useState<number>(Date.now());

  // Intervalo de verificação: 1 minuto (reduzido para refletir atualizações mais rápido)
  const CHECK_INTERVAL = 1 * 60 * 1000;

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      if (r) {
        // Tenta registrar uma verificação periódica
        logger.info('Service Worker registrado com sucesso');
        
        // Verifica a cada X minutos
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

  useEffect(() => {
    if (needRefresh) {
      logger.info('Nova atualização detectada! Mostrando notificação profissional.');
      
      const toastId = toast.custom((t) => (
        <div className={cn(
          "bg-white dark:bg-zinc-950 border-4 border-black dark:border-white p-5 shadow-[8px_8px_0px_0px_rgba(59,130,246,1)]",
          "flex flex-col gap-4 min-w-[320px] transform transition-all animate-in fade-in slide-in-from-top-4 duration-500"
        )}>
          <div className="flex items-start gap-4">
            <div className="bg-primary p-2 border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
              <RefreshCw className="h-6 w-6 text-white animate-spin-slow" />
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
              onClick={() => {
                logger.info('Usuário iniciou atualização do sistema.');
                updateServiceWorker(true);
              }}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-black text-white dark:bg-white dark:text-black",
                "font-black uppercase italic tracking-wider text-[11px] border-2 border-black dark:border-white",
                "shadow-[4px_4px_0px_0px_rgba(59,130,246,0.5)] transform hover:-translate-x-1 hover:-translate-y-1 transition-all"
              )}
            >
              <Download className="h-4 w-4" />
              Atualizar Agora
            </button>
            <button
              onClick={() => {
                setNeedRefresh(false);
                toast.dismiss(t);
              }}
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
        duration: Infinity, // Fica visível até que o usuário decida
        position: 'top-center'
      });
    }
  }, [needRefresh, updateServiceWorker, setNeedRefresh]);

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
