import { useState, useEffect, useCallback } from 'react';
import logger from '@/utils/logger';

export function usePWAUpdate() {
    const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
    const [updateAvailable, setUpdateAvailable] = useState(false);

    const onUpdate = useCallback((registration: ServiceWorkerRegistration) => {
        setWaitingWorker(registration.waiting);
        setUpdateAvailable(true);
    }, []);

    useEffect(() => {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/service-worker.js').then((registration) => {
                logger.info('ServiceWorker registrado:', { scope: registration.scope });

                // 1. Verificar se já existe um worker esperando
                if (registration.waiting) {
                    onUpdate(registration);
                }

                // 2. Ouvir por novos workers que chegam
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    if (newWorker) {
                        newWorker.addEventListener('statechange', () => {
                            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                onUpdate(registration);
                            }
                        });
                    }
                });
            }).catch((error) => {
                logger.error('Erro ao registrar ServiceWorker:', error);
            });

            // 3. Ouvir por mensagens do SW (opcional, mas bom ter)
            let refreshing = false;
            navigator.serviceWorker.addEventListener('controllerchange', () => {
                if (refreshing) return;
                refreshing = true;
                window.location.reload();
            });
        }
    }, [onUpdate]);

    const applyUpdate = () => {
        if (waitingWorker) {
            waitingWorker.postMessage({ type: 'SKIP_WAITING' });
        }
    };

    return { updateAvailable, applyUpdate };
}
