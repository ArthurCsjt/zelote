import React from "react";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Info, TrendingUp, Activity } from "lucide-react";
import { Tooltip as ShadcnTooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
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
        bg: 'bg-green-300 dark:bg-green-800',
        text: 'text-black dark:text-white'
      };
      case 'yellow': return {
        bg: 'bg-yellow-300 dark:bg-yellow-800',
        text: 'text-black dark:text-white'
      };
      case 'red': return {
        bg: 'bg-red-300 dark:bg-red-800',
        text: 'text-black dark:text-white'
      };
      default: return {
        bg: 'bg-gray-300 dark:bg-gray-800',
        text: 'text-black dark:text-white'
      };
    }
  };

  const usageColors = getColorClasses(usageRateColor);
  const picoColors = getColorClasses(occupancyRateColor);

  const getAnimationClass = isMounted ? 'animate-fadeIn animation-delay-0' : 'opacity-0';

  const DeltaIndicator = ({ value, label }: { value?: number, label?: string }) => {
    if (value === undefined || value === 0) return null;
    const isPositive = value > 0;
    return (
      <div className={cn(
        "inline-flex items-center gap-1 px-1.5 py-0.5 border-2 border-black text-[9px] font-black uppercase",
        isPositive ? "bg-red-200 text-red-700" : "bg-green-200 text-green-700"
      )}>
        {isPositive ? "↑" : "↓"} {Math.abs(value).toFixed(0)}%
        {label && <span className="opacity-60 ml-1">{label}</span>}
      </div>
    );
  };

  return (
    <TooltipProvider>
      <div className={cn(
        "relative transition-all duration-300 border-4 border-black dark:border-white p-6 md:p-8",
        "bg-white dark:bg-zinc-950 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.2)]",
        "md:col-span-4 lg:col-span-4",
        "rounded-none", // Brutalist
        getAnimationClass
      )}>

        <div className="relative z-10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-6 p-0">
            <div className="flex items-center gap-4">
              {/* Ícone com borda grossa */}
              <div className="inline-flex p-3 bg-white dark:bg-black border-2 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
                <Activity className="h-8 w-8 text-black dark:text-white" />
              </div>

              <div>
                <CardTitle className="text-2xl md:text-3xl font-black text-black dark:text-white uppercase tracking-tight">
                  ANÁLISE DE DEMANDA
                </CardTitle>
                <p className="text-sm text-black dark:text-white font-mono bg-yellow-200 dark:bg-yellow-900 inline-block px-2 py-1 border-2 border-black dark:border-white mt-2 font-bold">
                  TEMPO REAL & HISTÓRICO
                </p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0 pt-6 grid grid-cols-1 md:grid-cols-2 gap-8 border-t-4 border-black dark:border-white mt-2">

            {/* METRICA 1: MONITOR DE CARGA (TEMPO REAL) */}
            <div className={cn(
              "space-y-4 p-6 border-2 border-black dark:border-white transition-all duration-300",
              "bg-white dark:bg-zinc-900",
              "hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
            )}>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black uppercase text-black dark:text-white flex items-center gap-2">
                  MONITOR DE CARGA
                  <ShadcnTooltip delayDuration={300}>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 cursor-help text-black dark:text-white" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs text-xs border-2 border-black rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                      <p>Visualização instantânea da carga de empréstimos em relação ao total de equipamentos móveis.</p>
                    </TooltipContent>
                  </ShadcnTooltip>
                </h3>
                <div className={cn(
                  "p-2 border-2 border-black dark:border-white",
                  usageColors.bg
                )}>
                  <Activity className="h-6 w-6 text-black dark:text-white" />
                </div>
              </div>

              <div className="flex items-baseline gap-3">
                <div className="text-6xl md:text-7xl font-black text-black dark:text-white">
                  {totalInventoryUsageRate.toFixed(0)}%
                </div>
                <div className="flex flex-col gap-1">
                  <div className="text-xs font-black uppercase text-muted-foreground">Em Uso</div>
                  <DeltaIndicator value={stats?.deltas?.loanVolume} label="Vol" />
                </div>
              </div>

              <div className="relative border-2 border-black dark:border-white p-1">
                <div className="h-6 bg-gray-100 dark:bg-zinc-800 w-full absolute inset-0 m-1" />
                <div
                  className={cn("relative h-6 transition-all duration-500 border-r-2 border-black dark:border-white", usageColors.bg)}
                  style={{ width: `${Math.max(5, totalInventoryUsageRate)}%` }}
                />
              </div>

              <div className="flex justify-between items-center mt-2">
                <p className="text-sm text-black dark:text-white font-mono font-bold">
                  {totalActive}/{totalChromebooks} EQUIPAMENTOS
                </p>
                <div className="text-[10px] bg-black text-white px-2 py-0.5 font-black uppercase">Instantâneo</div>
              </div>
            </div>

            {/* METRICA 2: ANÁLISE DE DISPONIBILIDADE (CAPACIDADE RESERVA) */}
            <div className={cn(
              "space-y-4 p-6 border-2 border-black dark:border-white transition-all duration-300",
              "bg-zinc-50 dark:bg-zinc-950",
              "hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
            )}>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black uppercase text-black dark:text-white flex items-center gap-2">
                  DISPONIBILIDADE
                  <ShadcnTooltip delayDuration={300}>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 cursor-help text-black dark:text-white" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs text-xs border-2 border-black rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                      <p>Equipamentos que ainda estão disponíveis para novos empréstimos neste momento.</p>
                    </TooltipContent>
                  </ShadcnTooltip>
                </h3>
                <div className="p-2 border-2 border-black dark:border-white bg-blue-300 dark:bg-blue-800">
                  <TrendingUp className="h-6 w-6 text-black dark:text-white" />
                </div>
              </div>

              <div className="flex items-baseline gap-3">
                <div className="text-6xl md:text-7xl font-black text-blue-600 dark:text-blue-400">
                  {stats?.reserveRate ? stats.reserveRate.toFixed(0) : (100 - totalInventoryUsageRate).toFixed(0)}%
                </div>
                <div className="text-xs font-black uppercase text-blue-600 dark:text-blue-400">Reserva</div>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-2">
                <div className="border-2 border-black p-2 bg-white dark:bg-zinc-900">
                  <p className="text-[10px] font-black uppercase opacity-60">Disponível</p>
                  <p className="text-xl font-black">{stats?.availableMovable || (totalChromebooks - totalActive)}</p>
                </div>
                <div className="border-2 border-black p-2 bg-white dark:bg-zinc-900 relative">
                  <p className="text-[10px] font-black uppercase opacity-60">Pico Período</p>
                  <div className="flex items-baseline justify-between">
                    <p className="text-xl font-black">{maxOccupancyRate.toFixed(0)}%</p>
                    <DeltaIndicator value={stats?.deltas?.maxOccupancy} />
                  </div>
                </div>
              </div>

              <p className="text-[10px] text-black dark:text-white font-bold mt-2 uppercase flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                Capacidade ociosa pronta para uso
              </p>
            </div>
          </CardContent>
        </div>
      </div>
    </TooltipProvider>
  );
};