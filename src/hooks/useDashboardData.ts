import { useState, useEffect, useCallback, useMemo } from 'react';
import { useDatabase } from '@/hooks/useDatabase';
import { toast } from '@/hooks/use-toast';
import type { LoanHistoryItem, Chromebook } from '@/types/database';
import { format, startOfDay, isToday, isWithinInterval, subDays, differenceInMinutes, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";

export type PeriodView = 'daily' | 'weekly' | 'monthly' | 'history' | 'reports';

interface DashboardStats {
  totalChromebooks: number;
  availableChromebooks: number;
  totalActive: number;
  totalInventoryUsageRate: number;
  averageUsageTime: number;
  completionRate: number;
  loansByUserType: Record<string, number>;
  userTypeData: { name: string; value: number }[];
  durationData: { name: string; minutos: number }[];
}

export function useDashboardData(periodView: PeriodView) {
  const { getLoanHistory, getChromebooks } = useDatabase();
  const [history, setHistory] = useState<LoanHistoryItem[]>([]);
  const [chromebooks, setChromebooks] = useState<Chromebook[]>([]);
  const [loading, setLoading] = useState(true);

  // --- Data Fetching ---
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [historyData, chromebooksData] = await Promise.all([
        getLoanHistory(),
        getChromebooks()
      ]);
      setHistory(historyData);
      setChromebooks(chromebooksData);
    } catch (error) {
      console.error('Erro ao buscar dados do dashboard:', error);
      toast({ title: "Erro de Sincronização", description: "Falha ao carregar dados do inventário/empréstimos.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [getLoanHistory, getChromebooks]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- Filtering by Period ---
  const { filteredLoans, filteredReturns } = useMemo(() => {
    const today = new Date();
    let startDate: Date;
    let endDate = today;

    switch (periodView) {
      case 'daily':
        startDate = startOfDay(today);
        break;
      case 'weekly':
        startDate = startOfWeek(today, { weekStartsOn: 1 });
        endDate = endOfWeek(today, { weekStartsOn: 1 });
        break;
      case 'monthly':
        startDate = startOfMonth(today);
        endDate = endOfMonth(today);
        break;
      default:
        // Para 'history' e 'reports', não aplicamos filtro temporal nos dados brutos
        return { filteredLoans: history, filteredReturns: history.filter(loan => loan.return_date) };
    }

    const loans = history.filter(loan => 
      isWithinInterval(new Date(loan.loan_date), { start: startDate, end: endDate })
    );
    const returns = loans.filter(loan => loan.return_date);

    return { filteredLoans: loans, filteredReturns: returns };
  }, [history, periodView]);

  // --- Calculations ---
  const stats = useMemo((): DashboardStats => {
    const totalChromebooks = chromebooks.length;
    
    // CORREÇÃO CRÍTICA: Apenas Chromebooks que podem ser emprestados (exclui 'fixo' e 'fora_uso')
    const availableForLoan = chromebooks.filter(cb => 
      cb.status !== 'fixo' && cb.status !== 'fora_uso'
    ).length;
    
    const availableChromebooks = chromebooks.filter(cb => cb.status === 'disponivel').length;
    const activeLoans = history.filter(loan => !loan.return_date);
    const totalActive = activeLoans.length;

    // Taxa de Uso do Inventário (ativos / total de móveis)
    const totalInventoryUsageRate = availableForLoan > 0 ? (totalActive / availableForLoan) * 100 : 0;

    // Estatísticas de Devolução
    const completedLoans = filteredLoans.filter(loan => loan.return_date);
    const completionRate = filteredLoans.length > 0 ? completedLoans.length / filteredLoans.length * 100 : 0;
    
    const averageUsageTime = completedLoans.reduce((acc, loan) => {
      if (loan.return_date) {
        const duration = differenceInMinutes(new Date(loan.return_date), new Date(loan.loan_date));
        return acc + duration;
      }
      return acc;
    }, 0) / (completedLoans.length || 1);

    // Uso por Tipo de Usuário
    const loansByUserType = filteredLoans.reduce((acc, loan) => {
      const userType = loan.user_type || 'aluno';
      acc[userType] = (acc[userType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const userTypeData = Object.entries(loansByUserType).map(([type, count]) => ({
      name: type.charAt(0).toUpperCase() + type.slice(1),
      value: count
    }));

    // Duração Média por Tipo de Usuário
    const averageLoanDurations = completedLoans.reduce((acc, loan) => {
      if (loan.return_date) {
        const durationMinutes = differenceInMinutes(new Date(loan.return_date), new Date(loan.loan_date));
        if (!acc[loan.user_type || 'aluno']) {
          acc[loan.user_type || 'aluno'] = { total: 0, count: 0 };
        }
        acc[loan.user_type || 'aluno'].total += durationMinutes;
        acc[loan.user_type || 'aluno'].count += 1;
      }
      return acc;
    }, {} as Record<string, { total: number; count: number; }>);

    const durationData = Object.entries(averageLoanDurations).map(([type, data]) => ({
      name: type.charAt(0).toUpperCase() + type.slice(1),
      minutos: Math.round(data.total / data.count)
    }));


    return {
      totalChromebooks,
      availableChromebooks,
      totalActive,
      totalInventoryUsageRate,
      averageUsageTime,
      completionRate,
      loansByUserType,
      userTypeData,
      durationData,
    };
  }, [chromebooks, history, filteredLoans]);

  // --- Period Data for Charts (Daily/Weekly/Monthly) ---
  const periodChartData = useMemo(() => {
    const currentDate = new Date();
    let data: any[] = [];

    switch (periodView) {
      case 'daily':
        // NOVO: Iterar de 6h a 20h (15 horas no total)
        const startHour = 6;
        const endHour = 20;
        
        data = Array.from({ length: endHour - startHour + 1 }, (_, i) => {
          const hour = startHour + i;
          const hourLoans = history.filter(loan => {
            const loanDate = new Date(loan.loan_date);
            return isToday(loanDate) && loanDate.getHours() === hour;
          });
          return {
            hora: `${hour}h`,
            empréstimos: hourLoans.length,
            devoluções: hourLoans.filter(loan => loan.status === 'devolvido').length
          };
        });
        break;
      case 'weekly':
        data = Array.from({ length: 7 }, (_, i) => {
          const date = subDays(currentDate, 6 - i);
          const dailyLoans = history.filter(loan => isWithinInterval(new Date(loan.loan_date), {
            start: startOfDay(date),
            end: new Date(date.setHours(23, 59, 59, 999))
          }));
          return {
            date: format(date, "dd/MM"),
            empréstimos: dailyLoans.length,
            devoluções: dailyLoans.filter(loan => loan.return_date).length
          };
        });
        break;
      case 'monthly':
        data = Array.from({ length: 30 }, (_, i) => {
          const date = subDays(currentDate, 29 - i);
          const dailyLoans = history.filter(loan => isWithinInterval(new Date(loan.loan_date), {
            start: startOfDay(date),
            end: new Date(date.setHours(23, 59, 59, 999))
          }));
          return {
            date: format(date, "dd/MM"),
            empréstimos: dailyLoans.length,
            devoluções: dailyLoans.filter(loan => loan.return_date).length
          };
        });
        break;
    }
    return data;
  }, [history, periodView]);


  return {
    loading,
    history,
    chromebooks,
    filteredLoans,
    filteredReturns,
    periodChartData,
    stats,
    refreshData: fetchData,
  };
}