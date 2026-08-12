import { useRegisterSW } from 'virtual:pwa-register/react';
import { DownloadCloud, X } from 'lucide-react';
import { Button } from './ui/button';
import { useEffect } from 'react';

export function PwaUpdatePrompt() {
    // O hook useRegisterSW gerencia automaticamente o registro e a detecção de mudanças
    const {
        needRefresh: [needRefresh, setNeedRefresh],
        updateServiceWorker,
    } = useRegisterSW({
        onRegistered(r) {
            console.log('PWA: Service Worker registrado com sucesso');
            if (r) {
                // Verificação imediata ao registrar
                r.update();

                // Polling agressivo a cada 2 minutos para garantir detecção
                setInterval(() => {
                    console.log('PWA: Verificando por novas atualizações (auto)...');
                    r.update();
                }, 120 * 1000);
            }
        },
        onRegisterError(error) {
            console.error('PWA: Erro no registro do Service Worker', error);
        },
    });

    const handleUpdate = () => {
        console.log('PWA: Acionando atualização do Service Worker...');
        updateServiceWorker(true);
    };

    const closePrompt = () => {
        setNeedRefresh(false);
    };

    // Log para depuração em desenvolvimento
    useEffect(() => {
        if (needRefresh) {
            console.log('PWA: Nova versão detectada, exibindo prompt de atualização');
        }
    }, [needRefresh]);

    if (!needRefresh) return null;

    return (
        <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 z-[100] animate-in slide-in-from-bottom-5 fade-in duration-500">
            <div className="w-full sm:w-[400px] bg-card p-5 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-border dark:border-white/10 dark:bg-zinc-900 flex flex-col gap-4 relative overflow-hidden ring-1 ring-black/5">

                {/* Efeito sutil de background premium */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-[40px] -z-10 pointer-events-none" />

                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-primary/10 dark:bg-primary/20 p-2.5 rounded-xl text-primary">
                            <DownloadCloud className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-bold text-foreground text-base tracking-tight">
                                Atualização Disponível
                            </h3>
                            <p className="text-sm text-muted-foreground mt-0.5 leading-snug">
                                Uma nova versão do Zelote está pronta com melhorias e correções.
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={closePrompt}
                        className="text-muted-foreground hover:text-foreground transition-all p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5"
                        aria-label="Fechar dispositivo"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <div className="flex gap-3 justify-end items-center mt-1">
                    <Button
                        variant="ghost"
                        onClick={closePrompt}
                        className="text-xs font-medium h-9 px-4 hover:bg-muted"
                    >
                        Mais tarde
                    </Button>
                    <Button
                        onClick={handleUpdate}
                        className="text-xs font-bold h-9 px-5 bg-primary hover:opacity-90 text-primary-foreground shadow-sm transition-all active:scale-95"
                    >
                        Atualizar agora
                    </Button>
                </div>
            </div>
        </div>
    );
}
