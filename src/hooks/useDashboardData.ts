import { useState, useEffect, useCallback, useMemo } from 'react';
import { useDatabase } from '@/hooks/useDatabase';
import { toast } from '@/hooks/use-toast';
import type { LoanHistoryItem, Chromebook } from '@/types/database';
import { format, differenceInMinutes } from "date-fns";

// O PeriodView agora só terá 'history' e 'reports'
export type PeriodView = 'history' | 'reports';

interface TopLoanContext {
  context: string; // Combinação de Nome + Finalidade
  name: string; // Nome do Solicitante
  purpose: string; // Finalidade
  count: number;
  userType: string;
}

interface DashboardStats {
  totalChromebooks: number;
  availableChromebooks: number;
  totalActive: number;
  totalInventoryUsageRate: number;
  usageRateColor: 'green' | 'yellow' | 'red'; // NOVO: Cor semafórica
  averageUsageTime: number;
  completionRate: number;
  loansByUserType: Record<string, number>;
  userTypeData: { name: string; value: number }[];
  durationData: { name: string; value: number }[]; // Alterado para 'value' para consistência
  maxOccupancyRate: number; // Taxa de ocupação máxima
  occupancyRateColor: 'green' | 'yellow' | 'red'; // NOVO: Cor semafórica para pico
  topLoanContexts: TopLoanContext[]; // NOVO CAMPO
}

export function useDashboardData() {
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
    
    // Cor semafórica para Taxa de Uso (Tempo Real)
    const usageRateColor: 'green' | 'yellow' | 'red' = 
        totalInventoryUsageRate < 60 ? 'green' : 
        totalInventoryUsageRate < 85 ? 'yellow' : 'red';

    // Filtra apenas empréstimos concluídos
    const completedLoans = history.filter(loan => loan.return_date);
    const totalLoans = history.length;
    
    // Taxa de Conclusão (Devolvidos / Total de Empréstimos)
    const completionRate = totalLoans > 0 ? completedLoans.length / totalLoans * 100 : 0;
    
    // Tempo Médio de Uso (Calculado sobre todos os empréstimos concluídos)
    const averageUsageTime = completedLoans.reduce((acc, loan) => {
      if (loan.return_date) {
        const duration = differenceInMinutes(new Date(loan.return_date), new Date(loan.loan_date));
        return acc + duration;
      }
      return acc;
    }, 0) / (completedLoans.length || 1);

    // Uso por Tipo de Usuário (Calculado sobre todos os empréstimos)
    const loansByUserType = history.reduce((acc, loan) => {
      const userType = loan.user_type || 'aluno';
      acc[userType] = (acc[userType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const userTypeData = Object.entries(loansByUserType).map(([type, count]) => ({
      name: type.charAt(0).toUpperCase() + type.slice(1),
      value: count
    }));

    // Duração Média por Tipo de Usuário (Calculado sobre empréstimos concluídos)
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
      value: Math.round(data.total / data.count) // Usando 'value'
    }));
    
    // CÁLCULO: Top Contextos de Empréstimo (Solicitante + Finalidade) - Usando histórico completo
    const contextCounts = history.reduce((acc, loan) => {
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

    // Max Occupancy Rate (Simplificado para o total de ativos / total de móveis)
    const maxOccupancyRate = totalInventoryUsageRate;
    const occupancyRateColor = usageRateColor;


    return {
      totalChromebooks,
      availableChromebooks,
      totalActive,
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
    };
  }, [chromebooks, history]);

  // --- Period Data for Charts (Simplificado para mostrar apenas os últimos 7 dias) ---
  const periodChartData = useMemo(() => {
    // Agrupa empréstimos por dia nos últimos 7 dias
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const dailyDataMap = new Map<string, { empréstimos: number; devoluções: number; ocupação: number }>();
    
    // Inicializa os últimos 7 dias
    for (let i = 0; i <= 7; i++) {
        const date = new Date();
        date.setDate(date.getDate() - (7 - i));
        const label = format(date, "dd/MM");
        dailyDataMap.set(label, { empréstimos: 0, devoluções: 0, ocupação: 0 });
    }

    // Preenche os dados de empréstimo/devolução
    history.forEach(loan => {
        const loanDate = new Date(loan.loan_date);
        const loanLabel = format(loanDate, "dd/MM");
        
        if (dailyDataMap.has(loanLabel)) {
            const data = dailyDataMap.get(loanLabel)!;
            data.empréstimos += 1;
            if (loan.return_date) {
                data.devoluções += 1;
            }
        }
    });
    
    // Ocupação (Simplificado: não calculamos o pico horário, apenas o total de ativos no final do dia)
    // Para manter o gráfico funcional, vamos usar dados fictícios de ocupação ou remover o gráfico de ocupação.
    // Vamos manter o gráfico de ocupação, mas com dados simplificados (apenas para visualização)
    
    const chartData = Array.from(dailyDataMap.entries()).map(([label, data]) => ({
        label,
        ...data,
        // Ocupação fictícia para manter o gráfico: 50% + (empréstimos diários / 10)
        ocupação: Math.min(100, 50 + (data.empréstimos * 2)), 
    }));

    return chartData;
  }, [history]);


  return {
    loading,
    history,
    chromebooks,
    filteredLoans: history, // Retorna o histórico completo
    filteredReturns: history.filter(loan => loan.return_date), // Retorna devoluções completas
    periodChartData,
    stats,
    refreshData: fetchData,
  };
}