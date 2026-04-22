import React, { useState, useMemo } from 'react';
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
      {/* Command Center - Ultra-Slim Header */}
      <motion.div 
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        className="neo-brutal-card bg-zinc-50 dark:bg-zinc-900/50 p-2 sm:p-3 relative overflow-hidden group/header mb-2 border-black/10"
      >
        {/* Subtle Grid Pattern for Header Interior */}
        <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none neo-brutal-grid" />
        
        <div className="relative z-10 flex flex-col space-y-4 sm:space-y-8">
          {/* Top Row: Split Layout */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Left Side: Title, Mode & Week Navigator */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1 border border-black dark:border-white bg-white dark:bg-zinc-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1),4px_4px_0px_0px_rgba(156,163,175,0.4)]">
                <div className="text-black dark:text-white">
                  <Calendar className="h-4 w-4" />
                </div>
                <h1 className="text-base sm:text-xl font-black uppercase tracking-tighter leading-none text-black dark:text-white">
                  Agendamento
                </h1>
              </div>

                {/* View Switching */}
                <div className="flex ml-4 border border-black dark:border-white overflow-hidden bg-white dark:bg-zinc-900 scale-90 origin-left">
                  <button
                    onClick={() => handleViewModeChange('weekly')}
                    className={cn(
                      "px-3 py-1 text-[8px] font-black uppercase tracking-wider transition-all duration-200",
                      viewMode === 'weekly' ? "bg-primary text-white" : "text-zinc-500 hover:text-black"
                    )}
                  >
                    Semanal
                  </button>
                  <button
                    onClick={() => setViewMode('monthly')}
                    className={cn(
                      "px-3 py-1 text-[8px] font-black uppercase tracking-wider transition-all duration-200",
                      viewMode === 'monthly' ? "bg-primary text-white" : "text-zinc-500 hover:text-black"
                    )}
                  >
                    Histórico
                  </button>
                </div>
              </div>

              {/* Date Navigator */}
              <div className="flex items-center border border-black dark:border-white bg-white dark:bg-zinc-900 w-fit shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)]">
                <button
                  onClick={() => handleDateChange('prev')}
                  disabled={isLoading}
                  className="p-1.5 border-r border-black/20 dark:border-white/20 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30 transition-colors"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
                <div className="px-4 text-[9px] sm:text-[11px] font-black uppercase tracking-tight min-w-[140px] sm:min-w-[180px] text-center whitespace-nowrap">
                  {displayRange}
                </div>
                <button
                  onClick={() => handleDateChange('next')}
                  disabled={isLoading}
                  className="p-1.5 border-l border-black/20 dark:border-white/20 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30 transition-colors"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Right Side: Month Grid (2x6) */}
            <div className="grid grid-rows-2 grid-cols-6 gap-1.5 w-fit ml-auto lg:ml-0">
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
                      "px-2 py-0.5 text-[8px] font-black uppercase transition-all duration-300 border shadow-[1px_1px_0px_0px_#000] hover:shadow-[2px_2px_0px_0px_#000] hover:-translate-y-0.5 min-w-[42px] text-center",
                      isCurrentMonth
                        ? "bg-primary text-white border-black dark:border-white"
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
        {viewMode === 'weekly' ? <SchedulingCalendar currentDate={currentDate} reservations={reservations} totalAvailableChromebooks={totalAvailableChromebooks} currentUser={user} isLoading={isLoading} onReservationSuccess={handleReservationSuccess} professores={professores.map(p => ({
          id: p.id,
          nome_completo: p.nome_completo
        }))} /> : <SchedulingMonthView currentDate={currentDate} reservations={reservations} totalAvailableChromebooks={totalAvailableChromebooks} isLoading={isLoading} onReservationSuccess={handleReservationSuccess} />}
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