import { supabase } from '@/integrations/supabase/client';
import logger from '@/utils/logger';

// Helper to trigger push notifications via Edge Function
export const triggerPushNotification = async (title: string, body: string, url: string = '/') => {
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
      logger.error('Error triggering push:', error);
    }
  } catch (err) {
    logger.error('Failed to invoke push function:', err);
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
