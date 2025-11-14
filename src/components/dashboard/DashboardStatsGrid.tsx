import React, { useState } from "react";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Computer, TrendingUp, Info, Clock, Activity, CheckCircle, RotateCcw } from "lucide-react";
import { Tooltip as ShadcnTooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { GlassCard } from "@/components/ui/GlassCard";
import { cn } from '@/lib/utils';
import type { LoanHistoryItem, Chromebook } from "@/types/database";
import type { useDashboardData } from '@/hooks/useDashboardData'; // Importando tipos necessários

// Tipos para o estado do modal (simplificado, pois o modal está no layout)
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
  
  // Desestruturação segura, usando valores padrão se stats for null/undefined
  const { 
    totalActive = 0, 
    totalChromebooks = 0, 
    availableChromebooks = 0, 
    averageUsageTime = 0, 
    completionRate = 0, 
    filteredLoans = [], 
    filteredReturns = [], 
  } = stats || {};

  // Função para determinar se o empréstimo está em atraso
  const isOverdue = (loan: LoanHistoryItem) => {
    return loan.expected_return_date && new Date(loan.expected_return_date) < new Date();
  };
  
  const getAnimationClass = (delay: number) => 
    isMounted ? `animate-fadeIn animation-delay-${delay}` : 'opacity-0';

  // Dados para os cards
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
      onClick: () => {}, // Não clicável
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
      onClick: () => {}, // Não clicável
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
          <GlassCard 
            key={index}
            className={cn(
              "border-white/30 transition-all duration-300 border-l-4 p-4", 
              "hover:shadow-lg hover:scale-[1.02]",
              isClickable ? 'cursor-pointer' : 'cursor-default',
              `border-l-${item.color}-500`, // Border-left color
              getAnimationClass(item.delay)
            )}
            onClick={isClickable ? item.onClick : undefined}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0">
              <ShadcnTooltip delayDuration={300}>
                <TooltipTrigger asChild>
                  <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-1 cursor-help">
                    {item.title}
                    <Info className="h-3 w-3 text-muted-foreground" />
                  </CardTitle>
                </TooltipTrigger>
                <TooltipContent className="max-w-sm text-xs">
                  <p>{item.tooltip}</p>
                </TooltipContent>
              </ShadcnTooltip>
              <Icon className={cn("h-4 w-4 sm:h-5 sm:w-5", `text-${item.color}-500 dark:text-${item.color}-400`)} />
            </CardHeader>
            <CardContent className="p-0 pt-2">
              <div className={cn("text-2xl sm:text-3xl font-bold bg-clip-text text-transparent", `bg-gradient-to-r ${item.gradient}`)}>
                {item.value}
              </div>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                {item.description}
              </p>
              {item.title === 'Taxa de Devolução' && (
                <div className="flex items-center gap-2 mt-1">
                  <Progress value={completionRate} className="h-1.5 sm:h-2" />
                </div>
              )}
            </CardContent>
          </GlassCard>
        );
      })}
    </TooltipProvider>
  );
};