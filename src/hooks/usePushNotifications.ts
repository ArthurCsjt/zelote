import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

const VAPID_PUBLIC_KEY = 'BPWP4M3KCL2LE_EhUfeIJ5IuGT7POZc05UrI1LRGX29JLprCE7tSfHiklrwsucrAUUB6Eh2wEf5MrkIKyc8CYxw';

// Função utilitária para converter a chave VAPID base64 para Uint8Array
function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export function usePushNotifications() {
    const { user } = useAuth();
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [loading, setLoading] = useState(true);
    const [subscription, setSubscription] = useState<PushSubscription | null>(null);

    // Verifica o status da inscrição atual
    const checkSubscription = useCallback(async () => {
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
            setLoading(false);
            return;
        }

        try {
            const registration = await navigator.serviceWorker.ready;
            const sub = await registration.pushManager.getSubscription();

            if (sub) {
                setSubscription(sub);
                setIsSubscribed(true);

                // Sincroniza com o Supabase para garantir que está lá
                if (user) {
                    await saveSubscriptionToDb(sub);
                }
            } else {
                setIsSubscribed(false);
                setSubscription(null);
            }
        } catch (error) {
            console.error('Erro ao verificar inscrição push:', error);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        checkSubscription();
    }, [checkSubscription]);

    const saveSubscriptionToDb = async (sub: PushSubscription) => {
        if (!user) return;

        // Serializa o objeto
        const subJson = sub.toJSON();

        if (!subJson.keys || !subJson.endpoint) return;

        // Salva ou atualiza no Supabase
        // Usamos upsert baseado no endpoint que é unique
        const { error } = await supabase
            .from('push_subscriptions')
            .upsert({
                user_id: user.id,
                endpoint: subJson.endpoint,
                p256dh: subJson.keys.p256dh,
                auth: subJson.keys.auth,
            }, { onConflict: 'endpoint' });

        if (error) {
            console.error('Erro ao salvar inscrição no DB:', error);
        }
    };

    const subscribeToPush = async () => {
        if (!('serviceWorker' in navigator)) {
            toast({ title: "Incompatível", description: "Seu navegador não suporta notificações push.", variant: "destructive" });
            return;
        }

        try {
            const registration = await navigator.serviceWorker.ready;

            const sub = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
            });

            setSubscription(sub);
            setIsSubscribed(true);

            if (user) {
                await saveSubscriptionToDb(sub);
            }

            toast({
                title: "Notificações Ativadas",
                description: "Você receberá alertas mesmo com o app fechado.",
                variant: "success"
            });

        } catch (error: any) {
            console.error('Erro ao se inscrever:', error);
            if (Notification.permission === 'denied') {
                toast({
                    title: "Permissão Negada",
                    description: "Você bloqueou as notificações. Ative-as nas configurações do navegador.",
                    variant: "destructive"
                });
            } else {
                toast({ title: "Erro", description: "Falha ao ativar notificações.", variant: "destructive" });
            }
        }
    };

    const unsubscribeFromPush = async () => {
        if (!subscription) return;

        try {
            await subscription.unsubscribe();

            // Remove do DB
            const { error } = await supabase
                .from('push_subscriptions')
                .delete()
                .eq('endpoint', subscription.endpoint);

            if (error) throw error;

            setIsSubscribed(false);
            setSubscription(null);
            toast({ title: "Notificações Desativadas", description: "Você não receberá mais alertas.", variant: "info" });
        } catch (error) {
            console.error('Erro ao cancelar inscrição:', error);
            toast({ title: "Erro", description: "Falha ao desativar notificações.", variant: "destructive" });
        }
    };

    return {
        isSubscribed,
        loading,
        subscribeToPush,
        unsubscribeFromPush,
        permission: Notification.permission
    };
}
