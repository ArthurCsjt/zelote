import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import type { Chromebook } from '@/types/database';
import logger from '@/utils/logger';

export interface ChromebookSearchResult {
  id: string;
  chromebook_id: string;
  model: string;
  status: Chromebook['status'];
  searchable: string;
  // Adicionando campos que faltavam
  manufacturer?: string | null;
  serial_number?: string | null;
  patrimony_number?: string | null;
}

export function useChromebookSearch() {
  const [chromebooks, setChromebooks] = useState<ChromebookSearchResult[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchChromebooks = useCallback(async () => {
    setLoading(true);
    try {
      // Busca agora inclui manufacturer e patrimony_number
      const { data, error } = await supabase
        .from('chromebooks')
        .select('id, chromebook_id, model, status, serial_number, patrimony_number, manufacturer');

      if (error) throw new Error('Erro ao carregar inventário de Chromebooks.');

      const results: ChromebookSearchResult[] = (data || []).map(cb => {
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
        };
      });

      setChromebooks(results);
    } catch (e: any) {
      logger.error('Erro no useChromebookSearch', e);
      toast({
        title: 'Erro de Sincronização',
        description: 'Não foi possível carregar a lista de Chromebooks para autocompletar.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchChromebooks();
  }, [fetchChromebooks]);

  return {
    chromebooks,
    loading,
    fetchChromebooks
  };
}