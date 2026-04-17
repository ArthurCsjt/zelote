import React, { useState, useMemo } from 'react';
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
    getTotalAvailableChromebooks
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
      {/* Command Center - Premium Unified Header */}
      <div className="neo-brutal-card bg-white/70 dark:bg-zinc-950/40 backdrop-blur-xl p-4 sm:p-6 lg:p-8 relative overflow-hidden group/header mb-4 sm:mb-8">
        {/* Subtle Grid Pattern for Header Interior */}
        <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none neo-brutal-grid" />
        
        <div className="relative z-10 flex flex-col space-y-4 sm:space-y-8">
          {/* Top Row: Title & Modes */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-center gap-3 sm:gap-5">
              <div className="bg-black text-white dark:bg-white dark:text-black p-2 sm:p-3.5 shadow-[3px_3px_0px_0px_rgba(59,130,246,0.5)] transform -rotate-1 group-hover/header:rotate-0 transition-transform duration-500">
                <Calendar className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <div className="flex flex-col">
                <h1 className="text-xl sm:text-3xl font-black uppercase tracking-tighter leading-none">
                  Agendamento
                </h1>
                <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] text-blue-600 dark:text-blue-400 mt-1 sm:mt-1.5 opacity-80">
                  Monitoramento em Tempo Real
                </span>
              </div>
            </div>

            {/* View Switching & Week Nav Grouped */}
            <div className="flex flex-wrap items-center gap-4 lg:gap-6">
              {/* Mode Toggle */}
              <div className="flex w-full sm:w-auto p-1 bg-zinc-200/50 dark:bg-zinc-800/50 border-2 border-black dark:border-white shadow-[3px_3px_0px_0px_rgba(0,0,0,0.1)]">
                <button
                  onClick={() => handleViewModeChange('weekly')}
                  className={cn(
                    "flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 sm:px-4 py-1.5 text-[9px] sm:text-[11px] font-black uppercase tracking-wider transition-all",
                    viewMode === 'weekly'
                      ? "bg-gradient-to-br from-blue-600 to-primary text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)]"
                      : "text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white"
                  )}
                >
                  <CalendarDays className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  Semanal
                </button>
                <button
                  onClick={() => handleViewModeChange('monthly')}
                  className={cn(
                    "flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 sm:px-4 py-1.5 text-[9px] sm:text-[11px] font-black uppercase tracking-wider transition-all",
                    viewMode === 'monthly'
                      ? "bg-gradient-to-br from-blue-600 to-primary text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)]"
                      : "text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white"
                  )}
                >
                  <History className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  Histórico
                </button>
              </div>

              {/* Week Navigation Arrows - Minimalist */}
              <div className="flex w-full sm:w-auto items-center bg-white dark:bg-zinc-900 border-2 border-black dark:border-white shadow-[3px_3px_0px_0px_rgba(0,0,0,0.1)]">
                <button
                  onClick={() => handleDateChange('prev')}
                  disabled={isLoading}
                  className="p-2 sm:p-2.5 border-r-2 border-black dark:border-white hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30 transition-colors"
                >
                  <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                </button>
                <div className="flex-1 sm:flex-none px-4 sm:px-6 text-[11px] sm:text-[13px] font-black uppercase tracking-tighter min-w-0 sm:min-w-[180px] text-center truncate">
                  {displayRange}
                </div>
                <button
                  onClick={() => handleDateChange('next')}
                  disabled={isLoading}
                  className="p-2 sm:p-2.5 border-l-2 border-black dark:border-white hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30 transition-colors"
                >
                  <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Row: Month Quick Select */}
          <div className="pt-6 border-t border-black/5 dark:border-white/5">
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {Array.from({ length: 12 }, (_, i) => {
                const date = new Date(new Date().getFullYear(), i, 1);
                const isCurrentMonth = i === currentDate.getMonth();
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
                      "flex-shrink-0 px-3 py-2 text-[10px] font-black uppercase transition-all duration-300 border-2 shadow-[2px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[3px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 min-w-[65px] relative",
                      isCurrentMonth
                        ? "bg-gradient-to-br from-blue-600 to-indigo-600 text-white border-black dark:border-white"
                        : "bg-white text-zinc-500 border-black hover:text-black dark:bg-zinc-900 dark:border-white dark:hover:text-white"
                    )}
                  >
                    {format(date, 'MMM', { locale: ptBR }).replace('.', '')}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Weekend Warning */}
      {viewMode === 'weekly' && getWeekDays(currentDate).length === 0 && <div className="mt-4 p-3 border-3 border-warning/50 bg-warning/10 flex items-center gap-2">
        <AlertTriangle className="h-5 w-5 text-warning" />
        <span className="text-sm font-bold text-warning-foreground">
          Esta semana não contém dias úteis (Segunda a Sexta).
        </span>
      </div>}

      {/* Calendar Grid - Neo Brutal */}
      <div className="neo-brutal-card p-2 sm:p-4 overflow-hidden">
        {viewMode === 'weekly' ? <SchedulingCalendar currentDate={currentDate} reservations={reservations} totalAvailableChromebooks={totalAvailableChromebooks} currentUser={user} isLoading={isLoading} onReservationSuccess={handleReservationSuccess} professores={professores.map(p => ({
          id: p.id,
          nome_completo: p.nome_completo
        }))} /> : <SchedulingMonthView currentDate={currentDate} reservations={reservations} totalAvailableChromebooks={totalAvailableChromebooks} isLoading={isLoading} onReservationSuccess={handleReservationSuccess} />}
      </div>

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