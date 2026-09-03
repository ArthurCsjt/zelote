import React from "react";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Computer,
  TrendingUp,
  Info,
  Clock,
  Activity,
  CheckCircle,
  RotateCcw,
  School,
  AlertTriangle,
  Calendar,
  Wrench,
  Zap,
} from "lucide-react";
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
  onSelectTab?: (tab: 'overview' | 'fixed' | 'overdue') => void;
}

export const DashboardStatsGrid: React.FC<DashboardStatsGridProps> = ({
  stats,
  history,
  filteredLoans,
  filteredReturns,
  loading,
  isMounted,
  onCardClick,
  onSelectTab,
}) => {
  const {
    totalActive = 0,
    totalChromebooks = 0,
    availableChromebooks = 0,
    totalFixed = 0,
    fixedByClassroom = [],
    totalMaintenance = 0,
    overdueCount = 0,
    overdueLoans = [],
    todayReservationsCount = 0,
    todayChromebooksReserved = 0,
    averageUsageTime = 0,
    completionRate = 0,
    peakHour = null,
  } = stats || {};

  const isOverdue = (loan: LoanHistoryItem): boolean => {
    return !!(loan.expected_return_date && new Date(loan.expected_return_date) < new Date());
  };

  const getAnimationClass = (delay: number) =>
    isMounted ? `animate-fadeIn animation-delay-${delay}` : 'opacity-0';

  const DeltaBadge = ({ value, invertColor = false }: { value?: number, invertColor?: boolean }) => {
    if (value === undefined || value === 0) return null;
    const isIncrease = value > 0;
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
      title: 'Em Uso Agora',
      value: totalActive,
      description: `${filteredLoans.length} no período`,
      delta: stats?.deltas?.loanVolume,
      icon: Computer,
      color: 'amber',
      sticker: 'AO VIVO',
      onClick: () => onCardClick('Empréstimos Ativos', 'Lista de todos os Chromebooks atualmente emprestados.', 'loans', history.filter((loan: LoanHistoryItem) => !loan.return_date).map((loan: LoanHistoryItem) => ({
        id: loan.id,
        chromebook_id: loan.chromebook_id,
        model: loan.chromebook_model,
        loan_date: loan.loan_date,
        expected_return_date: loan.expected_return_date,
        student_name: loan.student_name,
        isOverdue: isOverdue(loan),
      }))),
      tooltip: 'Chromebooks móveis atualmente em posse de alunos ou professores.',
      delay: 100,
    },
    {
      title: 'Livres p/ Retirada',
      value: availableChromebooks,
      description: `de ${stats?.totalMovable || totalChromebooks} móveis`,
      icon: CheckCircle,
      color: 'green',
      onClick: () => onCardClick('Disponíveis', 'Lista de Chromebooks prontos para empréstimo no armário.', 'chromebooks', null, 'disponivel'),
      tooltip: 'Aparelhos móveis disponíveis no armário/carrinho prontos para saída.',
      delay: 150,
    },
    {
      title: 'Fixos em Sala',
      value: totalFixed,
      description: `${fixedByClassroom.length} salas mapeadas`,
      icon: School,
      color: 'blue',
      sticker: 'SALAS',
      onClick: () => onSelectTab ? onSelectTab('fixed') : onCardClick('Chromebooks Fixos', 'Equipamentos alocados permanentemente em salas de aula.', 'chromebooks', null, 'fixo'),
      tooltip: 'Chromebooks alocados permanentemente em salas de aula e laboratórios. Clique para ver o mapa de salas.',
      delay: 200,
    },
    {
      title: 'Atrasados',
      value: overdueCount,
      description: overdueCount > 0 ? `${overdueCount} pendente(s)` : 'Nenhum atraso',
      icon: AlertTriangle,
      color: overdueCount > 0 ? 'red' : 'emerald',
      sticker: overdueCount > 0 ? 'CRÍTICO' : undefined,
      pulse: overdueCount > 0,
      onClick: () => onSelectTab ? onSelectTab('overdue') : onCardClick('Empréstimos em Atraso', 'Lista de empréstimos com prazo vencido.', 'loans', overdueLoans.map(l => ({
        id: l.id,
        chromebook_id: l.chromebook_id,
        model: 'N/A',
        loan_date: l.loan_date,
        expected_return_date: l.expected_return_date,
        student_name: l.student_name,
        isOverdue: true,
      }))),
      tooltip: 'Empréstimos com prazo de devolução expirado. Clique para ver a lista de cobrança.',
      delay: 250,
    },
    {
      title: 'Reservas de Hoje',
      value: todayChromebooksReserved,
      description: `${todayReservationsCount} agendamento(s)`,
      icon: Calendar,
      color: 'purple',
      sticker: 'HOJE',
      onClick: () => { },
      tooltip: 'Total de Chromebooks solicitados por professores em reservas para hoje.',
      delay: 300,
    },
    {
      title: 'Em Manutenção',
      value: totalMaintenance,
      description: totalMaintenance > 0 ? 'Aparelhos parados' : 'Frota 100% íntegra',
      icon: Wrench,
      color: totalMaintenance > 0 ? 'orange' : 'gray',
      onClick: () => onCardClick('Equipamentos em Manutenção', 'Aparelhos fora de uso ou aguardando conserto.', 'chromebooks', null, 'fora_uso'),
      tooltip: 'Chromebooks com status fora de uso ou em manutenção pela equipe técnica.',
      delay: 350,
    },
  ];

  return (
    <TooltipProvider>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {cardData.map((item, index) => {
          const Icon = item.icon;
          const isClickable = !!item.onClick;

          return (
            <div
              key={index}
              className={cn(
                "neo-stat-card neo-pattern-dots relative overflow-visible flex flex-col justify-between p-3 sm:p-4 transition-transform hover:-translate-y-0.5",
                isClickable && 'cursor-pointer hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-y-0 active:shadow-none',
                item.pulse && 'border-red-600 dark:border-red-400 ring-2 ring-red-500/50',
                getAnimationClass(item.delay)
              )}
              onClick={isClickable ? item.onClick : undefined}
            >
              {/* Corner tag / Sticker */}
              {item.sticker && (
                <div className={cn(
                  "neo-sticker neo-sticker-top-right text-[9px] font-black",
                  item.sticker === 'CRÍTICO' && "bg-red-500 text-white animate-pulse",
                  item.sticker === 'AO VIVO' && "bg-amber-400 text-black",
                  item.sticker === 'SALAS' && "bg-blue-400 text-black",
                  item.sticker === 'HOJE' && "bg-purple-400 text-black",
                )}>
                  {item.sticker}
                </div>
              )}

              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0">
                <ShadcnTooltip delayDuration={300}>
                  <TooltipTrigger asChild>
                    <CardTitle className="text-[11px] sm:text-xs font-black flex items-center gap-1 cursor-help text-black dark:text-white uppercase tracking-tight truncate">
                      {item.title}
                      <Info className="h-3 w-3 text-muted-foreground shrink-0" />
                    </CardTitle>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-sm text-xs border-4 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-none bg-white dark:bg-zinc-900">
                    <p>{item.tooltip}</p>
                  </TooltipContent>
                </ShadcnTooltip>

                <div className={cn(
                  "neo-stat-icon-box p-1.5 sm:p-2 shrink-0",
                  item.color === 'amber' && "bg-amber-300 dark:bg-amber-700",
                  item.color === 'blue' && "bg-blue-300 dark:bg-blue-700",
                  item.color === 'green' && "bg-green-300 dark:bg-green-700",
                  item.color === 'emerald' && "bg-emerald-300 dark:bg-emerald-700",
                  item.color === 'purple' && "bg-purple-300 dark:bg-purple-700",
                  item.color === 'red' && "bg-red-400 dark:bg-red-700 text-white",
                  item.color === 'orange' && "bg-orange-300 dark:bg-orange-700",
                  item.color === 'gray' && "bg-gray-200 dark:bg-zinc-700",
                )}>
                  <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-black dark:text-white" strokeWidth={2.5} />
                </div>
              </CardHeader>

              <CardContent className="p-0 pt-2">
                <div className="flex items-baseline justify-between gap-1">
                  <div className="text-2xl sm:text-3xl font-black text-black dark:text-white tracking-tight">
                    {item.value}
                  </div>
                  <DeltaBadge value={item.delta} />
                </div>
                <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 font-bold font-mono uppercase tracking-wide truncate">
                  {item.description}
                </p>
              </CardContent>
            </div>
          );
        })}
      </div>

      {/* Faixa Secundária de Indicadores de Eficiência (Tempo Médio, Devoluções e Horário de Pico) */}
      <div className="mt-3 p-3 border-2 border-black dark:border-white bg-white dark:bg-zinc-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-purple-600 dark:text-purple-400 shrink-0" />
          <span className="font-bold text-gray-600 dark:text-gray-400 uppercase">Tempo Médio de Uso:</span>
          <strong className="text-black dark:text-white font-black">{Math.round(averageUsageTime)} min</strong>
        </div>

        <div className="flex items-center gap-2">
          <RotateCcw className="h-4 w-4 text-teal-600 dark:text-teal-400 shrink-0" />
          <span className="font-bold text-gray-600 dark:text-gray-400 uppercase">Taxa de Devolução:</span>
          <strong className="text-black dark:text-white font-black">{completionRate.toFixed(0)}%</strong>
          <span className="text-[10px] text-muted-foreground">({filteredReturns.length}/{filteredLoans.length})</span>
        </div>

        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-amber-500 shrink-0" />
          <span className="font-bold text-gray-600 dark:text-gray-400 uppercase">Pico de Demanda:</span>
          <strong className="text-black dark:text-white font-black">
            {peakHour ? `${peakHour.label} (${peakHour.count} saídas)` : 'Estável'}
          </strong>
        </div>
      </div>
    </TooltipProvider>
  );
};