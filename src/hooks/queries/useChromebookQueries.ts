import { useQuery } from '@tanstack/react-query';
import { getChromebooks, getChromebooksByStatus, getTotalAvailableChromebooks } from '@/services/chromebookService';
import type { Chromebook } from '@/types/database';

export const chromebookKeys = {
  all: ['chromebooks'] as const,
  lists: () => [...chromebookKeys.all, 'list'] as const,
  byStatus: (status: Chromebook['status']) => [...chromebookKeys.all, 'status', status] as const,
  totalAvailable: () => [...chromebookKeys.all, 'totalAvailable'] as const,
};

export function useChromebooksQuery() {
  return useQuery({
    queryKey: chromebookKeys.lists(),
    queryFn: getChromebooks,
    staleTime: 1000 * 60 * 2, // 2 minutos de cache fresco
  });
}

export function useChromebooksByStatusQuery(status: Chromebook['status']) {
  return useQuery({
    queryKey: chromebookKeys.byStatus(status),
    queryFn: () => getChromebooksByStatus(status),
    staleTime: 1000 * 60 * 2,
  });
}

export function useTotalAvailableChromebooksQuery() {
  return useQuery({
    queryKey: chromebookKeys.totalAvailable(),
    queryFn: getTotalAvailableChromebooks,
    staleTime: 1000 * 60 * 10,
  });
}
