import React, { useState, useMemo, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import '@/styles/scheduling-glass-nav.css';
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
  }, [isLoadingTotal, totalAvailableChromebooks, getSystemSetting]);

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

  // ── Controls injected into the TopBar ──────────────────────────────
  const topBarControls = (
    <div className="flex items-center gap-3">
      {/* Page title */}
      <span className="hidden sm:block text-white/90 font-semibold text-sm tracking-tight">
        Agendamento
      </span>
      <div className="w-px h-4 bg-white/25 hidden sm:block" aria-hidden />
      {/* View toggle */}
      <div className="flex items-center gap-0.5 p-0.5 rounded-lg bg-white/15 backdrop-blur-sm border border-white/20">
        <button
          onClick={() => handleViewModeChange('weekly')}
          className={cn(
            'px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wide transition-all duration-200',
            viewMode === 'weekly'
              ? 'bg-white text-primary shadow-sm'
              : 'text-white/80 hover:text-white hover:bg-white/10'
          )}
        >
          Semanal
        </button>
        <button
          onClick={() => handleViewModeChange('monthly')}
          className={cn(
            'px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wide transition-all duration-200',
            viewMode === 'monthly'
              ? 'bg-white text-primary shadow-sm'
              : 'text-white/80 hover:text-white hover:bg-white/10'
          )}
        >
          Histórico
        </button>
      </div>
    </div>
  );

  return <Layout title="Agendamento" showBackButton onBack={() => navigate('/')} headerRight={topBarControls}>

    <div className="space-y-4 sm:space-y-6 max-w-7xl mx-auto relative z-10">
      {/* ── Glass Nav Row ── Week Selector + Year/Month Selector ── */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
        className="glass-nav"
      >
        {/* ── Week / Period Navigator ── */}
        <div className="glass-nav__surface glass-nav__period">
          <button
            onClick={() => handleDateChange('prev')}
            disabled={isLoading}
            className="glass-nav__arrow glass-nav__arrow--left"
            aria-label="Período anterior"
          >
            <ChevronLeft size={16} strokeWidth={2.5} />
          </button>

          <div className="glass-nav__period-label">
            {displayRange}
          </div>

          <button
            onClick={() => handleDateChange('next')}
            disabled={isLoading}
            className="glass-nav__arrow glass-nav__arrow--right"
            aria-label="Próximo período"
          >
            <ChevronRight size={16} strokeWidth={2.5} />
          </button>
        </div>

        {/* ── Year + Month Selector ── */}
        <div className="glass-nav__surface">
          {/* Year control */}
          <div className="glass-nav__year-control">
            <button
              onClick={() => setCurrentDate(new Date(currentDate.getFullYear() - 1, currentDate.getMonth(), 1))}
              className="glass-nav__year-btn"
              aria-label="Ano anterior"
            >
              <ChevronLeft size={14} strokeWidth={2.5} />
            </button>
            <span className="glass-nav__year-value">{currentDate.getFullYear()}</span>
            <button
              onClick={() => setCurrentDate(new Date(currentDate.getFullYear() + 1, currentDate.getMonth(), 1))}
              className="glass-nav__year-btn"
              aria-label="Próximo ano"
            >
              <ChevronRight size={14} strokeWidth={2.5} />
            </button>
          </div>

          {/* Month pills */}
          <div className="glass-nav__months">
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
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.85 }}
                    onClick={() => {
                      let targetDate = new Date(currentDate.getFullYear(), i, 1);
                      if (isSaturday(targetDate)) targetDate = addDays(targetDate, 2);
                      else if (isSunday(targetDate)) targetDate = addDays(targetDate, 1);
                      setCurrentDate(targetDate);
                    }}
                    className={cn(
                      'glass-nav__month-pill',
                      isCurrentMonth && 'glass-nav__month-pill--active'
                    )}
                  >
                    {format(date, 'MMM', { locale: ptBR }).replace('.', '')}
                    {isTodayMonth && !isCurrentMonth && (
                      <span className="glass-nav__today-dot" aria-hidden />
                    )}
                  </motion.button>
                );
              })}
            </AnimatePresence>

            <button
              onClick={() => setIsMonthsExpanded(!isMonthsExpanded)}
              className="glass-nav__expand-btn"
              title={isMonthsExpanded ? 'Ver menos' : 'Ver todos os meses'}
              aria-label="Alternar meses"
            >
              <motion.div animate={{ rotate: isMonthsExpanded ? 45 : 0 }} transition={{ type: 'spring', stiffness: 200 }}>
                <Plus size={14} strokeWidth={2.5} />
              </motion.div>
            </button>
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

