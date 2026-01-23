import React, { useState, useMemo } from 'react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { ChevronLeft, ChevronRight, Calendar, Loader2, Monitor, AlertTriangle, CalendarDays, CalendarRange } from 'lucide-react';
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
  return <Layout title="Agendamento de Chromebooks" subtitle="Reserve lotes de equipamentos para suas aulas" showBackButton onBack={() => navigate('/')}>
    {/* Background Pattern */}
    <div className="fixed inset-0 pointer-events-none opacity-[0.02] dark:opacity-[0.03]">
      <div className="absolute inset-0 neo-brutal-grid" />
    </div>

    <div className="space-y-6 max-w-7xl mx-auto relative z-10">
      {/* Modernized Header Section */}
      <div className="relative overflow-hidden border-4 border-black dark:border-white bg-white dark:bg-zinc-900 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.1)] mb-8">
        {/* Decorative Gradient Background */}
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-blue-500/10 to-transparent pointer-events-none" />

        <div className="relative p-6 space-y-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            {/* Title Section with Premium Icon */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-5">
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-none blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200" />
                  <div className="relative w-14 h-14 border-4 border-black dark:border-white bg-white dark:bg-zinc-800 flex items-center justify-center shadow-[4px_4px_0px_0px_#000] dark:shadow-[4px_4px_0px_0px_#fff]">
                    <Calendar className="h-7 w-7 text-blue-600 dark:text-blue-400 animate-pulse" />
                  </div>
                </div>

                <div className="space-y-1">
                  <h2 className="text-2xl font-black uppercase tracking-tighter text-foreground leading-none">
                    Agendamento de Chromebooks
                  </h2>
                  <div className="flex items-center gap-2">
                    <div className="h-1 w-8 bg-blue-600" />
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                      Gestão Inteligente de Recursos Disponíveis
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* View Mode Toggle - Premium Styling */}
            <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1.5 border-4 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <button
                onClick={() => handleViewModeChange('weekly')}
                className={cn(
                  "flex items-center gap-2 px-6 py-2.5 text-xs font-black uppercase transition-all duration-200",
                  viewMode === 'weekly'
                    ? "bg-black text-white dark:bg-white dark:text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,0.3)]"
                    : "text-zinc-500 hover:text-black dark:hover:text-white"
                )}
              >
                <CalendarDays className="h-4 w-4" />
                Semanal
              </button>
              <button
                onClick={() => handleViewModeChange('monthly')}
                className={cn(
                  "flex items-center gap-2 px-6 py-2.5 text-xs font-black uppercase transition-all duration-200",
                  viewMode === 'monthly'
                    ? "bg-black text-white dark:bg-white dark:text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,0.3)]"
                    : "text-zinc-500 hover:text-black dark:hover:text-white"
                )}
              >
                <CalendarRange className="h-4 w-4" />
                Histórico
              </button>
            </div>
          </div>

          {/* Month Quick Navigation Bar - Clean & Centered */}
          <div className="w-full border-t border-zinc-200 dark:border-zinc-800 pt-6 px-2">
            <div className="flex justify-center w-full">
              <div className="flex gap-2 overflow-x-auto pb-2 px-4 w-full justify-start lg:justify-center scrollbar-hide mask-linear-fade">
                {Array.from({ length: 12 }, (_, i) => {
                  const date = new Date(new Date().getFullYear(), i, 1);
                  const isCurrentMonth = i === currentDate.getMonth();
                  return (
                    <button
                      key={i}
                      onClick={() => {
                        let targetDate = new Date(currentDate.getFullYear(), i, 1);
                        // Se o dia 1º cair no final de semana, vai para a próxima segunda-feira
                        // para garantir que ficamos no mês correto e em um dia útil.
                        if (isSaturday(targetDate)) targetDate = addDays(targetDate, 2);
                        else if (isSunday(targetDate)) targetDate = addDays(targetDate, 1);

                        setCurrentDate(targetDate);
                      }}
                      className={cn(
                        "flex-shrink-0 px-2 py-2.5 text-[10px] font-black uppercase tracking-wider transition-all duration-200 border-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-none min-w-[65px]",
                        isCurrentMonth
                          ? "bg-black text-white border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)] dark:bg-white dark:text-black dark:border-white"
                          : "bg-white text-zinc-600 border-zinc-200 hover:border-black hover:text-black dark:bg-zinc-900 dark:text-zinc-400 dark:border-zinc-700 dark:hover:border-white dark:hover:text-white"
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
      </div>

      {/* Navigation & Status Bar - Sleek & Modern */}
      <div className="flex flex-col md:flex-row gap-4 mb-4">
        {/* Date Picker Control */}
        <div className="flex-1 flex items-center bg-white dark:bg-zinc-900 border-4 border-black dark:border-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-1">
          <button
            onClick={() => handleDateChange('prev')}
            disabled={isLoading}
            className="h-12 w-12 flex items-center justify-center border-r-4 border-black dark:border-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>

          <div className="flex-1 text-center font-black uppercase tracking-tight text-lg py-2">
            {displayRange}
          </div>

          <button
            onClick={() => handleDateChange('next')}
            disabled={isLoading}
            className="h-12 w-12 flex items-center justify-center border-l-4 border-black dark:border-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </div>

        {/* Availability Pill - Premium Look */}
        <div className="flex items-center gap-4 bg-green-500 border-4 border-black dark:border-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] px-4 py-3 min-w-[210px]">
          <div className="w-10 h-10 bg-white border-3 border-black flex items-center justify-center shadow-[2px_2px_0px_0px_#000]">
            <Monitor className="h-5 w-5 text-green-600" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-white/80 uppercase tracking-widest leading-none mb-1">Status de Rede</span>
            <div className="flex items-center gap-2">
              {isLoadingTotal ? (
                <Loader2 className="h-5 w-5 animate-spin text-white" />
              ) : (
                <span className="text-xl font-black text-white leading-none">
                  {totalAvailableChromebooks} <span className="text-xs font-bold uppercase underline decoration-2 underline-offset-4">Disponíveis</span>
                </span>
              )}
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
      <div className="neo-brutal-card p-4 overflow-x-auto">
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
              <span className="text-xs font-black uppercase tracking-tight text-[#3c8527]">Minecraft</span>
              <span className="text-[8px] font-bold uppercase text-[#3c8527]/70 -mt-1">Preparação TI</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Layout>;
};
export default SchedulingPage;