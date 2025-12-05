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
    filteredLoans = [],
    filteredReturns = [],
  } = stats || {};

  const isOverdue = (loan: LoanHistoryItem) => {
    return loan.expected_return_date && new Date(loan.expected_return_date) < new Date();
  };

  const getAnimationClass = (delay: number) =>
    isMounted ? `animate-fadeIn animation-delay-${delay}` : 'opacity-0';

  const cardData = [
    {
      title: 'Empréstimos Ativos',
      value: totalActive,
      description: `${filteredLoans.length} empréstimos no período`,
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
              "relative transition-all duration-200 p-4 border-2 border-black dark:border-white",
              "bg-white dark:bg-zinc-900 rounded-none", // Brutalism often uses sharp corners
              "shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)]",
              isClickable ? 'cursor-pointer hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[4px] active:translate-y-[4px]' : '',
              getAnimationClass(item.delay)
            )}
            onClick={isClickable ? item.onClick : undefined}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 p-0">
              <ShadcnTooltip delayDuration={300}>
                <TooltipTrigger asChild>
                  <CardTitle className="text-xs sm:text-sm font-bold flex items-center gap-1.5 cursor-help text-black dark:text-white uppercase tracking-tight">
                    {item.title}
                    <Info className="h-3 w-3 text-gray-500" />
                  </CardTitle>
                </TooltipTrigger>
                <TooltipContent className="max-w-sm text-xs border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] rounded-none">
                  <p>{item.tooltip}</p>
                </TooltipContent>
              </ShadcnTooltip>

              <div className={cn(
                "p-2 border-2 border-black dark:border-white",
                item.color === 'blue' && "bg-blue-300 dark:bg-blue-800",
                item.color === 'green' && "bg-green-300 dark:bg-green-800",
                item.color === 'purple' && "bg-purple-300 dark:bg-purple-800",
                item.color === 'teal' && "bg-teal-300 dark:bg-teal-800",
              )}>
                <Icon className={cn(
                  "h-5 w-5 sm:h-6 sm:w-6 text-black dark:text-white"
                )} />
              </div>
            </CardHeader>

            <CardContent className="p-0 pt-4">
              <div className="text-3xl sm:text-4xl font-black text-black dark:text-white">
                {item.value}
              </div>
              <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 mt-2 font-bold font-mono">
                {item.description}
              </p>
              {item.title === 'Taxa de Devolução' && (
                <div className="flex items-center gap-2 mt-3 p-1 border-2 border-black dark:border-white bg-gray-100 dark:bg-zinc-800">
                  <Progress
                    value={completionRate}
                    className={cn(
                      "h-2 w-full bg-transparent rounded-none",
                      "[&>div]:bg-black dark:[&>div]:bg-white [&>div]:rounded-none" // Hard progress bar
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