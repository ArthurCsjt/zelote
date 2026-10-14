import { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Chromebook } from '@/types/database';
import logger from '@/utils/logger';

export interface ChromebookSearchResult {
  id: string;
  chromebook_id: string;
  model: string;
  status: Chromebook['status'];
  searchable: string;
  manufacturer?: string | null;
  serial_number?: string | null;
  patrimony_number?: string | null;
  condition?: string | null;
}

const fetchAllChromebooksSearch = async (): Promise<ChromebookSearchResult[]> => {
  const { data, error } = await supabase
    .from('chromebooks')
    .select('id, chromebook_id, model, status, serial_number, patrimony_number, manufacturer, condition')
    .order('chromebook_id', { ascending: true });

  if (error) {
    logger.error('Erro ao carregar inventário de Chromebooks para busca:', error);
    throw new Error('Erro ao carregar inventário de Chromebooks.');
  }

  return (data || []).map(cb => {
    const searchable = `${cb.chromebook_id} ${cb.model} ${cb.serial_number} ${cb.patrimony_number} ${cb.manufacturer}`.toLowerCase();
    return {
      id: cb.id,
      chromebook_id: cb.chromebook_id,
      model: cb.model,
      status: cb.status,
      searchable,
      manufacturer: cb.manufacturer,
      serial_number: cb.serial_number,
      patrimony_number: cb.patrimony_number,
      condition: cb.condition,
    };
  });
};

export function useChromebookSearch() {
  const { data: chromebooks = [], isLoading, refetch } = useQuery({
    queryKey: ['chromebook-search-list'],
    queryFn: fetchAllChromebooksSearch,
    staleTime: 1000 * 60 * 2, // 2 minutos de cache compartilhado
    gcTime: 1000 * 60 * 10,
  });

  const fetchChromebooks = useCallback(async () => {
    await refetch();
  }, [refetch]);

  return {
    chromebooks,
    loading: isLoading,
    fetchChromebooks
  };
}