import React, { useState } from "react";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Computer, TrendingUp, Info, Clock, Activity, CheckCircle, RotateCcw } from "lucide-react";
import { Tooltip as ShadcnTooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from '@/lib/utils';
import type { LoanHistoryItem, Chromebook } from "@/types/database";
import type { useDashboardData } from '@/hooks/useDashboardData';

// Tipos para o estado do modal
type DetailItem = {
  id: string;
  chromebook_id: string;
  model: string;
  status?: Chromebook['status'];
  loan_date?: string;
  expected_return_date?: string;
  student_name?: string;
  isOverdue?: boolean;
};

interface DashboardStatsGridProps {
  stats: ReturnType<typeof useDashboardData>['stats'];
  history: LoanHistoryItem[];
  filteredLoans: LoanHistoryItem[];
  filteredReturns: LoanHistoryItem[];
  loading: boolean;
  isMounted: boolean;
  onCardClick: (
    title: string,
    description: string,
    dataType: 'chromebooks' | 'loans',
    initialData: DetailItem[] | null,
    statusFilter?: Chromebook['status']
  ) => void;
}

export const DashboardStatsGrid: React.FC<DashboardStatsGridProps> = ({
  stats,
  history,
  filteredLoans,
  filteredReturns,
  loading,
  isMounted,
  onCardClick
}) => {

  const {
    totalActive = 0,
    totalChromebooks = 0,
    availableChromebooks = 0,
    averageUsageTime = 0,
    completionRate = 0,
  } = stats || {};

  const isOverdue = (loan: LoanHistoryItem): boolean => {
    return !!(loan.expected_return_date && new Date(loan.expected_return_date) < new Date());
  };

  const getAnimationClass = (delay: number) =>
    isMounted ? `animate-fadeIn animation-delay-${delay}` : 'opacity-0';

  const DeltaBadge = ({ value, invertColor = false }: { value?: number, invertColor?: boolean }) => {
    if (value === undefined || value === 0) return null;
    const isIncrease = value > 0;
    // Para tempo de uso, aumento pode ser ruim. Para volume, aumento é crescimento.
    const isPositiveEffect = invertColor ? !isIncrease : isIncrease;

    return (
      <div className={cn(
        "inline-flex items-center px-1.5 py-0.5 text-[10px] font-black border border-black uppercase mt-1",
        isPositiveEffect ? "bg-green-300 text-green-900" : "bg-red-300 text-red-900"
      )}>
        {isIncrease ? "+" : ""}
        {value.toFixed(0)}%
      </div>
    );
  };

  const cardData = [
    {
      title: 'Empréstimos Ativos',
      value: totalActive,
      description: `${filteredLoans.length} empréstimos no período`,
      delta: stats?.deltas?.loanVolume,
      icon: Computer,
      color: 'blue',
      gradient: 'from-blue-600 to-blue-800',
      onClick: () => onCardClick('Empréstimos Ativos', 'Lista de todos os Chromebooks atualmente emprestados.', 'loans', history.filter((loan: LoanHistoryItem) => !loan.return_date).map((loan: LoanHistoryItem) => ({
        id: loan.id,
        chromebook_id: loan.chromebook_id,
        model: loan.chromebook_model,
        loan_date: loan.loan_date,
        expected_return_date: loan.expected_return_date,
        student_name: loan.student_name,
        isOverdue: isOverdue(loan),
      }))),
      tooltip: 'Número de Chromebooks atualmente emprestados (status "emprestado"). Clique para ver a lista.',
      delay: 200,
    },
    {
      title: 'Disponíveis',
      value: availableChromebooks,
      description: `de ${totalChromebooks} no total`,
      icon: CheckCircle,
      color: 'green',
      gradient: 'from-green-600 to-emerald-600',
      onClick: () => onCardClick('Disponíveis', 'Lista de Chromebooks prontos para empréstimo.', 'chromebooks', null, 'disponivel'),
      tooltip: 'Número de Chromebooks com status "disponível" no inventário. Clique para ver a lista.',
      delay: 300,
    },
    {
      title: 'Tempo Médio de Uso',
      value: `${Math.round(averageUsageTime)} min`,
      description: 'média no período',
      delta: stats?.deltas?.avgTime,
      icon: Clock,
      color: 'purple',
      gradient: 'from-purple-600 to-violet-600',
      onClick: () => { },
      tooltip: 'Duração média (em minutos) dos empréstimos que foram devolvidos no período selecionado.',
      delay: 400,
    },
    {
      title: 'Taxa de Devolução',
      value: `${completionRate.toFixed(0)}%`,
      description: `${filteredReturns.length} de ${filteredLoans.length} devolvidos`,
      delta: stats?.deltas?.completionRate,
      icon: RotateCcw,
      color: 'teal',
      gradient: 'from-teal-600 to-cyan-600',
      onClick: () => { },
      tooltip: 'Porcentagem de empréstimos realizados no período que já foram devolvidos.',
      delay: 500,
    },
  ];

  return (
    <TooltipProvider>
      {cardData.map((item, index) => {
        const Icon = item.icon;
        const isClickable = !!item.onClick;

        return (
          <div
            key={index}
            className={cn(
              "neo-stat-card neo-pattern-dots relative overflow-visible",
              isClickable && 'cursor-pointer',
              getAnimationClass(item.delay)
            )}
            onClick={isClickable ? item.onClick : undefined}
          >
            {/* Corner tag para cards clicáveis */}
            {index === 0 && (
              <div className="neo-sticker neo-sticker-top-right bg-blue-400">
                AGORA
              </div>
            )}

            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 p-0">
              <ShadcnTooltip delayDuration={300}>
                <TooltipTrigger asChild>
                  <CardTitle className="text-xs sm:text-sm font-black flex items-center gap-1.5 cursor-help text-black dark:text-white uppercase tracking-tight">
                    {item.title}
                    <Info className="h-3 w-3 text-muted-foreground" />
                  </CardTitle>
                </TooltipTrigger>
                <TooltipContent className="max-w-sm text-xs border-4 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-none bg-white dark:bg-zinc-900">
                  <p>{item.tooltip}</p>
                </TooltipContent>
              </ShadcnTooltip>

              <div className={cn(
                "neo-stat-icon-box",
                item.color === 'blue' && "bg-blue-300 dark:bg-blue-700",
                item.color === 'green' && "bg-green-300 dark:bg-green-700",
                item.color === 'purple' && "bg-purple-300 dark:bg-purple-700",
                item.color === 'teal' && "bg-teal-300 dark:bg-teal-700",
              )}>
                <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-black dark:text-white" strokeWidth={2.5} />
              </div>
            </CardHeader>

            <CardContent className="p-0 pt-4">
              <div className="flex items-baseline justify-between">
                <div className="text-3xl sm:text-4xl font-black text-black dark:text-white">
                  {item.value}
                </div>
                <DeltaBadge value={item.delta} invertColor={item.title === 'Tempo Médio de Uso'} />
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground mt-2 font-bold font-mono uppercase tracking-wide">
                {item.description}
              </p>
              {item.title === 'Taxa de Devolução' && (
                <div className="flex items-center gap-2 mt-3 p-1.5 border-4 border-black dark:border-white bg-gray-100 dark:bg-zinc-800">
                  <Progress
                    value={completionRate}
                    className={cn(
                      "h-3 w-full bg-transparent rounded-none",
                      "[&>div]:bg-black dark:[&>div]:bg-white [&>div]:rounded-none"
                    )}
                  />
                </div>
              )}
            </CardContent>
          </div>
        );
      })}
    </TooltipProvider>
  );
};