import { supabase } from '@/integrations/supabase/client';
import logger from '@/utils/logger';

// Helper to trigger push notifications via Edge Function and Native Web Notification
export const triggerPushNotification = async (title: string, body: string, url: string = '/') => {
  // 1. Notificação nativa imediata no dispositivo se o usuário tiver permitido
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    try {
      if ('serviceWorker' in navigator) {
        const swPromise = navigator.serviceWorker.ready.then(reg => {
          if (reg && reg.showNotification) {
            return reg.showNotification(title, {
              body,
              icon: '/icons/icon.svg',
              badge: '/icons/icon.svg',
              vibrate: [100, 50, 100],
              data: { url },
              tag: `zelote-${Date.now()}`
            });
          }
        });

        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('SW timeout')), 1200)
        );

        try {
          await Promise.race([swPromise, timeoutPromise]);
        } catch {
          // Fallback para Notification API direta
          new Notification(title, {
            body,
            icon: '/icons/icon.svg',
            data: { url }
          });
        }
      } else {
        new Notification(title, {
          body,
          icon: '/icons/icon.svg',
          data: { url }
        });
      }
    } catch (localErr) {
      logger.warn('Falha silenciosa ao emitir notificação nativa:', localErr);
    }
  }

  // 2. Transmissão remota para todos os inscritos via Edge Function
  try {
    const { error } = await supabase.functions.invoke('send-push-notification', {
      body: {
        title,
        body,
        url,
        // No target_user_id means broadcast to all subscribers (admins/staff)
      }
    });

    if (error) {
      logger.warn('Aviso ao disparar push notification remota:', error);
    }
  } catch (err) {
    logger.warn('Falha silenciosa ao invocar função de push remoto:', err);
  }
};

export const getNotifications = async (userId: string): Promise<any[]> => {
  if (!userId) return [];
  try {
    const { data, error } = await supabase
      .from('notifications' as any)
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) throw error;
    return data || [];
  } catch (error: any) {
    logger.error('Erro ao buscar notificações:', error);
    return [];
  }
};

export const markNotificationAsRead = async (id: string, userId: string): Promise<boolean> => {
  if (!userId) return false;
  try {
    const { error } = await supabase
      .from('notifications' as any)
      .update({ is_read: true })
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;
    return true;
  } catch (error: any) {
    logger.error('Erro ao marcar notificação como lida:', error);
    return false;
  }
};

export const markAllNotificationsAsRead = async (userId: string): Promise<boolean> => {
  if (!userId) return false;
  try {
    const { error } = await supabase
      .from('notifications' as any)
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) throw error;
    return true;
  } catch (error: any) {
    logger.error('Erro ao marcar todas as notificações como lidas:', error);
    return false;
  }
};
