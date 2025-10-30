import { useState, useEffect, useCallback, useMemo } from 'react';
import { useDatabase } from '@/hooks/useDatabase';
import { toast } from '@/hooks/use-toast';
import type { LoanHistoryItem, Chromebook } from '@/types/database';
import { format, startOfDay, isToday, isWithinInterval, subDays, differenceInMinutes, startOfWeek, endOfWeek, startOfMonth, endOfMonth, addDays, endOfDay } from "date-fns";

// O PeriodView agora só terá 'history' e 'reports'
export type PeriodView = 'history' | 'reports';

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
  maxOccupancyRate: number; // Taxa de ocupação máxima
  peakTime: Date | null; // NOVO: Momento em que o pico ocorreu
  peakLoanIds: string[]; // NOVO: IDs dos empréstimos ativos no pico
}

export function useDashboardData(
  startDate: Date | null, // NOVO: Data de início explícita
  endDate: Date | null,   // NOVO: Data de fim explícita
  startHour: number = 7, 
  endHour: number = 19 
) {
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
    if (!startDate || !endDate) {
        // Se não houver datas definidas, retorna o histórico completo (comportamento padrão para 'history' view)
        return { filteredLoans: history, filteredReturns: history.filter(loan => loan.return_date) };
    }
    
    const loans = history.filter(loan => {
        const loanDate = new Date(loan.loan_date);
        // Filtra empréstimos que começaram dentro do intervalo [startDate, endDate]
        return isWithinInterval(loanDate, { start: startDate, end: endDate });
    });
    
    const returns = loans.filter(loan => loan.return_date);

    return { filteredLoans: loans, filteredReturns: returns };
  }, [history, startDate, endDate]);

  // --- Calculations ---
  const stats = useMemo((): DashboardStats => {
    const totalChromebooks = chromebooks.length;
    
    // Chromebooks que podem ser emprestados (exclui 'fixo' e 'fora_uso')
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
    
    // CÁLCULO: Taxa de Ocupação Máxima no Período Filtrado (startHour a endHour)
    let maxOccupancyRate = 0;
    let peakTime: Date | null = null;
    let peakLoanIds: string[] = [];
    
    if (availableForLoan > 0 && startDate && endDate && startHour <= endHour) {
        let maxConcurrentLoans = 0;
        
        // 1. Definir o intervalo de tempo para checagem
        const checkPoints: Date[] = [];
        let currentDate = startOfDay(startDate);
        const endLimitDate = endOfDay(endDate);

        while (currentDate <= endLimitDate) {
            for (let hour = startHour; hour <= endHour; hour++) {
                const checkTime = new Date(currentDate);
                checkTime.setHours(hour, 30, 0, 0); // Checa no meio da hora
                
                // Garante que o ponto de checagem esteja dentro do intervalo [startDate, endDate]
                if (checkTime >= startDate && checkTime <= endDate) {
                    checkPoints.push(checkTime);
                }
            }
            currentDate = addDays(currentDate, 1);
        }
        
        // 2. Calcular o pico de empréstimos ativos em cada ponto de checagem
        checkPoints.forEach(checkTime => {
            let concurrentLoans = 0;
            let currentPeakLoanIds: string[] = [];
            
            history.forEach(loan => {
                const loanStart = new Date(loan.loan_date);
                // Se o empréstimo não foi devolvido, consideramos que ele está ativo até agora
                const loanEnd = loan.return_date ? new Date(loan.return_date) : new Date(); 
                
                // Verifica se o empréstimo estava ativo no checkTime
                if (checkTime >= loanStart && checkTime <= loanEnd) {
                    concurrentLoans++;
                    currentPeakLoanIds.push(loan.id); // Armazena o ID do empréstimo (loan.id)
                }
            });
            
            if (concurrentLoans > maxConcurrentLoans) {
                maxConcurrentLoans = concurrentLoans;
                peakTime = checkTime;
                peakLoanIds = currentPeakLoanIds;
            }
        });
        
        maxOccupancyRate = (maxConcurrentLoans / availableForLoan) * 100;
    }


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
      maxOccupancyRate: Math.min(100, maxOccupancyRate), // Limita a 100%
      peakTime,
      peakLoanIds,
    };
  }, [chromebooks, history, filteredLoans, startHour, endHour, startDate, endDate]);

  // --- Period Data for Charts (Hourly/Daily) ---
  const periodChartData = useMemo(() => {
    if (!startDate || !endDate) return [];
    
    const availableForLoan = chromebooks.filter(cb => 
      cb.status !== 'fixo' && cb.status !== 'fora_uso'
    ).length;
    
    const diffDays = differenceInMinutes(endDate, startDate) / (60 * 24);
    
    // Se o período for menor ou igual a 2 dias, mostramos por hora
    if (diffDays <= 2) {
        const data: any[] = [];
        let currentHour = new Date(startDate);
        currentHour.setMinutes(0, 0, 0);
        
        const endLimit = new Date(endDate);
        endLimit.setHours(endHour, 59, 59, 999);

        while (currentHour <= endLimit) {
            const hour = currentHour.getHours();
            const day = format(currentHour, 'dd/MM');
            const label = `${day} ${hour}h`;
            
            // Filtra empréstimos que começaram na hora atual
            const hourLoans = history.filter(loan => {
                const loanDate = new Date(loan.loan_date);
                return isWithinInterval(loanDate, { start: currentHour, end: new Date(currentHour.getTime() + 3600000) });
            });
            
            // CÁLCULO DE OCUPAÇÃO HORÁRIA
            let concurrentLoans = 0;
            const checkTime = new Date(currentHour);
            checkTime.setMinutes(30); 
            
            history.forEach(loan => {
                const loanStart = new Date(loan.loan_date);
                const loanEnd = loan.return_date ? new Date(loan.return_date) : new Date();
                
                if (checkTime >= loanStart && checkTime <= loanEnd) {
                    concurrentLoans++;
                }
            });
            
            const occupancy = availableForLoan > 0 ? (concurrentLoans / availableForLoan) * 100 : 0;

            data.push({
                label: label,
                empréstimos: hourLoans.length,
                devoluções: hourLoans.filter(loan => loan.return_date).length,
                ocupação: Math.min(100, occupancy),
            });
            
            // Avança para a próxima hora
            currentHour = new Date(currentHour.getTime() + 3600000);
            
            // Se ultrapassarmos o endLimit, paramos
            if (currentHour > endLimit) break;
        }
        return data;
    } 
    
    // Se o período for maior que 2 dias, mostramos por dia
    else {
        const data: any[] = [];
        let currentDate = startOfDay(startDate);
        const endLimit = startOfDay(endDate);

        while (currentDate <= endLimit) {
            const dailyLoans = history.filter(loan => isWithinInterval(new Date(loan.loan_date), {
                start: startOfDay(currentDate),
                end: new Date(currentDate.setHours(23, 59, 59, 999))
            }));
            
            // CÁLCULO DE OCUPAÇÃO DIÁRIA MÁXIMA
            let maxDailyOccupancy = 0;
            if (availableForLoan > 0) {
                for (let h = startHour; h <= endHour; h++) {
                    let concurrentLoans = 0;
                    const checkTime = new Date(currentDate);
                    checkTime.setHours(h, 30, 0, 0);
                    
                    history.forEach(loan => {
                        const loanStart = new Date(loan.loan_date);
                        const loanEnd = loan.return_date ? new Date(loan.return_date) : new Date();
                        
                        if (checkTime >= loanStart && checkTime <= loanEnd) {
                            concurrentLoans++;
                        }
                    });
                    maxDailyOccupancy = Math.max(maxDailyOccupancy, concurrentLoans);
                }
            }
            const occupancyRate = availableForLoan > 0 ? (maxDailyOccupancy / availableForLoan) * 100 : 0;

            data.push({
                label: format(currentDate, "dd/MM"),
                empréstimos: dailyLoans.length,
                devoluções: dailyLoans.filter(loan => loan.return_date).length,
                ocupação: Math.min(100, occupancyRate),
            });
            
            currentDate = addDays(currentDate, 1);
        }
        return data;
    }
  }, [chromebooks, history, startDate, endDate, startHour, endHour]);


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