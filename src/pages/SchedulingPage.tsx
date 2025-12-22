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
  const { data, error } = await supabase
    .from('professores')
    .select('id, nome_completo')
    .order('nome_completo', { ascending: true });
  if (error) throw error;
  return data;
};

const SchedulingPage = () => {
  const { user } = useAuth();
  const { getReservationsForWeek, getTotalAvailableChromebooks } = useDatabase();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [currentDate, setCurrentDate] = useState(getStartOfWeek(new Date()));
  const [viewMode, setViewMode] = useState<'weekly' | 'monthly'>('weekly');

  const { startDate, endDate, displayRange } = useMemo(() => {
    if (viewMode === 'weekly') {
      const weekDays = getWeekDays(currentDate);
      const start = format(weekDays[0], 'yyyy-MM-dd');
      const end = format(weekDays[weekDays.length - 1], 'yyyy-MM-dd');
      return {
        startDate: start,
        endDate: end,
        displayRange: formatWeekRange(currentDate),
      };
    } else {
      const start = startOfMonth(currentDate);
      const end = endOfMonth(currentDate);
      return {
        startDate: format(start, 'yyyy-MM-dd'),
        endDate: format(end, 'yyyy-MM-dd'),
        displayRange: format(currentDate, 'MMMM yyyy', { locale: ptBR }).charAt(0).toUpperCase() + format(currentDate, 'MMMM yyyy', { locale: ptBR }).slice(1),
      };
    }
  }, [currentDate, viewMode]);

  const { data: totalAvailableChromebooks = 0, isLoading: isLoadingTotal } = useQuery({
    queryKey: ['totalAvailableChromebooks'],
    queryFn: getTotalAvailableChromebooks,
    staleTime: 1000 * 60 * 60,
  });

  const { data: reservations = [], isLoading: isLoadingReservations, refetch } = useQuery({
    queryKey: ['reservations', startDate, endDate],
    queryFn: () => getReservationsForWeek(startDate, endDate),
    enabled: !!user,
  });

  const { data: professores = [], isLoading: isLoadingProfessores } = useQuery({
    queryKey: ['professoresList'],
    queryFn: fetchProfessores,
    staleTime: Infinity,
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
    queryClient.invalidateQueries({ queryKey: ['totalAvailableChromebooks'] });
  };

  const isLoading = isLoadingTotal || isLoadingReservations || isLoadingProfessores;

  return (
    <Layout
      title="Agendamento de Chromebooks"
      subtitle="Reserve lotes de equipamentos para suas aulas"
      showBackButton
      onBack={() => navigate('/')}
    >
      {/* Background Pattern */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.02] dark:opacity-[0.03]">
        <div className="absolute inset-0 neo-brutal-grid" />
      </div>

      <div className="space-y-6 max-w-7xl mx-auto relative z-10">

        {/* Header Card - Neo Brutal */}
        <div className="neo-brutal-card p-5">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">

            {/* Title Section */}
            <div className="flex items-center gap-4">
              <div className="neo-brutal-icon-box bg-primary/10">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-black uppercase tracking-tight text-foreground">
                  Agendamento de Reservas
                </h2>
                <p className="text-sm text-muted-foreground font-medium">
                  Gerencie a disponibilidade de Chromebooks
                </p>
              </div>
            </div>

            {/* View Mode Toggle - Neo Brutal */}
            <ToggleGroup
              type="single"
              value={viewMode}
              onValueChange={(v: 'weekly' | 'monthly') => v && handleViewModeChange(v)}
              className="border-3 border-foreground/20 bg-background p-1"
            >
              <ToggleGroupItem
                value="weekly"
                aria-label="Visualização Semanal"
                className={cn(
                  "h-10 px-4 font-bold uppercase text-xs tracking-wide rounded-none transition-all",
                  viewMode === 'weekly'
                    ? "bg-primary text-primary-foreground shadow-[2px_2px_0px_0px_hsl(var(--foreground)/0.3)]"
                    : "hover:bg-muted"
                )}
              >
                <CalendarDays className="h-4 w-4 mr-2" />
                Semanal
              </ToggleGroupItem>
              <ToggleGroupItem
                value="monthly"
                aria-label="Visualização Mensal"
                className={cn(
                  "h-10 px-4 font-bold uppercase text-xs tracking-wide rounded-none transition-all",
                  viewMode === 'monthly'
                    ? "bg-primary text-primary-foreground shadow-[2px_2px_0px_0px_hsl(var(--foreground)/0.3)]"
                    : "hover:bg-muted"
                )}
              >
                <CalendarRange className="h-4 w-4 mr-2" />
                Mensal
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>

        {/* Navigation & Status Card - Neo Brutal */}
        <div className="neo-brutal-card p-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">

            {/* Date Navigation */}
            <nav className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleDateChange('prev')}
                disabled={isLoading}
                className="h-10 w-10 border-3 border-foreground/20 rounded-none hover:bg-muted transition-all hover:shadow-[2px_2px_0px_0px_hsl(var(--foreground)/0.2)] hover:-translate-x-0.5 hover:-translate-y-0.5"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>

              <div className="min-w-[200px] sm:min-w-[280px] text-center px-4 py-2 border-3 border-foreground/10 bg-muted/30">
                <span className="text-base font-bold uppercase tracking-wide text-foreground">
                  {displayRange}
                </span>
              </div>

              <Button
                variant="outline"
                size="icon"
                onClick={() => handleDateChange('next')}
                disabled={isLoading}
                className="h-10 w-10 border-3 border-foreground/20 rounded-none hover:bg-muted transition-all hover:shadow-[2px_2px_0px_0px_hsl(var(--foreground)/0.2)] hover:-translate-x-0.5 hover:-translate-y-0.5"
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </nav>

            {/* Availability Status */}
            <div className="flex items-center gap-3 px-4 py-2 border-3 border-success/30 bg-success/5">
              <Monitor className="h-5 w-5 text-success" />
              {isLoadingTotal ? (
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              ) : (
                <span className="text-lg font-black text-success">
                  {totalAvailableChromebooks} <span className="text-sm font-bold uppercase">Disponíveis</span>
                </span>
              )}
            </div>
          </div>

          {/* Weekend Warning */}
          {viewMode === 'weekly' && getWeekDays(currentDate).length === 0 && (
            <div className="mt-4 p-3 border-3 border-warning/50 bg-warning/10 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              <span className="text-sm font-bold text-warning-foreground">
                Esta semana não contém dias úteis (Segunda a Sexta).
              </span>
            </div>
          )}
        </div>

        {/* Calendar Grid - Neo Brutal */}
        <div className="neo-brutal-card p-4 overflow-x-auto">
          {viewMode === 'weekly' ? (
            <SchedulingCalendar
              currentDate={currentDate}
              reservations={reservations}
              totalAvailableChromebooks={totalAvailableChromebooks}
              currentUser={user}
              isLoading={isLoading}
              onReservationSuccess={handleReservationSuccess}
              professores={professores.map(p => ({ id: p.id, nome_completo: p.nome_completo }))}
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
    </Layout>
  );
};

export default SchedulingPage;
