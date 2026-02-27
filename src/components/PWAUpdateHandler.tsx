import { useEffect } from 'react';
import { usePWAUpdate } from '@/hooks/use-pwa-update';
import { toast } from 'sonner';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const PWAUpdateHandler = () => {
    const { updateAvailable, applyUpdate } = usePWAUpdate();

    useEffect(() => {
        if (updateAvailable) {
            toast("Nova versão disponível!", {
                description: "Uma atualização está pronta para ser instalada. Deseja atualizar agora?",
                duration: Infinity,
                action: (
                    <Button
                        size="sm"
                        onClick={() => applyUpdate()}
                        className="bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Atualizar
                    </Button>
                ),
            });
        }
    }, [updateAvailable, applyUpdate]);

    return null;
};
