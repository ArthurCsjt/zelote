import { useQuery } from '@tanstack/react-query';
import { getActiveLoans, getLoanHistory, LoanHistoryFilters } from '@/services/loanService';

export const loanKeys = {
  all: ['loans'] as const,
  active: () => [...loanKeys.all, 'active'] as const,
  history: (filters?: LoanHistoryFilters) => [...loanKeys.all, 'history', filters] as const,
};

export function useActiveLoansQuery() {
  return useQuery({
    queryKey: loanKeys.active(),
    queryFn: getActiveLoans,
    staleTime: 1000 * 30, // 30 segundos
  });
}

export function useLoanHistoryQuery(filters?: LoanHistoryFilters) {
  return useQuery({
    queryKey: loanKeys.history(filters),
    queryFn: () => getLoanHistory(filters),
    staleTime: 1000 * 60, // 1 minuto
  });
}
