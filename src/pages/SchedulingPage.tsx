import React, { useState, useMemo, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { ChevronLeft, ChevronRight, Calendar, Loader2, Monitor, AlertTriangle, CalendarDays, History, CalendarRange, Plus } from 'lucide-react';
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
  const [isMonthsExpanded, setIsMonthsExpanded] = useState(false);
  const [isCommandCenterExpanded, setIsCommandCenterExpanded] = useState(true);
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
      }).catch(() => {/* silencioso se tabela não existir */ });
    }
  }, [isLoadingTotal, totalAvailableChromebooks]);

  const handleUpdateLimit = async (newLimit: number) => {
    // 1. Atualiza o estado React imediatamente (feedback visual instantâneo)
    setOperationalLimit(newLimit);
    // 2. Persiste no localStorage (funciona sempre)
    localStorage.setItem(LIMIT_KEY, newLimit.toString());
    // 3. Tenta salvar no banco em segundo plano
    updateSystemSetting('chromebook_operational_limit', newLimit).catch(() => {/* silencioso */ });
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
        transition={{ duration: 1.0, ease: [0.22, 1, 0.36, 1] }}
        className="mb-2 bg-white dark:bg-zinc-900 border-[3px] border-black dark:border-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.9)] flex flex-col overflow-hidden"
      >
        {/* ROW 1: Title + View Toggle */}
        <div className="p-4 md:p-6 border-b-[3px] border-black dark:border-white flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4 md:gap-5">
            {/* Icon badge */}
            <div className="w-12 h-12 md:w-14 md:h-14 bg-white dark:bg-zinc-950 border-[3px] border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.85)] flex items-center justify-center shrink-0">
              <Calendar className="h-6 w-6 md:h-7 md:w-7 text-black dark:text-white" strokeWidth={3} />
            </div>
            <div>
              <h1 className="text-2xl md:text-4xl font-black tracking-tighter uppercase leading-none text-black dark:text-white">
                Agendamento
              </h1>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">
                  Unidade de Controle
                </span>
                <span className="h-[1px] w-4 bg-zinc-300 dark:bg-zinc-700" />
                <span className="text-[10px] font-black px-1.5 py-0.5 border border-black dark:border-white bg-primary/10 text-primary uppercase tracking-widest">
                  v2.4
                </span>
              </div>
            </div>
          </div>

          {/* View Toggle */}
          <div className="flex border-[3px] border-black dark:border-white p-1 bg-white dark:bg-zinc-950 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.85)] w-full md:w-auto">
            <button
              onClick={() => handleViewModeChange('weekly')}
              className={cn(
                "flex-1 md:flex-none px-6 py-2 font-black text-xs uppercase tracking-wider transition-colors border-r-[3px] border-black dark:border-white",
                viewMode === 'weekly'
                  ? "bg-primary text-primary-foreground"
                  : "bg-white dark:bg-zinc-950 text-black dark:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900"
              )}
            >
              Semanal
            </button>
            <button
              onClick={() => handleViewModeChange('monthly')}
              className={cn(
                "flex-1 md:flex-none px-6 py-2 font-black text-xs uppercase tracking-wider transition-colors",
                viewMode === 'monthly'
                  ? "bg-primary text-primary-foreground"
                  : "bg-white dark:bg-zinc-950 text-black dark:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900"
              )}
            >
              Histórico
            </button>
          </div>
        </div>

        {/* ROW 2: Week Selector + Year/Months */}
        <div className="p-4 md:p-5 bg-zinc-50 dark:bg-zinc-950/40 flex flex-col lg:flex-row gap-4 items-stretch">
          {/* Week Selector Bar */}
          <div className="flex-grow flex items-stretch border-[3px] border-black dark:border-white bg-white dark:bg-zinc-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.85)] transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5">
            <button
              onClick={() => handleDateChange('prev')}
              disabled={isLoading}
              className="px-4 border-r-[3px] border-black dark:border-white hover:bg-primary/10 transition-colors disabled:opacity-30 flex items-center justify-center"
              aria-label="Anterior"
            >
              <ChevronLeft className="h-5 w-5 text-black dark:text-white" strokeWidth={3} />
            </button>
            <div className="flex-grow py-3 px-4 md:px-6 flex items-center justify-center gap-3 text-center">
              <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse shrink-0" />
              <span className="text-xs md:text-sm font-black uppercase tracking-tight text-zinc-900 dark:text-zinc-50">
                {displayRange}
              </span>
            </div>
            <button
              onClick={() => handleDateChange('next')}
              disabled={isLoading}
              className="px-4 border-l-[3px] border-black dark:border-white hover:bg-primary/10 transition-colors disabled:opacity-30 flex items-center justify-center"
              aria-label="Próximo"
            >
              <ChevronRight className="h-5 w-5 text-black dark:text-white" strokeWidth={3} />
            </button>
          </div>

          {/* Year + Months */}
          <div className="flex border-[3px] border-black dark:border-white bg-white dark:bg-zinc-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.85)]">
            {/* Year Selector */}
            <div className="flex items-center px-3 md:px-4 border-r-[3px] border-black dark:border-white">
              <button
                onClick={() => setCurrentDate(new Date(currentDate.getFullYear() - 1, currentDate.getMonth(), 1))}
                className="p-1 text-zinc-400 hover:text-black dark:hover:text-white transition-colors"
                aria-label="Ano anterior"
              >
                <ChevronLeft className="h-3.5 w-3.5" strokeWidth={4} />
              </button>
              <span className="mx-2 md:mx-3 text-sm font-black tabular-nums text-black dark:text-white">
                {currentDate.getFullYear()}
              </span>
              <button
                onClick={() => setCurrentDate(new Date(currentDate.getFullYear() + 1, currentDate.getMonth(), 1))}
                className="p-1 text-zinc-400 hover:text-black dark:hover:text-white transition-colors"
                aria-label="Próximo ano"
              >
                <ChevronRight className="h-3.5 w-3.5" strokeWidth={4} />
              </button>
            </div>

            {/* Months */}
            <div className="flex items-center px-2">
              <div className="flex gap-1 overflow-x-auto scrollbar-none">
                <AnimatePresence mode="popLayout">
                  {Array.from({ length: 12 }, (_, i) => {
                    const date = new Date(currentDate.getFullYear(), i, 1);
                    const isCurrentMonth = i === currentDate.getMonth();
                    const isTodayMonth = i === new Date().getMonth() && currentDate.getFullYear() === new Date().getFullYear();
                    const todayIdx = new Date().getMonth();
                    const isVisibleByDefault = (i >= todayIdx && i <= todayIdx + 3) || (todayIdx > 8 && i < (todayIdx + 4) % 12);
                    const shouldShow = isMonthsExpanded || isVisibleByDefault || isCurrentMonth;
                    if (!shouldShow) return null;

                    return (
                      <motion.button
                        key={i}
                        layout
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        onClick={() => {
                          let targetDate = new Date(currentDate.getFullYear(), i, 1);
                          if (isSaturday(targetDate)) targetDate = addDays(targetDate, 2);
                          else if (isSunday(targetDate)) targetDate = addDays(targetDate, 1);
                          setCurrentDate(targetDate);
                        }}
                        className={cn(
                          "relative px-3 py-2 text-[11px] font-black uppercase tracking-wider transition-colors shrink-0",
                          isCurrentMonth
                            ? "text-primary border-b-[3px] border-primary"
                            : "text-zinc-400 dark:text-zinc-500 hover:text-black dark:hover:text-white"
                        )}
                      >
                        {format(date, 'MMM', { locale: ptBR }).replace('.', '')}
                        {isTodayMonth && !isCurrentMonth && (
                          <div className="absolute top-1.5 right-1 w-1 h-1 bg-primary rounded-full animate-pulse" />
                        )}
                      </motion.button>
                    );
                  })}
                </AnimatePresence>
              </div>
              <button
                onClick={() => setIsMonthsExpanded(!isMonthsExpanded)}
                className="p-3 hover:bg-zinc-50 dark:hover:bg-zinc-800 border-l-[3px] border-black dark:border-white transition-colors"
                title={isMonthsExpanded ? "Ver menos" : "Ver todos os meses"}
                aria-label="Alternar meses"
              >
                <motion.div animate={{ rotate: isMonthsExpanded ? 45 : 0 }} transition={{ type: "spring", stiffness: 200 }}>
                  <Plus className="h-4 w-4 text-black dark:text-white" strokeWidth={4} />
                </motion.div>
              </button>
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
        className="w-full overflow-visible"
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
      <div className="py-2 bg-transparent">
        <div className="flex flex-wrap items-center justify-center gap-3">
          <div className="flex items-center gap-2 mr-2">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500">
              Legenda:
            </span>
          </div>

          {/* Minha Reserva */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50/40 dark:bg-blue-950/10 border-2 border-black dark:border-zinc-800 rounded-none shadow-[2px_2px_0_0_#000] dark:shadow-[2px_2px_0_0_rgba(255,255,255,0.05)] transition-all">
            <div className="h-2 w-2 rounded-full bg-[#3B82F6] shadow-[0_0_8px_rgba(59,130,246,0.6)] shrink-0 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-wider text-blue-700 dark:text-blue-400">
              Minha Reserva
            </span>
          </div>

          {/* Disponível */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-50/40 dark:bg-zinc-900/40 border-2 border-dashed border-zinc-300 dark:border-zinc-850 rounded-none shadow-[2px_2px_0_0_rgba(0,0,0,0.02)] transition-all">
            <div className="h-2 w-2 rounded-full border border-dashed border-zinc-400 dark:border-zinc-600 bg-transparent shrink-0" />
            <span className="text-[10px] font-black uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
              Disponível
            </span>
          </div>

          {/* Parcial */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50/40 dark:bg-amber-950/10 border-2 border-black dark:border-zinc-800 rounded-none shadow-[2px_2px_0_0_#000] dark:shadow-[2px_2px_0_0_rgba(255,255,255,0.05)] transition-all">
            <div className="h-2 w-2 rounded-full bg-[#EAB308] shadow-[0_0_8px_rgba(245,158,11,0.6)] shrink-0" />
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-400">
              Parcial
            </span>
          </div>

          {/* Esgotado */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-rose-50/40 dark:bg-rose-950/10 border-2 border-black dark:border-zinc-800 rounded-none shadow-[2px_2px_0_0_#000] dark:shadow-[2px_2px_0_0_rgba(255,255,255,0.05)] transition-all">
            <div className="h-2 w-2 rounded-full bg-[#EF4444] shadow-[0_0_8px_rgba(244,63,94,0.6)] shrink-0" />
            <span className="text-[10px] font-black uppercase tracking-wider text-rose-700 dark:text-rose-405">
              Esgotado
            </span>
          </div>

          {/* Minecraft */}
          <div className="flex items-center gap-2.5 px-3 py-1.5 bg-emerald-50/40 dark:bg-emerald-950/10 border-2 border-black dark:border-zinc-800 rounded-none shadow-[2px_2px_0_0_#000] dark:shadow-[2px_2px_0_0_rgba(255,255,255,0.05)] transition-all">
            <div className="h-2 w-2 rounded-full bg-[#10B981] shadow-[0_0_8px_rgba(16,185,129,0.6)] shrink-0 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400 font-minecraft">
              Aula com Minecraft
            </span>
          </div>

          {/* Mini Legenda do Mapa de Calor (Discreta e Inline - Apenas Visão Semanal) */}
          {viewMode === 'weekly' && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-50/20 dark:bg-zinc-900/10 border-2 border-black dark:border-zinc-800 rounded-none shadow-[2px_2px_0_0_#000] dark:shadow-[2px_2px_0_0_rgba(255,255,255,0.02)] transition-all">
              <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500">
                Mapa de Calor:
              </span>
              <div className="flex gap-[1px] h-3.5 w-16 border border-black/30 dark:border-white/20 p-[1px] bg-white dark:bg-zinc-900 shrink-0">
                <div className="flex-1 bg-zinc-200/60 dark:bg-zinc-700/30 hover:scale-110 transition-transform cursor-help" title="Totalmente Livre (0% de uso)" />
                <div className="flex-1 bg-amber-300 dark:bg-amber-400 hover:scale-110 transition-transform cursor-help" title="Pouco Uso (1% a 29% reservado)" />
                <div className="flex-1 bg-orange-400 hover:scale-110 transition-transform cursor-help" title="Uso Parcial (30% a 74% reservado)" />
                <div className="flex-1 bg-orange-600 dark:bg-orange-500 hover:scale-110 transition-transform cursor-help" title="Alta Ocupação (75% a 99% reservado)" />
                <div className="flex-1 bg-red-600 dark:bg-red-500 hover:scale-110 transition-transform cursor-help" title="Totalmente Esgotado (100% de ocupação)" />
              </div>
              <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-tight hidden sm:inline">
                (Passe o cursor sobre os blocos do dia)
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  </Layout>;
};
export default SchedulingPage;

