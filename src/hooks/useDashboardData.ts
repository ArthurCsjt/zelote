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
  maxOccupancyRate: number; // NOVO: Taxa de ocupação máxima
}

export function useDashboardData(
  periodView: PeriodView, 
  startHour: number = 7, // NOVO: Hora de início padrão
  endHour: number = 19 // NOVO: Hora de fim padrão
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
  const { filteredLoans, filteredReturns, startDate, endDate } = useMemo(() => {
    const today = new Date();
    let start: Date;
    let end = today;

    switch (periodView) {
      case 'daily':
        start = startOfDay(today);
        break;
      case 'weekly':
        start = startOfWeek(today, { weekStartsOn: 1 });
        end = endOfWeek(today, { weekStartsOn: 1 });
        break;
      case 'monthly':
        start = startOfMonth(today);
        end = endOfMonth(today);
        break;
      default:
        // Para 'history' e 'reports', não aplicamos filtro temporal nos dados brutos
        return { filteredLoans: history, filteredReturns: history.filter(loan => loan.return_date), startDate: today, endDate: today };
    }

    const loans = history.filter(loan => 
      isWithinInterval(new Date(loan.loan_date), { start: start, end: end })
    );
    const returns = loans.filter(loan => loan.return_date);

    return { filteredLoans: loans, filteredReturns: returns, startDate: start, endDate: end };
  }, [history, periodView]);

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
    if (availableForLoan > 0 && startHour <= endHour) {
        let maxConcurrentLoans = 0;
        
        // Iterar por cada hora do dia (ou do período definido)
        for (let h = startHour; h <= endHour; h++) {
            let concurrentLoans = 0;
            
            // Para cada empréstimo no histórico
            history.forEach(loan => {
                const loanStart = new Date(loan.loan_date);
                const loanEnd = loan.return_date ? new Date(loan.return_date) : new Date(); 
                
                // Cria um ponto de tempo para a hora atual (ex: 10:30h do dia do empréstimo)
                const checkTime = new Date(loanStart);
                checkTime.setHours(h, 30, 0, 0); // Checa no meio da hora
                
                // 1. Verifica se o checkTime está dentro do período de visualização (dia/semana/mês)
                let isWithinView = true;
                if (periodView === 'daily') {
                    isWithinView = isToday(checkTime);
                } else if (periodView === 'weekly' && startDate && endDate) {
                    isWithinView = isWithinInterval(checkTime, { start: startDate, end: endDate });
                } else if (periodView === 'monthly' && startDate && endDate) {
                    isWithinView = isWithinInterval(checkTime, { start: startDate, end: endDate });
                }
                
                // 2. Verifica se o empréstimo estava ativo no checkTime
                if (isWithinView && checkTime >= loanStart && checkTime <= loanEnd) {
                    concurrentLoans++;
                }
            });
            
            if (concurrentLoans > maxConcurrentLoans) {
                maxConcurrentLoans = concurrentLoans;
            }
        }
        
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
    };
  }, [chromebooks, history, filteredLoans, periodView, startHour, endHour, startDate, endDate]);

  // --- Period Data for Charts (Daily/Weekly/Monthly) ---
  const periodChartData = useMemo(() => {
    const currentDate = new Date();
    let data: any[] = [];
    
    // Chromebooks que podem ser emprestados (exclui 'fixo' e 'fora_uso')
    const availableForLoan = chromebooks.filter(cb => 
      cb.status !== 'fixo' && cb.status !== 'fora_uso'
    ).length;

    switch (periodView) {
      case 'daily':
        // Iterar de 6h a 20h
        const dailyStartHour = 6;
        const dailyEndHour = 20;
        
        data = Array.from({ length: dailyEndHour - dailyStartHour + 1 }, (_, i) => {
          const hour = dailyStartHour + i;
          const hourLoans = history.filter(loan => {
            const loanDate = new Date(loan.loan_date);
            return isToday(loanDate) && loanDate.getHours() === hour;
          });
          
          // CÁLCULO DE OCUPAÇÃO HORÁRIA (para o gráfico de linha)
          let concurrentLoans = 0;
          const checkTime = new Date(currentDate);
          checkTime.setHours(hour, 30, 0, 0); // Checa no meio da hora
          
          history.forEach(loan => {
              const loanStart = new Date(loan.loan_date);
              const loanEnd = loan.return_date ? new Date(loan.return_date) : new Date();
              
              // Verifica se o empréstimo estava ativo no checkTime E se é hoje
              if (isToday(loanStart) && checkTime >= loanStart && checkTime <= loanEnd) {
                  concurrentLoans++;
              }
          });
          
          const occupancy = availableForLoan > 0 ? (concurrentLoans / availableForLoan) * 100 : 0;

          return {
            hora: `${hour}h`,
            empréstimos: hourLoans.length,
            devoluções: hourLoans.filter(loan => loan.status === 'devolvido').length,
            ocupação: Math.min(100, occupancy), // Adicionando a taxa de ocupação
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
          
          // CÁLCULO DE OCUPAÇÃO DIÁRIA MÁXIMA (para o gráfico de linha semanal/mensal)
          let maxDailyOccupancy = 0;
          if (availableForLoan > 0) {
              for (let h = startHour; h <= endHour; h++) {
                  let concurrentLoans = 0;
                  const checkTime = new Date(date);
                  checkTime.setHours(h, 30, 0, 0);
                  
                  history.forEach(loan => {
                      const loanStart = new Date(loan.loan_date);
                      const loanEnd = loan.return_date ? new Date(loan.return_date) : new Date();
                      
                      if (isWithinInterval(loanStart, { start: startOfDay(date), end: new Date(date.setHours(23, 59, 59, 999)) }) && checkTime >= loanStart && checkTime <= loanEnd) {
                          concurrentLoans++;
                      }
                  });
                  maxDailyOccupancy = Math.max(maxDailyOccupancy, concurrentLoans);
              }
          }
          const occupancyRate = availableForLoan > 0 ? (maxDailyOccupancy / availableForLoan) * 100 : 0;

          return {
            date: format(date, "dd/MM"),
            empréstimos: dailyLoans.length,
            devoluções: dailyLoans.filter(loan => loan.return_date).length,
            ocupação: Math.min(100, occupancyRate), // Adicionando a taxa de ocupação
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
          
          // CÁLCULO DE OCUPAÇÃO DIÁRIA MÁXIMA (para o gráfico de linha semanal/mensal)
          let maxDailyOccupancy = 0;
          if (availableForLoan > 0) {
              for (let h = startHour; h <= endHour; h++) {
                  let concurrentLoans = 0;
                  const checkTime = new Date(date);
                  checkTime.setHours(h, 30, 0, 0);
                  
                  history.forEach(loan => {
                      const loanStart = new Date(loan.loan_date);
                      const loanEnd = loan.return_date ? new Date(loan.return_date) : new Date();
                      
                      if (isWithinInterval(loanStart, { start: startOfDay(date), end: new Date(date.setHours(23, 59, 59, 999)) }) && checkTime >= loanStart && checkTime <= loanEnd) {
                          concurrentLoans++;
                      }
                  });
                  maxDailyOccupancy = Math.max(maxDailyOccupancy, concurrentLoans);
              }
          }
          const occupancyRate = availableForLoan > 0 ? (maxDailyOccupancy / availableForLoan) * 100 : 0;

          return {
            date: format(date, "dd/MM"),
            empréstimos: dailyLoans.length,
            devoluções: dailyLoans.filter(loan => loan.return_date).length,
            ocupação: Math.min(100, occupancyRate), // Adicionando a taxa de ocupação
          };
        });
        break;
    }
    return data;
  }, [chromebooks, history, periodView, startHour, endHour]);


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