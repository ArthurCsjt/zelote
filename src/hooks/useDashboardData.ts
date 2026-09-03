import { useState, useEffect, useCallback, useMemo } from 'react';
import { useDatabase, type Reservation } from '@/hooks/useDatabase';
import { toast } from '@/hooks/use-toast';
import type { LoanHistoryItem, Chromebook } from '@/types/database';
import { format, startOfDay, isToday, isWithinInterval, subDays, differenceInMinutes, differenceInDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, addDays, endOfDay } from "date-fns";
import logger from '@/utils/logger';

// O PeriodView agora só terá 'history' e 'reports'
export type PeriodView = 'history' | 'reports';

export interface TopLoanContext {
  context: string; // Combinação de Nome + Finalidade
  name: string; // Nome do Solicitante
  purpose: string; // Finalidade
  count: number;
  userType: string;
}

export interface FixedClassroomGroup {
  classroom: string;
  count: number;
  items: Chromebook[];
}

export interface DashboardOverdueLoan {
  id: string;
  chromebook_id: string;
  student_name: string;
  student_email: string;
  user_type: string;
  loan_date: string;
  expected_return_date: string;
  hoursOverdue: number;
  daysOverdue: number;
}

export interface DashboardStats {
  totalChromebooks: number;
  availableChromebooks: number;
  totalActive: number;
  totalFixed: number;
  fixedByClassroom: FixedClassroomGroup[];
  totalMaintenance: number;
  maintenanceItems: Chromebook[];
  overdueLoans: DashboardOverdueLoan[];
  overdueCount: number;
  todayReservationsCount: number;
  todayChromebooksReserved: number;
  fleetDistribution: { name: string; value: number; color: string }[];
  peakHour: { label: string; count: number; occupancy: number } | null;
  totalInventoryUsageRate: number;
  usageRateColor: 'green' | 'yellow' | 'red'; // Cor semafórica
  averageUsageTime: number;
  completionRate: number;
  loansByUserType: Record<string, number>;
  userTypeData: { name: string; value: number }[];
  durationData: { name: string; minutos: number }[];
  maxOccupancyRate: number; // Taxa de ocupação máxima
  occupancyRateColor: 'green' | 'yellow' | 'red'; // Cor semafórica para pico
  topLoanContexts: TopLoanContext[];
  totalMovable: number;
  availableMovable: number;
  reserveRate: number;
  deltas?: {
    usageRate: number;
    maxOccupancy: number;
    loanVolume: number;
    avgTime: number;
    completionRate: number;
  };
}

