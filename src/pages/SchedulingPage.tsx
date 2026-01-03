import React, { useState, useMemo } from 'react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { ChevronLeft, ChevronRight, Calendar, Loader2, Monitor, AlertTriangle, CalendarDays, CalendarRange } from 'lucide-react';
import { useDatabase } from '@/hooks/useDatabase';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getStartOfWeek, formatWeekRange, changeWeek, getWeekDays, changeMonth } from '@/utils/scheduling';
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
  const [currentDate, setCurrentDate] = useState(getStartOfWeek(new Date()));
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
    <div className="fixed inset-0 pointer-events-none opacity-[0.015] dark:opacity-[0.02]">
      <div className="absolute inset-0 neo-brutal-grid" />
    </div>

    <div className="space-y-5 max-w-7xl mx-auto relative z-10">
      
      {/* Compact Header Card */}
      <div className="relative border-3 border-foreground/80 bg-card shadow-[4px_4px_0px_0px_hsl(var(--foreground)/0.15)]">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-primary/5 to-transparent pointer-events-none" />
        
        <div className="relative p-4 sm:p-5">
          {/* Top Row: Title + View Mode Toggle */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            {/* Title Section */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 border-2 border-foreground/80 bg-primary/10 flex items-center justify-center shadow-[2px_2px_0px_0px_hsl(var(--foreground)/0.1)]">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black uppercase tracking-tight text-foreground leading-none">
                  Agendamento
                </h2>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mt-0.5">
                  Gestão de Recursos
                </p>
              </div>
            </div>

            {/* View Mode Toggle */}
            <div className="flex bg-muted/50 p-1 border-2 border-foreground/20">
              <button
                onClick={() => handleViewModeChange('weekly')}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black uppercase transition-all",
                  viewMode === 'weekly'
                    ? "bg-foreground text-background shadow-[1px_1px_0px_0px_hsl(var(--foreground)/0.3)]"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <CalendarDays className="h-3.5 w-3.5" />
                Semanal
              </button>
              <button
                onClick={() => handleViewModeChange('monthly')}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black uppercase transition-all",
                  viewMode === 'monthly'
                    ? "bg-foreground text-background shadow-[1px_1px_0px_0px_hsl(var(--foreground)/0.3)]"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <CalendarRange className="h-3.5 w-3.5" />
                Histórico
              </button>
            </div>
          </div>

          {/* Month Navigation - Compact Horizontal */}
          <div className="pt-3 border-t border-foreground/10">
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
              {Array.from({ length: 12 }, (_, i) => {
                const monthDate = new Date(new Date().getFullYear(), i, 1);
                const isCurrentMonth = i === currentDate.getMonth();
                return (
                  <button
                    key={i}
                    onClick={() => {
                      const newDate = new Date(currentDate.getFullYear(), i, 1);
                      setCurrentDate(getStartOfWeek(newDate));
                    }}
                    className={cn(
                      "flex-shrink-0 px-3 py-1.5 text-[10px] font-black uppercase tracking-wide transition-all border",
                      isCurrentMonth
                        ? "bg-foreground text-background border-foreground shadow-[2px_2px_0px_0px_hsl(var(--foreground)/0.2)]"
                        : "bg-background text-muted-foreground border-foreground/20 hover:border-foreground/50 hover:text-foreground"
                    )}
                  >
                    {format(monthDate, 'MMM', { locale: ptBR }).replace('.', '')}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation & Status - Compact Row */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Date Picker Control */}
        <div className="flex-1 flex items-center bg-card border-2 border-foreground/60 shadow-[3px_3px_0px_0px_hsl(var(--foreground)/0.1)]">
          <button
            onClick={() => handleDateChange('prev')}
            disabled={isLoading}
            className="h-10 w-10 flex items-center justify-center border-r-2 border-foreground/30 hover:bg-muted/50 transition-colors disabled:opacity-50"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="flex-1 text-center font-black uppercase tracking-tight text-sm py-2">
            {displayRange}
          </div>
          <button
            onClick={() => handleDateChange('next')}
            disabled={isLoading}
            className="h-10 w-10 flex items-center justify-center border-l-2 border-foreground/30 hover:bg-muted/50 transition-colors disabled:opacity-50"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {/* Availability Status */}
        <div className="flex items-center gap-3 bg-success border-2 border-foreground/60 shadow-[3px_3px_0px_0px_hsl(var(--foreground)/0.1)] px-4 py-2">
          <div className="w-8 h-8 bg-background border-2 border-foreground/50 flex items-center justify-center">
            <Monitor className="h-4 w-4 text-success" />
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] font-black text-success-foreground/80 uppercase tracking-wide leading-none">
              Rede
            </span>
            {isLoadingTotal ? (
              <Loader2 className="h-4 w-4 animate-spin text-success-foreground" />
            ) : (
              <span className="text-base font-black text-success-foreground leading-none">
                {totalAvailableChromebooks} <span className="text-[10px] font-bold">disp.</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Weekend Warning */}
      {viewMode === 'weekly' && getWeekDays(currentDate).length === 0 && (
        <div className="p-3 border-2 border-warning/50 bg-warning/10 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-warning" />
          <span className="text-xs font-bold text-warning-foreground">
            Esta semana não contém dias úteis.
          </span>
        </div>
      )}

      {/* Calendar Grid */}
      <div className="border-2 border-foreground/60 bg-card shadow-[4px_4px_0px_0px_hsl(var(--foreground)/0.1)] p-3 sm:p-4 overflow-x-auto">
        {viewMode === 'weekly' ? (
          <SchedulingCalendar 
            currentDate={currentDate} 
            reservations={reservations} 
            totalAvailableChromebooks={totalAvailableChromebooks} 
            currentUser={user} 
            isLoading={isLoading} 
            onReservationSuccess={handleReservationSuccess} 
            professores={professores.map(p => ({
              id: p.id,
              nome_completo: p.nome_completo
            }))} 
          />
        ) : (
          <SchedulingMonthView 
            currentDate={currentDate} 
            reservations={reservations} 
            totalAvailableChromebooks={totalAvailableChromebooks} 
            isLoading={isLoading} 
          />
        )}
      </div>

      {/* Legend - Compact */}
      <div className="border-2 border-foreground/40 bg-card/50 p-3">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <h3 className="text-[9px] font-black uppercase tracking-wide text-muted-foreground">
            Legenda:
          </h3>
          
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 border-2 border-info bg-info/20" />
            <span className="text-[10px] font-bold uppercase text-foreground/70">Minha</span>
          </div>
          
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 border border-dashed border-foreground/30 bg-muted/10" />
            <span className="text-[10px] font-bold uppercase text-foreground/70">Livre</span>
          </div>
          
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 border-2 border-warning bg-warning/20" />
            <span className="text-[10px] font-bold uppercase text-foreground/70">Parcial</span>
          </div>
          
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 border-2 border-error bg-error/20" />
            <span className="text-[10px] font-bold uppercase text-foreground/70">Esgotado</span>
          </div>
          
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 border-2 border-[#3c8527] bg-[#3c8527]/20" />
            <span className="text-[10px] font-black uppercase text-[#3c8527]">Minecraft</span>
          </div>
        </div>
      </div>
    </div>
  </Layout>;
};
export default SchedulingPage;