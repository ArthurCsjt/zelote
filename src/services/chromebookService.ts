import { supabase } from '@/integrations/supabase/client';
import type { Chromebook, ChromebookData } from '@/types/database';
import logger from '@/utils/logger';
import { handleSupabaseError, retryWithBackoff } from '@/utils/networkErrors';

export const mapChromebookDataToDb = (data: Partial<ChromebookData>, userId?: string) => {
  const payload: Record<string, any> = {
    chromebook_id: data.chromebookId,
    model: data.model,
    serial_number: data.serialNumber,
    patrimony_number: data.patrimonyNumber,
    manufacturer: data.manufacturer,
    status: data.status,
    condition: data.condition,
    location: data.location,
    classroom: data.classroom,
    is_deprovisioned: data.is_deprovisioned ?? false,
  };

  if (userId && !data.id) {
    payload.created_by = userId;
  }

  // Remove chaves com valor undefined
  Object.keys(payload).forEach(key => payload[key] === undefined && delete payload[key]);

  return payload;
};

export const getNextChromebookId = async (): Promise<string | null> => {
  try {
    const { data, error } = await supabase.rpc('generate_new_chromebook_id');
    if (error) {
      logger.error('Erro ao obter próximo ID de Chromebook via RPC:', error);
      return null;
    }
    return data;
  } catch (err) {
    logger.error('Exceção ao chamar generate_new_chromebook_id:', err);
    return null;
  }
};

export const createChromebook = async (data: ChromebookData, userId: string): Promise<Chromebook> => {
  const payload = mapChromebookDataToDb(data, userId);

  // Se o ID não foi fornecido, gera o próximo da sequência automaticamente (ex: CHR185)
  if (!payload.chromebook_id) {
    const newId = await getNextChromebookId();
    if (!newId) {
      throw new Error('Falha ao gerar o próximo ID sequencial do Chromebook.');
    }
    payload.chromebook_id = newId;
  }

  const { data: result, error } = await supabase
    .from('chromebooks')
    .insert(payload)
    .select()
    .single();

  if (error) throw error;
  return result as Chromebook;
};

export const getChromebooks = async (): Promise<Chromebook[]> => {
  const result = await retryWithBackoff(async () => {
    const { data, error } = await supabase
      .from('chromebooks')
      .select('*')
      .order('chromebook_id', { ascending: false });

    if (error) throw error;
    return data || [];
  }, 3, 1000);

  return result as Chromebook[];
};

export const getChromebooksByStatus = async (status: Chromebook['status']): Promise<Chromebook[]> => {
  const { data, error } = await supabase
    .from('chromebooks')
    .select('*')
    .eq('status', status)
    .order('chromebook_id', { ascending: true });

  if (error) throw error;
  return (data || []) as Chromebook[];
};

export const updateChromebook = async (id: string, data: Partial<ChromebookData>): Promise<boolean> => {
  const updatePayload = mapChromebookDataToDb(data, undefined);

  const { error } = await supabase
    .from('chromebooks')
    .update(updatePayload)
    .eq('id', id);

  if (error) throw error;
  return true;
};

export const deleteChromebook = async (id: string): Promise<boolean> => {
  const { error } = await supabase
    .from('chromebooks')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return true;
};

export const syncChromebookStatus = async (chromebookId: string): Promise<string | null> => {
  const data = await retryWithBackoff(async () => {
    const { data: rpcData, error } = await supabase.rpc('sync_chromebook_status', { cb_id: chromebookId });
    if (error) throw error;
    return rpcData;
  }, 2, 500);

  return data;
};

export const getTotalAvailableChromebooks = async (): Promise<number> => {
  const { count, error } = await supabase
    .from('chromebooks')
    .select('id', { count: 'exact', head: true })
    .in('status', ['disponivel', 'fixo']);

  if (error) throw error;
  return count || 0;
};
