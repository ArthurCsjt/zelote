import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import type { Chromebook } from '@/types/database';

export interface ChromebookSearchResult {
  id: string; // UUID do DB
  chromebook_id: string; // ID amigável (CHRxxx)
  model: string;
  status: Chromebook['status'];
  serial_number?: string;
  patrimony_number?: string;
}

// Hook auxiliar para debounce (copiado do useUserSearch para consistência)
function useDebounce(value: string, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export function useChromebookSearch(searchTerm: string) {
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [chromebooks, setChromebooks] = useState<ChromebookSearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchChromebooks = useCallback(async () => {
    const term = debouncedSearchTerm.trim();
    if (term.length < 2) {
      setChromebooks([]);
      return;
    }

    setLoading(true);
    try {
      const searchPattern = `%${term.toLowerCase()}%`;
      
      // Busca por ID amigável, número de série, patrimônio ou modelo
      const { data, error } = await supabase
        .from('chromebooks')
        .select('id, chromebook_id, model, status, serial_number, patrimony_number')
        .or(
          [
            `chromebook_id.ilike.${searchPattern}`,
            `serial_number.ilike.${searchPattern}`,
            `patrimony_number.ilike.${searchPattern}`,
            `model.ilike.${searchPattern}`,
          ].join(',')
        )
        .limit(50);

      if (error) throw error;

      setChromebooks((data || []) as ChromebookSearchResult[]);
    } catch (e: any) {
      console.error('Erro no useChromebookSearch:', e);
      toast({
        title: 'Erro de Busca',
        description: 'Não foi possível carregar a lista de Chromebooks.',
        variant: 'destructive',
      });
      setChromebooks([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearchTerm]);

  useEffect(() => {
    fetchChromebooks();
  }, [fetchChromebooks]);

  return { chromebooks, loading, fetchChromebooks };
}