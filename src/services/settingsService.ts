import { supabase } from '@/integrations/supabase/client';
import logger from '@/utils/logger';

export const getSystemSetting = async (key: string, defaultValue: any = null): Promise<any> => {
  try {
    const { data, error } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', key)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return defaultValue; // Chave não encontrada
      throw error;
    }
    return data.value;
  } catch (error: any) {
    logger.error(`Erro ao buscar configuração ${key}:`, error);
    return defaultValue;
  }
};

export const updateSystemSetting = async (key: string, value: any, userId: string): Promise<boolean> => {
  if (!userId) return false;
  try {
    const { error } = await supabase
      .from('system_settings')
      .upsert({ 
        key, 
        value, 
        updated_at: new Date().toISOString(),
        updated_by: userId 
      });

    if (error) throw error;
    return true;
  } catch (error: any) {
    logger.error(`Erro ao atualizar configuração ${key}:`, error);
    throw error;
  }
};
