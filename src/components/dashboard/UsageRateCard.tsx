import React from "react";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Info, TrendingUp, Activity } from "lucide-react";
import { Tooltip as ShadcnTooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { GlassCard } from "@/components/ui/GlassCard";
import { cn } from '@/lib/utils';
import type { useDashboardData } from '@/hooks/useDashboardData';

interface UsageRateCardProps {
  stats: ReturnType<typeof useDashboardData>['stats'];
  isMounted: boolean;
}

export const UsageRateCard: React.FC<UsageRateCardProps> = ({ stats, isMounted }) => {
  const {
    totalActive = 0,
    totalChromebooks = 0,
    totalInventoryUsageRate = 0,
    usageRateColor = 'green',
    maxOccupancyRate = 0,
    occupancyRateColor = 'green',
  } = stats || {};

  const getColorClasses = (color: 'green' | 'yellow' | 'red') => {
    switch (color) {
      case 'green': return {
        text: 'text-green-700 dark:text-green-400',
        border: 'border-green-600',
        gradient: 'from-green-600 to-emerald-600',
        bg: 'from-green-500/10 to-emerald-500/5 dark:from-green-500/5 dark:to-emerald-500/0'
      };
      case 'yellow': return {
        text: 'text-amber-700 dark:text-amber-400',
        border: 'border-amber-600',
        gradient: 'from-amber-600 to-orange-600',
        bg: 'from-amber-500/10 to-orange-500/5 dark:from-amber-500/5 dark:to-orange-500/0'
      };
      case 'red': return {
        text: 'text-red-700 dark:text-red-400',
        border: 'border-red-600',
        gradient: 'from-red-600 to-red-800',
        bg: 'from-red-500/10 to-red-500/5 dark:from-red-500/5 dark:to-red-500/0'
      };
      default: return {
        text: 'text-gray-700 dark:text-gray-400',
        border: 'border-gray-600',
        gradient: 'from-gray-600 to-gray-800',
        bg: 'from-gray-500/10 to-gray-500/5 dark:from-gray-500/5 dark:to-gray-500/0'
      };
    }
  };

  const usageColors = getColorClasses(usageRateColor);
  const picoColors = getColorClasses(occupancyRateColor);

  const getAnimationClass = isMounted ? 'animate-fadeIn animation-delay-0' : 'opacity-0';

  return (
    <TooltipProvider>
      <GlassCard className={cn(
        "relative overflow-hidden border-2 border-gray-300 dark:border-border/40",
        "bg-white dark:bg-card/50",
        "hover:shadow-2xl transition-all duration-300 border-l-4 p-6 md:p-8",
        "md:col-span-4 lg:col-span-4",
        `border-l-primary`,
        getAnimationClass
      )}>
        {/* Background decorativo */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/3 rounded-full blur-3xl -z-10" />

        <div className="relative z-10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-6 p-0">
            <div className="flex items-center gap-4">
              {/* Ícone grande e animado */}
              <div className="inline-flex p-4 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 dark:from-primary/10 dark:to-primary/5 border-2 border-primary/30">
                <Activity className="h-8 w-8 text-primary animate-pulse" />
              </div>

              <div>
                <CardTitle className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
                  Análise de Demanda de Equipamentos
                </CardTitle>
                <p className="text-sm text-gray-600 dark:text-muted-foreground mt-1 font-medium">
                  Monitoramento em tempo real e histórico
                </p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0 pt-6 grid grid-cols-1 md:grid-cols-2 gap-8 border-t-2 border-gray-200 dark:border-border/50">

            {/* METRICA 1: TEMPO REAL */}
            <div className={cn(
              "space-y-4 p-6 rounded-2xl border-2 transition-all duration-300",
              "bg-gradient-to-br",
              usageColors.bg,
              "border-gray-200 dark:border-border/40",
              "hover:shadow-lg hover:scale-[1.02]"
            )}>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase text-gray-700 dark:text-muted-foreground flex items-center gap-2">
                  Uso Atual (Tempo Real)
                  <ShadcnTooltip delayDuration={300}>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs text-xs">
                      <p>Porcentagem de equipamentos móveis que estão atualmente emprestados.</p>
                    </TooltipContent>
                  </ShadcnTooltip>
                </h3>
                <div className={cn(
                  "p-3 rounded-xl bg-gradient-to-br",
                  usageColors.bg
                )}>
                  <Activity className={cn("h-7 w-7", usageColors.text)} />
                </div>
              </div>

              <div className="flex items-baseline gap-3">
                <div className={cn(
                  "text-6xl md:text-7xl font-black bg-clip-text text-transparent",
                  `bg-gradient-to-r ${usageColors.gradient}`
                )}>
                  {totalInventoryUsageRate.toFixed(0)}%
                </div>
              </div>

              <div className="relative">
                <Progress
                  value={totalInventoryUsageRate}
                  className="h-4 bg-gray-200 dark:bg-gray-800 rounded-full shadow-inner"
                  indicatorClassName={cn(
                    "transition-all duration-1000 rounded-full relative overflow-hidden",
                    `bg-gradient-to-r ${usageColors.gradient}`
                  )}
                />
                {/* Efeito de brilho na barra */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
              </div>

              <p className="text-sm text-gray-700 dark:text-muted-foreground font-semibold">
                <span className="text-2xl font-black text-gray-900 dark:text-foreground">{totalActive}</span>
                <span className="text-gray-600 dark:text-muted-foreground"> de </span>
                <span className="text-2xl font-black text-gray-900 dark:text-foreground">{totalChromebooks}</span>
                <span className="text-gray-600 dark:text-muted-foreground"> equipamentos em uso</span>
              </p>
            </div>

            {/* METRICA 2: PICO NO PERÍODO */}
            <div className={cn(
              "space-y-4 p-6 rounded-2xl border-2 transition-all duration-300",
              "bg-gradient-to-br",
              picoColors.bg,
              "border-gray-200 dark:border-border/40",
              "hover:shadow-lg hover:scale-[1.02]"
            )}>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase text-gray-700 dark:text-muted-foreground flex items-center gap-2">
                  Pico de Demanda (Período)
                  <ShadcnTooltip delayDuration={300}>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs text-xs">
                      <p>O pico de uso (em %) atingido durante o período e horário selecionados no filtro.</p>
                    </TooltipContent>
                  </ShadcnTooltip>
                </h3>
                <div className={cn(
                  "p-3 rounded-xl bg-gradient-to-br",
                  picoColors.bg
                )}>
                  <TrendingUp className={cn("h-7 w-7", picoColors.text)} />
                </div>
              </div>

              <div className="flex items-baseline gap-3">
                <div className={cn(
                  "text-6xl md:text-7xl font-black bg-clip-text text-transparent",
                  `bg-gradient-to-r ${picoColors.gradient}`
                )}>
                  {maxOccupancyRate.toFixed(0)}%
                </div>
              </div>

              <div className="relative">
                <Progress
                  value={maxOccupancyRate}
                  className="h-4 bg-gray-200 dark:bg-gray-800 rounded-full shadow-inner"
                  indicatorClassName={cn(
                    "transition-all duration-1000 rounded-full relative overflow-hidden",
                    `bg-gradient-to-r ${picoColors.gradient}`
                  )}
                />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
              </div>

              <p className="text-sm text-gray-700 dark:text-muted-foreground font-semibold">
                Máximo de
                <span className="text-2xl font-black text-gray-900 dark:text-foreground mx-1">
                  {Math.round(totalChromebooks * maxOccupancyRate / 100)}
                </span>
                equipamentos simultâneos
              </p>
            </div>
          </CardContent>
        </div>
      </GlassCard>
    </TooltipProvider>
  );
};