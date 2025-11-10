import React from "react";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Info, Waves, TrendingUp, Activity } from "lucide-react"; // Adicionado Activity
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
      case 'green': return { text: 'text-green-600 dark:text-green-400', border: 'border-green-500', gradient: 'from-green-600 to-emerald-600' };
      case 'yellow': return { text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-500', gradient: 'from-amber-600 to-orange-600' };
      case 'red': return { text: 'text-red-600 dark:text-red-400', border: 'border-red-500', gradient: 'from-red-600 to-red-800' };
      default: return { text: 'text-gray-600 dark:text-gray-400', border: 'border-gray-500', gradient: 'from-gray-600 to-gray-800' };
    }
  };
  
  const usageColors = getColorClasses(usageRateColor);
  const picoColors = getColorClasses(occupancyRateColor);

  const getAnimationClass = isMounted ? 'animate-fadeIn animation-delay-0' : 'opacity-0';

  return (
    <TooltipProvider>
      <GlassCard className={cn(
        "border-white/30 hover:shadow-lg transition-all duration-300 border-l-4 p-6", 
        "md:col-span-4 lg:col-span-4", // Ocupa a largura total
        "bg-gradient-to-br from-background-secondary/50 to-card/50", // Fundo sutil
        getAnimationClass
      )}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 p-0">
          <CardTitle className="text-xl font-bold text-foreground flex items-center gap-2">
            <Waves className="h-6 w-6 text-primary" />
            Análise de Demanda de Equipamentos
          </CardTitle>
        </CardHeader>
        
        <CardContent className="p-0 pt-4 grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-border/50">
          
          {/* METRICA 1: TEMPO REAL */}
          <div className="space-y-3 md:pr-6 border-r border-border/50"> {/* Mantendo a borda para separação visual clara */}
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase text-muted-foreground flex items-center gap-1">
                Uso Atual (Tempo Real)
                <ShadcnTooltip delayDuration={300}>
                  <TooltipTrigger asChild>
                    <Info className="h-3 w-3 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs text-xs">
                    <p>Porcentagem de equipamentos móveis que estão atualmente emprestados.</p>
                  </TooltipContent>
                </ShadcnTooltip>
              </h3>
              {/* Ícone alterado para Activity */}
              <Activity className={cn("h-6 w-6", usageColors.text)} /> 
            </div>
            
            <div className="flex items-baseline gap-2">
              <div className={cn("text-5xl font-extrabold bg-clip-text text-transparent", `bg-gradient-to-r ${usageColors.gradient}`)}>
                {totalInventoryUsageRate.toFixed(0)}%
              </div>
              <span className="text-lg font-semibold text-muted-foreground">
                ({totalActive} de {totalChromebooks} em uso)
              </span>
            </div>
            
            <Progress 
              value={totalInventoryUsageRate} 
              className="h-3 mt-2 bg-gray-200 dark:bg-gray-700" 
              indicatorClassName={cn("transition-all duration-1000", `bg-gradient-to-r ${usageColors.gradient}`)}
            />
            <p className="text-xs text-muted-foreground mt-2">
              {totalActive} de {totalChromebooks} equipamentos móveis em uso.
            </p>
          </div>

          {/* METRICA 2: PICO NO PERÍODO */}
          <div className="space-y-3 md:pl-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase text-muted-foreground flex items-center gap-1">
                Pico de Demanda (Período Filtrado)
                <ShadcnTooltip delayDuration={300}>
                  <TooltipTrigger asChild>
                    <Info className="h-3 w-3 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs text-xs">
                    <p>O pico de uso (em %) atingido durante o período e horário selecionados no filtro.</p>
                  </TooltipContent>
                </ShadcnTooltip>
              </h3>
              <TrendingUp className={cn("h-6 w-6", picoColors.text)} />
            </div>
            
            <div className="flex items-baseline gap-2">
              <div className={cn("text-5xl font-extrabold bg-clip-text text-transparent", `bg-gradient-to-r ${picoColors.gradient}`)}>
                {maxOccupancyRate.toFixed(0)}%
              </div>
              <span className="text-lg font-semibold text-muted-foreground">
                (Máximo de {Math.round(totalChromebooks * maxOccupancyRate / 100)} em uso)
              </span>
            </div>
            
            <Progress 
              value={maxOccupancyRate} 
              className="h-3 mt-2 bg-gray-200 dark:bg-gray-700" 
              indicatorClassName={cn("transition-all duration-1000", `bg-gradient-to-r ${picoColors.gradient}`)}
            />
            <p className="text-xs text-muted-foreground mt-2">
              Indica o momento de maior demanda no intervalo de tempo selecionado.
            </p>
          </div>
        </CardContent>
      </GlassCard>
    </TooltipProvider>
  );
};