export function useDashboardData(
  startDate: Date | null,
  endDate: Date | null,
  startHour: number = 7,
  endHour: number = 19
) {
  const { getLoanHistory, getChromebooks, getReservationsForWeek } = useDatabase();
  const [history, setHistory] = useState<LoanHistoryItem[]>([]);
  const [chromebooks, setChromebooks] = useState<Chromebook[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);

  // --- Data Fetching ---
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const todayStr = format(new Date(), 'yyyy-MM-dd');
      const nextWeekStr = format(addDays(new Date(), 7), 'yyyy-MM-dd');

      const [historyData, chromebooksData, reservationsData] = await Promise.all([
        getLoanHistory(),
        getChromebooks(),
        getReservationsForWeek(todayStr, nextWeekStr).catch(() => [] as Reservation[])
      ]);
      setHistory(historyData);
      setChromebooks(chromebooksData);
      setReservations(reservationsData || []);
    } catch (error) {
      logger.error('Erro ao buscar dados do dashboard', error);
      toast({ title: "Erro de Sincronização", description: "Falha ao carregar dados do inventário/empréstimos.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [getLoanHistory, getChromebooks, getReservationsForWeek]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- Filtering by Period ---
  const { filteredLoans, filteredReturns } = useMemo(() => {
    if (!startDate || !endDate) {
      return { filteredLoans: history, filteredReturns: history.filter(loan => loan.return_date) };
    }

    const loans = history.filter(loan => {
      const loanDate = new Date(loan.loan_date);
      return isWithinInterval(loanDate, { start: startDate, end: endDate });
    });

    const returns = loans.filter(loan => loan.return_date);

    return { filteredLoans: loans, filteredReturns: returns };
  }, [history, startDate, endDate]);

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
        const dayEnd = new Date(currentDate);
        dayEnd.setHours(23, 59, 59, 999);

        const dailyLoans = history.filter(loan => isWithinInterval(new Date(loan.loan_date), {
          start: startOfDay(currentDate),
          end: dayEnd
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

    // --- Chromebooks Fixos por Sala ---
    const fixedChromebooks = chromebooks.filter(cb => cb.status === 'fixo');
    const totalFixed = fixedChromebooks.length;

    const classroomMap = new Map<string, Chromebook[]>();
    fixedChromebooks.forEach(cb => {
      const room = (cb.classroom || cb.location || 'Sem sala definida').trim();
      if (!classroomMap.has(room)) {
        classroomMap.set(room, []);
      }
      classroomMap.get(room)!.push(cb);
    });

    const fixedByClassroom: FixedClassroomGroup[] = Array.from(classroomMap.entries())
      .map(([classroom, items]) => ({
        classroom,
        count: items.length,
        items: items.sort((a, b) => a.chromebook_id.localeCompare(b.chromebook_id)),
      }))
      .sort((a, b) => b.count - a.count);

    // --- Empréstimos Atrasados (Overdue) ---
    const now = new Date();
    const overdueLoans: DashboardOverdueLoan[] = activeLoans
      .filter(loan => loan.expected_return_date && new Date(loan.expected_return_date) < now)
      .map(loan => {
        const expDate = new Date(loan.expected_return_date!);
        const diffMinutes = differenceInMinutes(now, expDate);
        return {
          id: loan.id,
          chromebook_id: loan.chromebook_id,
          student_name: loan.student_name,
          student_email: loan.student_email,
          user_type: loan.user_type || 'aluno',
          loan_date: loan.loan_date,
          expected_return_date: loan.expected_return_date!,
          hoursOverdue: Math.max(0, Math.floor(diffMinutes / 60)),
          daysOverdue: Math.max(0, Math.floor(diffMinutes / (60 * 24))),
        };
      })
      .sort((a, b) => b.hoursOverdue - a.hoursOverdue);

    const overdueCount = overdueLoans.length;

    // --- Reservas de Hoje ---
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const todayReservations = reservations.filter(r => r.date === todayStr);
    const todayReservationsCount = todayReservations.length;
    const todayChromebooksReserved = todayReservations.reduce(
      (acc, r) => acc + (r.quantity_requested || 0),
      0
    );

    // --- Manutenção / Defeito ---
    const maintenanceItems = chromebooks.filter(
      cb => cb.status === 'manutencao' || cb.status === 'fora_uso'
    );
    const totalMaintenance = maintenanceItems.length;

    // --- Raio-X da Frota Completa ---
    const fleetDistribution = [
      { name: 'Livres p/ Empréstimo', value: availableChromebooks, color: '#22C55E' },
      { name: 'Fixos em Sala', value: totalFixed, color: '#3B82F6' },
      { name: 'Em Uso Agora', value: totalActive, color: '#F59E0B' },
      { name: 'Em Manutenção', value: totalMaintenance, color: '#EF4444' },
    ];

    // --- Ponto de Pico Horário ---
    let peakHour: { label: string; count: number; occupancy: number } | null = null;
    if (periodChartData && periodChartData.length > 0) {
      const maxEntry = [...periodChartData].sort((a, b) => (b.empréstimos || 0) - (a.empréstimos || 0) || (b.ocupação || 0) - (a.ocupação || 0))[0];
      if (maxEntry && ((maxEntry.empréstimos || 0) > 0 || (maxEntry.ocupação || 0) > 0)) {
        peakHour = {
          label: maxEntry.label,
          count: maxEntry.empréstimos || 0,
          occupancy: Math.round(maxEntry.ocupação || 0),
        };
      }
    }

    // Taxa de Uso do Inventário (ativos / total de móveis)
    const totalInventoryUsageRate = availableForLoan > 0 ? (totalActive / availableForLoan) * 100 : 0;

    // Cor semafórica para Taxa de Uso (Tempo Real)
    const usageRateColor: 'green' | 'yellow' | 'red' =
      totalInventoryUsageRate < 60 ? 'green' :
        totalInventoryUsageRate < 85 ? 'yellow' : 'red';

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

    // Taxa de Ocupação Máxima no Período Filtrado
    let maxOccupancyRate = 0;
    if (availableForLoan > 0 && startDate && endDate && startHour <= endHour) {
      let maxConcurrentLoans = 0;
      const checkPoints: Date[] = [];
      let currentDate = startOfDay(startDate);
      const endLimitDate = endOfDay(endDate);

      while (currentDate <= endLimitDate) {
        for (let hour = startHour; hour <= endHour; hour++) {
          const checkTime = new Date(currentDate);
          checkTime.setHours(hour, 30, 0, 0);

          if (checkTime >= startDate && checkTime <= endDate) {
            checkPoints.push(checkTime);
          }
        }
        currentDate = addDays(currentDate, 1);
      }

      checkPoints.forEach(checkTime => {
        let concurrentLoans = 0;
        history.forEach(loan => {
          const loanStart = new Date(loan.loan_date);
          const loanEnd = loan.return_date ? new Date(loan.return_date) : new Date();

          if (checkTime >= loanStart && checkTime <= loanEnd) {
            concurrentLoans++;
          }
        });

        if (concurrentLoans > maxConcurrentLoans) {
          maxConcurrentLoans = concurrentLoans;
        }
      });

      maxOccupancyRate = (maxConcurrentLoans / availableForLoan) * 100;
    }

    const occupancyRateColor: 'green' | 'yellow' | 'red' =
      maxOccupancyRate < 60 ? 'green' :
        maxOccupancyRate < 85 ? 'yellow' : 'red';

    // Top Contextos de Empréstimo
    const contextCounts = filteredLoans.reduce((acc, loan) => {
      const contextKey = `${loan.student_email}:${loan.purpose}`;
      if (!acc[contextKey]) {
        acc[contextKey] = {
          context: `${loan.student_name} (${loan.purpose})`,
          name: loan.student_name,
          purpose: loan.purpose,
          count: 0,
          userType: loan.user_type,
        };
      }
      acc[contextKey].count += 1;
      return acc;
    }, {} as Record<string, TopLoanContext>);

    const topLoanContexts = Object.values(contextCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalChromebooks,
      availableChromebooks,
      totalActive,
      totalFixed,
      fixedByClassroom,
      totalMaintenance,
      maintenanceItems,
      overdueLoans,
      overdueCount,
      todayReservationsCount,
      todayChromebooksReserved,
      fleetDistribution,
      peakHour,
      totalInventoryUsageRate,
      usageRateColor,
      averageUsageTime,
      completionRate,
      loansByUserType,
      userTypeData,
      durationData,
      maxOccupancyRate: Math.min(100, maxOccupancyRate),
      occupancyRateColor,
      topLoanContexts,
      totalMovable: availableForLoan,
      availableMovable: availableForLoan - totalActive,
      reserveRate: availableForLoan > 0 ? ((availableForLoan - totalActive) / availableForLoan) * 100 : 0,
      deltas: (() => {
        if (!startDate || !endDate || isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return undefined;

        const duration = differenceInDays(endDate, startDate) + 1;
        const prevStart = subDays(startDate, duration);
        const prevEnd = subDays(startDate, 1);

        const prevLoans = history.filter(loan => isWithinInterval(new Date(loan.loan_date), { start: prevStart, end: prevEnd }));
        const prevReturns = prevLoans.filter(loan => loan.return_date);

        const loanVolumeDelta = prevLoans.length > 0 ? ((filteredLoans.length - prevLoans.length) / prevLoans.length) * 100 : 0;

        const prevAvgTime = prevReturns.reduce((acc, loan) => acc + differenceInMinutes(new Date(loan.return_date!), new Date(loan.loan_date)), 0) / (prevReturns.length || 1);
        const avgTimeDelta = prevAvgTime > 0 ? ((averageUsageTime - prevAvgTime) / prevAvgTime) * 100 : 0;

        let maxPrevConcurrent = 0;
        const checkPoints: Date[] = [];
        let curr = startOfDay(prevStart);
        while (curr <= endOfDay(prevEnd)) {
          for (let h = startHour; h <= endHour; h++) {
            const ct = new Date(curr);
            ct.setHours(h, 30);
            if (ct >= prevStart && ct <= prevEnd) checkPoints.push(ct);
          }
          curr = addDays(curr, 1);
        }
        checkPoints.forEach(ct => {
          let count = 0;
          history.forEach(l => {
            const s = new Date(l.loan_date);
            const e = l.return_date ? new Date(l.return_date) : new Date();
            if (ct >= s && ct <= e) count++;
          });
          maxPrevConcurrent = Math.max(maxPrevConcurrent, count);
        });
        const prevMaxRate = availableForLoan > 0 ? (maxPrevConcurrent / availableForLoan) * 100 : 0;
        const maxOccupancyDelta = prevMaxRate > 0 ? ((maxOccupancyRate - prevMaxRate) / prevMaxRate) * 100 : 0;

        const prevCompletionRate = prevLoans.length > 0 ? (prevReturns.length / prevLoans.length) * 100 : 0;
        const completionRateDelta = prevCompletionRate > 0 ? ((completionRate - prevCompletionRate) / prevCompletionRate) * 100 : 0;

        return {
          usageRate: 0,
          maxOccupancy: maxOccupancyDelta,
          loanVolume: loanVolumeDelta,
          avgTime: avgTimeDelta,
          completionRate: completionRateDelta
        };
      })(),
    };
  }, [chromebooks, history, reservations, filteredLoans, startHour, endHour, startDate, endDate, periodChartData]);

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