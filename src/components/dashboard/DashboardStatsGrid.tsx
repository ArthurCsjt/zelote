import React, { useState } from "react";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Computer, TrendingUp, Info, Clock, Activity } from "lucide-react";
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

  return (
    <TooltipProvider>
      {/* Grid principal com 4 colunas em telas grandes */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4 relative z-10">
        
        {/* CARD 1: Empréstimos Ativos (Contagem de ativos) */}
        <GlassCard 
          className={cn("border-white/30 hover:shadow-lg transition-all duration-300 hover:scale-105 border-l-4 border-l-blue-500 cursor-pointer p-4", getAnimationClass(200))}
          onClick={() => onCardClick('Empréstimos Ativos', 'Lista de todos os Chromebooks atualmente emprestados.', 'loans', history.filter((loan: LoanHistoryItem) => !loan.return_date).map((loan: LoanHistoryItem) => ({
            id: loan.id,
            chromebook_id: loan.chromebook_id,
            model: loan.chromebook_model,
            loan_date: loan.loan_date,
            expected_return_date: loan.expected_return_date,
            student_name: loan.student_name,
            isOverdue: isOverdue(loan),
          })))}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0">
            <ShadcnTooltip delayDuration={300}>
              <TooltipTrigger asChild>
                <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-1 cursor-help">
                  Empréstimos Ativos
                  <Info className="h-3 w-3 text-muted-foreground" />
                </CardTitle>
              </TooltipTrigger>
              <TooltipContent className="max-w-sm text-xs">
                <p>Número de Chromebooks atualmente emprestados (status 'emprestado'). Clique para ver a lista.</p>
              </TooltipContent>
            </ShadcnTooltip>
            <Computer className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500 dark:text-blue-400" />
          </CardHeader>
          <CardContent className="p-0 pt-2">
            {/* Ajuste de tamanho de fonte para o valor principal */}
            <div className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">{totalActive}</div>
            {/* Ajuste de tamanho de fonte para a descrição */}
            <p className="text-[9px] sm:text-xs text-muted-foreground mt-1">
              {filteredLoans.length} empréstimos no período
            </p>
          </CardContent>
        </GlassCard>

        {/* CARD 2: Disponíveis (Clicável para ver a lista) */}
        <GlassCard 
          className={cn("border-white/30 hover:shadow-lg transition-all duration-300 hover:scale-105 border-l-4 border-l-green-500 cursor-pointer p-4", getAnimationClass(300))}
          onClick={() => onCardClick('Disponíveis', 'Lista de Chromebooks prontos para empréstimo.', 'chromebooks', null, 'disponivel')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0">
            <ShadcnTooltip delayDuration={300}>
              <TooltipTrigger asChild>
                <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-1 cursor-help">
                  Disponíveis
                  <Info className="h-3 w-3 text-muted-foreground" />
                </CardTitle>
              </TooltipTrigger>
              <TooltipContent className="max-w-sm text-xs">
                <p>Número de Chromebooks com status 'disponível' no inventário. Clique para ver a lista.</p>
              </TooltipContent>
            </ShadcnTooltip>
            <Computer className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 dark:text-green-400" />
          </CardHeader>
          <CardContent className="p-0 pt-2">
            {/* Ajuste de tamanho de fonte para o valor principal */}
            <div className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">{availableChromebooks}</div>
            {/* Ajuste de tamanho de fonte para a descrição */}
            <p className="text-[9px] sm:text-xs text-muted-foreground mt-1">
              de {totalChromebooks} no total
            </p>
          </CardContent>
        </GlassCard>
        
        {/* CARD 3: Tempo Médio (Não Clicável - Métrica de cálculo) */}
        <GlassCard className={cn("border-white/30 hover:shadow-lg transition-all duration-300 hover:scale-105 border-l-4 border-l-purple-500 p-4", getAnimationClass(400))}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0">
            <ShadcnTooltip delayDuration={300}>
              <TooltipTrigger asChild>
                <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-1 cursor-help">
                  Tempo Médio de Uso
                  <Info className="h-3 w-3 text-muted-foreground" />
                </CardTitle>
              </TooltipTrigger>
              <TooltipContent className="max-w-sm text-xs">
                <p>Duração média (em minutos) dos empréstimos que foram devolvidos no período selecionado.</p>
              </TooltipContent>
            </ShadcnTooltip>
            <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500 dark:text-purple-400" />
          </CardHeader>
          <CardContent className="p-0 pt-2">
            {/* Ajuste de tamanho de fonte para o valor principal */}
            <div className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent">
              {Math.round(averageUsageTime)} min
            </div>
            {/* Ajuste de tamanho de fonte para a descrição */}
            <p className="text-[9px] sm:text-xs text-muted-foreground mt-1">
              média no período
            </p>
          </CardContent>
        </GlassCard>

        {/* CARD 4: Taxa de Devolução (Linha 2) */}
        <GlassCard className={cn("border-white/30 hover:shadow-lg transition-all duration-300 hover:scale-105 border-l-4 border-l-teal-500 p-4", getAnimationClass(500))}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0">
            <ShadcnTooltip delayDuration={300}>
              <TooltipTrigger asChild>
                <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-1 cursor-help">
                  Taxa de Devolução
                  <Info className="h-3 w-3 text-muted-foreground" />
                </CardTitle>
              </TooltipTrigger>
              <TooltipContent className="max-w-sm text-xs">
                <p>Porcentagem de empréstimos realizados no período que já foram devolvidos.</p>
              </TooltipContent>
            </ShadcnTooltip>
            <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-teal-500 dark:text-teal-400" />
          </CardHeader>
          <CardContent className="p-0 pt-2">
            {/* Ajuste de tamanho de fonte para o valor principal */}
            <div className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
              {completionRate.toFixed(0)}%
            </div>
            <div className="flex items-center gap-2 mt-1">
              <Progress value={completionRate} className="h-1.5 sm:h-2" />
              {/* Ajuste de tamanho de fonte para a descrição */}
              <span className="text-[9px] sm:text-xs text-muted-foreground">
                {filteredReturns.length} de {filteredLoans.length}
              </span>
            </div>
          </CardContent>
        </GlassCard>
      </div>
    </TooltipProvider>
  );
};