import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import type { Chromebook } from '@/types/database';

export interface ChromebookSearchResult {
  id: string;
  chromebook_id: string;
  model: string;
  status: Chromebook['status'];
  searchable: string;
}

export function useChromebookSearch() {
  const [chromebooks, setChromebooks] = useState<ChromebookSearchResult[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchChromebooks = useCallback(async () => {
    setLoading(true);
    try {
      // Busca apenas os campos essenciais para a pesquisa
      const { data, error } = await supabase
        .from('chromebooks')
        .select('id, chromebook_id, model, status, serial_number, patrimony_number');

      if (error) throw new Error('Erro ao carregar inventário de Chromebooks.');

      const results: ChromebookSearchResult[] = (data || []).map(cb => {
        const searchable = `${cb.chromebook_id} ${cb.model} ${cb.serial_number} ${cb.patrimony_number}`.toLowerCase();
        return {
          id: cb.id,
          chromebook_id: cb.chromebook_id,
          model: cb.model,
          status: cb.status,
          searchable,
        };
      });

      setChromebooks(results);
    } catch (e: any) {
      console.error('Erro no useChromebookSearch:', e);
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