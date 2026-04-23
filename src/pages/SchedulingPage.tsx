import React, { useState, useMemo, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { ChevronLeft, ChevronRight, Calendar, Loader2, Monitor, AlertTriangle, CalendarDays, History, CalendarRange } from 'lucide-react';
import { useDatabase } from '@/hooks/useDatabase';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format, startOfMonth, endOfMonth, isSaturday, isSunday, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getStartOfWeek, formatWeekRange, changeWeek, getWeekDays, changeMonth, getInitialSchedulingDate } from '@/utils/scheduling';
import { SchedulingCalendar } from '@/components/scheduling/SchedulingCalendar';
import { SchedulingMonthView } from '@/components/scheduling/SchedulingMonthView';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
const fetchProfessores = async () => {
  const {
    data,
    error
  } = await supabase.from('professores').select('id, nome_completo').order('nome_completo', {
    ascending: true
  });
  if (error) throw error;
  return data;
};
const SchedulingPage = () => {
  const {
    user
  } = useAuth();
  const {
    getReservationsForWeek,
    getTotalAvailableChromebooks,
    getSystemSetting,
    updateSystemSetting
  } = useDatabase();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(getInitialSchedulingDate());
  const [viewMode, setViewMode] = useState<'weekly' | 'monthly'>('weekly');
  const {
    startDate,
    endDate,
    displayRange
  } = useMemo(() => {
    if (viewMode === 'weekly') {
      const weekDays = getWeekDays(currentDate);
      const start = format(weekDays[0], 'yyyy-MM-dd');
      const end = format(weekDays[weekDays.length - 1], 'yyyy-MM-dd');
      return {
        startDate: start,
        endDate: end,
        displayRange: formatWeekRange(currentDate)
      };
    } else {
      const start = startOfMonth(currentDate);
      const end = endOfMonth(currentDate);
      return {
        startDate: format(start, 'yyyy-MM-dd'),
        endDate: format(end, 'yyyy-MM-dd'),
        displayRange: format(currentDate, 'MMMM yyyy', {
          locale: ptBR
        }).charAt(0).toUpperCase() + format(currentDate, 'MMMM yyyy', {
          locale: ptBR
        }).slice(1)
      };
    }
  }, [currentDate, viewMode]);
  const {
    data: totalAvailableChromebooks = 0,
    isLoading: isLoadingTotal
  } = useQuery({
    queryKey: ['totalAvailableChromebooks'],
    queryFn: getTotalAvailableChromebooks,
    staleTime: 1000 * 60 * 60
  });
  const {
    data: reservations = [],
    isLoading: isLoadingReservations,
    refetch
  } = useQuery({
    queryKey: ['reservations', startDate, endDate],
    queryFn: () => getReservationsForWeek(startDate, endDate),
    enabled: !!user
  });
  const {
    data: professores = [],
    isLoading: isLoadingProfessores
  } = useQuery({
    queryKey: ['professoresList'],
    queryFn: fetchProfessores,
    staleTime: Infinity
  });
  const handleDateChange = (direction: 'next' | 'prev') => {
    if (viewMode === 'weekly') {
      setCurrentDate(prev => changeWeek(prev, direction));
    } else {
      setCurrentDate(prev => changeMonth(prev, direction));
    }
  };
  const handleViewModeChange = (v: 'weekly' | 'monthly') => {
    setViewMode(v);
    if (v === 'weekly') {
      setCurrentDate(getStartOfWeek(new Date()));
    } else {
      setCurrentDate(startOfMonth(new Date()));
    }
  };
  const LIMIT_KEY = 'zelote_chromebook_operational_limit';

  // Lê do localStorage imediatamente, com fallback para o total físico
  const [operationalLimit, setOperationalLimit] = useState<number>(() => {
    const stored = localStorage.getItem(LIMIT_KEY);
    return stored ? parseInt(stored) : 0;
  });

  // Quando o total físico carrega, usa como fallback se não houver valor salvo
  useEffect(() => {
    const stored = localStorage.getItem(LIMIT_KEY);
    if (!stored && totalAvailableChromebooks > 0) {
      setOperationalLimit(totalAvailableChromebooks);
    }
  }, [totalAvailableChromebooks]);

  // Tenta buscar do banco em segundo plano para sincronizar entre dispositivos
  useEffect(() => {
    if (!isLoadingTotal && totalAvailableChromebooks > 0) {
      getSystemSetting('chromebook_operational_limit', null).then((val) => {
        if (val !== null && val !== undefined) {
          const parsed = typeof val === 'number' ? val : parseInt(val);
          if (!isNaN(parsed)) {
            setOperationalLimit(parsed);
            localStorage.setItem(LIMIT_KEY, parsed.toString());
          }
        }
      }).catch(() => {/* silencioso se tabela não existir */});
    }
  }, [isLoadingTotal, totalAvailableChromebooks]);

  const handleUpdateLimit = async (newLimit: number) => {
    // 1. Atualiza o estado React imediatamente (feedback visual instantâneo)
    setOperationalLimit(newLimit);
    // 2. Persiste no localStorage (funciona sempre)
    localStorage.setItem(LIMIT_KEY, newLimit.toString());
    // 3. Tenta salvar no banco em segundo plano
    updateSystemSetting('chromebook_operational_limit', newLimit).catch(() => {/* silencioso */});
    toast({ title: "✓ Limite atualizado", description: `Limite operacional definido para ${newLimit} Chromebooks.`, variant: "success" });
  };

  const handleReservationSuccess = () => {
    refetch();
    queryClient.invalidateQueries({
      queryKey: ['totalAvailableChromebooks']
    });
  };
  const isLoading = isLoadingTotal || isLoadingReservations || isLoadingProfessores;
  return <Layout title="Agendamento" showBackButton onBack={() => navigate('/')}>
    {/* Background Pattern */}
    <div className="fixed inset-0 pointer-events-none opacity-[0.02] dark:opacity-[0.03]">
      <div className="absolute inset-0 neo-brutal-grid" />
    </div>

    <div className="space-y-4 sm:space-y-6 max-w-7xl mx-auto relative z-10">
      {/* Command Center - Ultra-Slim Header */}
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        className="bg-white dark:bg-zinc-900 p-3 sm:p-4 border-2 border-black dark:border-white shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_#fff] mb-2"
      >
        <div className="flex flex-col gap-3">
          {/* ROW 1: Title + Toggle (left) | Year selector (right) */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              {/* Title pill - centralizado */}
              <div className="flex items-stretch h-11 border-2 border-black dark:border-white bg-white dark:bg-zinc-900 shadow-[3px_3px_0_0_#000] dark:shadow-[3px_3px_0_0_#fff] flex-1 sm:flex-initial">
                <div className="flex items-center justify-center w-11 bg-primary text-primary-foreground border-r-2 border-black dark:border-white shrink-0">
                  <Calendar className="h-5 w-5" strokeWidth={2.5} />
                </div>
                <h1 className="flex-1 flex items-center justify-center px-6 text-base sm:text-lg font-black uppercase tracking-tight text-black dark:text-white whitespace-nowrap">
                  Agendamento
                </h1>
              </div>

              {/* View toggle */}
              <div className="flex h-11 border-2 border-black dark:border-white bg-white dark:bg-zinc-900 shadow-[3px_3px_0_0_#000] dark:shadow-[3px_3px_0_0_#fff] overflow-hidden">
                <button
                  onClick={() => handleViewModeChange('weekly')}
                  className={cn(
                    "px-5 text-[11px] font-black uppercase tracking-wider transition-all duration-150 border-r-2 border-black dark:border-white",
                    viewMode === 'weekly'
                      ? "bg-primary text-primary-foreground shadow-[inset_2px_2px_0_0_rgba(0,0,0,0.25)]"
                      : "bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  )}
                >
                  Semanal
                </button>
                <button
                  onClick={() => handleViewModeChange('monthly')}
                  className={cn(
                    "px-5 text-[11px] font-black uppercase tracking-wider transition-all duration-150",
                    viewMode === 'monthly'
                      ? "bg-primary text-primary-foreground shadow-[inset_2px_2px_0_0_rgba(0,0,0,0.25)]"
                      : "bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  )}
                >
                  Histórico
                </button>
              </div>
            </div>

            {/* Year navigator + label */}
            <div className="flex items-center justify-between lg:justify-end gap-2">
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
                Selecionar mês
              </span>
              <div className="flex h-7 border-2 border-black dark:border-white bg-white dark:bg-zinc-900 shadow-[2px_2px_0_0_#000] dark:shadow-[2px_2px_0_0_#fff]">
                <button
                  onClick={() => setCurrentDate(new Date(currentDate.getFullYear() - 1, currentDate.getMonth(), 1))}
                  className="flex items-center justify-center w-6 border-r-2 border-black dark:border-white hover:bg-primary hover:text-primary-foreground transition-colors"
                  aria-label="Ano anterior"
                >
                  <ChevronLeft className="h-3 w-3" strokeWidth={3} />
                </button>
                <div className="flex items-center justify-center px-2.5 text-[10px] font-black tracking-wider text-black dark:text-white tabular-nums">
                  {currentDate.getFullYear()}
                </div>
                <button
                  onClick={() => setCurrentDate(new Date(currentDate.getFullYear() + 1, currentDate.getMonth(), 1))}
                  className="flex items-center justify-center w-6 border-l-2 border-black dark:border-white hover:bg-primary hover:text-primary-foreground transition-colors"
                  aria-label="Próximo ano"
                >
                  <ChevronRight className="h-3 w-3" strokeWidth={3} />
                </button>
              </div>
            </div>
          </div>

          {/* ROW 2: Date Navigator (left) | Months Grid (right) — alinhados */}
          <div className="flex flex-col lg:flex-row lg:items-stretch lg:justify-between gap-3">
            {/* Date Navigator com pontas coloridas */}
            <div className="flex h-[68px] border-2 border-black dark:border-white bg-white dark:bg-zinc-900 shadow-[3px_3px_0_0_#000] dark:shadow-[3px_3px_0_0_#fff] flex-1 lg:max-w-md">
              <button
                onClick={() => handleDateChange('prev')}
                disabled={isLoading}
                className="flex items-center justify-center w-14 bg-primary text-primary-foreground border-r-2 border-black dark:border-white hover:bg-primary/90 disabled:opacity-30 transition-colors shrink-0"
                aria-label="Anterior"
              >
                <ChevronLeft className="h-6 w-6" strokeWidth={3} />
              </button>
              <div className="flex-1 flex items-center justify-center px-4 text-[11px] sm:text-xs font-black uppercase tracking-wider text-black dark:text-white whitespace-nowrap text-center">
                {displayRange}
              </div>
              <button
                onClick={() => handleDateChange('next')}
                disabled={isLoading}
                className="flex items-center justify-center w-14 bg-primary text-primary-foreground border-l-2 border-black dark:border-white hover:bg-primary/90 disabled:opacity-30 transition-colors shrink-0"
                aria-label="Próximo"
              >
                <ChevronRight className="h-6 w-6" strokeWidth={3} />
              </button>
            </div>

            {/* Months grid - card container */}
            <div className="p-2 border-2 border-black dark:border-white bg-zinc-50 dark:bg-zinc-950 shadow-[3px_3px_0_0_#000] dark:shadow-[3px_3px_0_0_#fff]">
              <div className="grid grid-rows-2 grid-cols-6 gap-1.5 w-full lg:w-auto h-full">
                {Array.from({ length: 12 }, (_, i) => {
                  const date = new Date(new Date().getFullYear(), i, 1);
                  const isCurrentMonth = i === currentDate.getMonth();
                  const isThisMonth = i === new Date().getMonth() && currentDate.getFullYear() === new Date().getFullYear();
                  return (
                    <button
                      key={i}
                      onClick={() => {
                        let targetDate = new Date(currentDate.getFullYear(), i, 1);
                        if (isSaturday(targetDate)) targetDate = addDays(targetDate, 2);
                        else if (isSunday(targetDate)) targetDate = addDays(targetDate, 1);
                        setCurrentDate(targetDate);
                      }}
                      className={cn(
                        "group relative w-full lg:w-14 text-[10px] font-black uppercase tracking-wider border-2 transition-all duration-200 flex flex-col items-center justify-center overflow-hidden",
                        isCurrentMonth
                          ? "bg-primary text-primary-foreground border-black dark:border-white translate-y-[2px] translate-x-[2px] shadow-none"
                          : cn(
                              "bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 shadow-[2px_2px_0_0_#000] dark:shadow-[2px_2px_0_0_#fff]",
                              "hover:-translate-y-0.5 hover:-translate-x-0.5 hover:shadow-[4px_4px_0_0_#000] dark:hover:shadow-[4px_4px_0_0_#fff] hover:bg-primary/10",
                              isThisMonth ? "border-primary border-[2.5px]" : "border-black dark:border-white"
                            )
                      )}
                    >
                      {/* Month abbreviation */}
                      <span className="leading-none">
                        {format(date, 'MMM', { locale: ptBR }).replace('.', '')}
                      </span>
                      {/* Today indicator dot */}
                      {isThisMonth && !isCurrentMonth && (
                        <span className="absolute top-0.5 right-0.5 h-1.5 w-1.5 bg-primary rounded-full" />
                      )}
                      {/* Active corner accent */}
                      {isCurrentMonth && (
                        <span className="absolute top-0 right-0 h-2 w-2 bg-primary-foreground/30" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Weekend Warning */}
      {viewMode === 'weekly' && getWeekDays(currentDate).length === 0 && <div className="mt-4 p-3 border-3 border-warning/50 bg-warning/10 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-warning" />
          <span className="text-sm font-bold uppercase tracking-tight">
            Final de semana selecionado. Não há horários disponíveis.
          </span>
        </div>}

      {/* Calendar Grid - Neo Brutal - Slimmer */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.4, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        className="neo-brutal-card p-1 sm:p-2 overflow-hidden border"
      >
        {viewMode === 'weekly' ? <SchedulingCalendar 
          currentDate={currentDate} 
          reservations={reservations} 
          totalAvailableChromebooks={operationalLimit} 
          physicalTotal={totalAvailableChromebooks}
          currentUser={user} 
          isLoading={isLoading} 
          onReservationSuccess={handleReservationSuccess} 
          onUpdateLimit={handleUpdateLimit}
          professores={professores.map(p => ({
            id: p.id,
            nome_completo: p.nome_completo
          }))} 
        /> : <SchedulingMonthView 
          currentDate={currentDate} 
          reservations={reservations} 
          totalAvailableChromebooks={operationalLimit} 
          isLoading={isLoading} 
          onReservationSuccess={handleReservationSuccess} 
        />}
      </motion.div>

      {/* Legend - Neo Brutal Style */}
      <div className="neo-brutal-card p-4">
        <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mr-2">
            Legenda:
          </h3>

          <div className="flex items-center gap-2">
            <div className="h-4 w-4 border-2 border-info bg-info/20" />
            <span className="text-xs font-bold uppercase tracking-tight text-foreground/80">Minha Reserva</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="h-4 w-4 border-2 border-dashed border-foreground/30 bg-muted/10" />
            <span className="text-xs font-bold uppercase tracking-tight text-foreground/80">Disponível</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="h-4 w-4 border-2 border-warning bg-warning/20" />
            <span className="text-xs font-bold uppercase tracking-tight text-foreground/80">Parcial</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="h-4 w-4 border-2 border-error bg-error/20" />
            <span className="text-xs font-bold uppercase tracking-tight text-foreground/80">Esgotado</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="h-4 w-4 border-2 border-[#3c8527] bg-[#3c8527]/20" />
            <div className="flex flex-col">
              <span className="text-xs font-black uppercase tracking-tight text-[#3c8527] font-minecraft">Aula com Minecraft</span>
              <span className="text-[8px] font-bold uppercase text-[#3c8527]/70 -mt-1">Preparação TI</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Layout>;
};
export default SchedulingPage;