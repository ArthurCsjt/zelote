import React, { useState } from "react";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Computer, TrendingUp, Info, Clock, Waves, AlertTriangle, Activity } from "lucide-react";
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
    totalInventoryUsageRate = 0, 
    usageRateColor = 'green', 
    availableChromebooks = 0, 
    averageUsageTime = 0, 
    completionRate = 0, 
    maxOccupancyRate = 0,
    occupancyRateColor = 'green',
    filteredLoans = [], 
    filteredReturns = [], 
  } = stats || {};

  // Função para determinar se o empréstimo está em atraso
  const isOverdue = (loan: LoanHistoryItem) => {
    return loan.expected_return_date && new Date(loan.expected_return_date) < new Date();
  };
  
  const getColorClasses = (color: 'green' | 'yellow' | 'red') => {
    switch (color) {
      case 'green': return { text: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-950/50', border: 'border-green-500', gradient: 'from-green-600 to-emerald-600' };
      case 'yellow': return { text: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/50', border: 'border-amber-500', gradient: 'from-amber-600 to-orange-600' };
      case 'red': return { text: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-950/50', border: 'border-red-500', gradient: 'from-red-600 to-red-800' };
      default: return { text: 'text-gray-600 dark:text-gray-400', bg: 'bg-gray-50 dark:bg-gray-950/50', border: 'border-gray-500', gradient: 'from-gray-600 to-gray-800' };
    }
  };
  
  const usageColors = getColorClasses(usageRateColor);
  const picoColors = getColorClasses(occupancyRateColor);

  const getAnimationClass = (delay: number) => 
    isMounted ? `animate-fadeIn animation-delay-${delay}` : 'opacity-0';

  return (
    <TooltipProvider>
      {/* Grid principal com 4 colunas em telas grandes */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-4 relative z-10">
        
        {/* CARD 1: TAXA DE USO (Neste Instante) - DESTAQUE */}
        <GlassCard className={cn("border-white/30 hover:shadow-lg transition-all duration-300 hover:scale-[1.02] border-l-4 md:col-span-2 p-6", usageColors.border.replace('border-', 'border-l-'), getAnimationClass(0))}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0">
            <ShadcnTooltip delayDuration={300}>
              <TooltipTrigger asChild>
                <CardTitle className="text-base font-bold flex items-center gap-1 cursor-help text-gray-700 dark:text-gray-300">
                  TAXA DE USO (Tempo Real)
                  <Info className="h-4 w-4 text-muted-foreground" />
                </CardTitle>
              </TooltipTrigger>
              <TooltipContent className="max-w-sm text-xs">
                <p>Porcentagem de equipamentos móveis (não fixos) que estão atualmente emprestados.</p>
              </TooltipContent>
            </ShadcnTooltip>
            <Waves className={cn("h-6 w-6 sm:h-8 sm:w-8 animate-pulse", usageColors.text)} />
          </CardHeader>
          <CardContent className="p-0 pt-2">
            <div className={cn("text-4xl sm:text-6xl font-extrabold bg-clip-text text-transparent", `bg-gradient-to-r ${usageColors.gradient}`)}>
              {totalInventoryUsageRate.toFixed(0)}%
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Uso atual do inventário móvel
            </p>
          </CardContent>
        </GlassCard>

        {/* CARD 2: TAXA DE USO (Pico no Período) - DESTAQUE */}
        <GlassCard className={cn("border-white/30 hover:shadow-lg transition-all duration-300 hover:scale-[1.02] border-l-4 md:col-span-2 p-6", picoColors.border.replace('border-', 'border-l-'), getAnimationClass(100))}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0">
            <ShadcnTooltip delayDuration={300}>
              <TooltipTrigger asChild>
                <CardTitle className="text-base font-bold flex items-center gap-1 cursor-help text-gray-700 dark:text-gray-300">
                  TAXA DE USO (Pico no Período)
                  <Info className="h-4 w-4 text-muted-foreground" />
                </CardTitle>
              </TooltipTrigger>
              <TooltipContent className="max-w-sm text-xs">
                <p>O pico de uso (em %) atingido durante o período e horário selecionados no filtro.</p>
              </TooltipContent>
            </ShadcnTooltip>
            <TrendingUp className={cn("h-6 w-6 sm:h-8 sm:w-8", picoColors.text)} />
          </CardHeader>
          <CardContent className="p-0 pt-2">
            <div className={cn("text-4xl sm:text-6xl font-extrabold bg-clip-text text-transparent", `bg-gradient-to-r ${picoColors.gradient}`)}>
              {maxOccupancyRate.toFixed(0)}%
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Pico de uso no período filtrado
            </p>
          </CardContent>
        </GlassCard>
        
        {/* LINHA 2: Cards Menores (4 colunas em md) */}
        
        {/* CARD 3: Empréstimos Ativos (Contagem de ativos) */}
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
            <div className="text-xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">{totalActive}</div>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
              {filteredLoans.length} empréstimos no período
            </p>
          </CardContent>
        </GlassCard>

        {/* CARD 4: Disponíveis (Clicável para ver a lista) */}
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
            <div className="text-xl sm:text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">{availableChromebooks}</div>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
              de {totalChromebooks} no total
            </p>
          </CardContent>
        </GlassCard>
        
        {/* CARD 5: Tempo Médio (Não Clicável - Métrica de cálculo) */}
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
            <div className="text-xl sm:text-3xl font-bold bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent">
              {Math.round(averageUsageTime)} min
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
              média no período
            </p>
          </CardContent>
        </GlassCard>

        {/* CARD 6: Taxa de Devolução (Linha 2) */}
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
            <div className="text-xl sm:text-3xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
              {completionRate.toFixed(0)}%
            </div>
            <div className="flex items-center gap-2 mt-1">
              <Progress value={completionRate} className="h-1.5 sm:h-2" />
              <span className="text-[10px] sm:text-xs text-muted-foreground">
                {filteredReturns.length} de {filteredLoans.length}
              </span>
            </div>
          </CardContent>
        </GlassCard>
      </div>
    </TooltipProvider>
  );
};