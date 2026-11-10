import React, { useState, useMemo, useEffect, useRef } from 'react';
import { toast } from '@/hooks/use-toast';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import '@/styles/scheduling-glass-nav.css';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { ChevronLeft, ChevronRight, Calendar, Loader2, Monitor, AlertTriangle, CalendarDays, CalendarRange, Plus } from 'lucide-react';
import { useDatabase } from '@/hooks/useDatabase';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format, startOfMonth, endOfMonth, isSaturday, isSunday, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getStartOfWeek, formatWeekRange, changeWeek, getWeekDays, changeMonth, getInitialSchedulingDate } from '@/utils/scheduling';
import { SchedulingCalendar } from '@/components/scheduling/SchedulingCalendar';
import { SchedulingMonthView } from '@/components/scheduling/SchedulingMonthView';
import { MyReservationsView } from '@/components/scheduling/MyReservationsView';
import { LiquidGlassNav } from '@/components/scheduling/LiquidGlassNav';
import { getUserReservations } from '@/services/reservationService';
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
  const shouldReduceMotion = useReducedMotion();
  const [currentDate, setCurrentDate] = useState(getInitialSchedulingDate());
  const [viewMode, setViewMode] = useState<'weekly' | 'monthly' | 'my_reservations'>('weekly');
  const lastWeeklyDate = useRef<Date | null>(null);
  const lastMonthlyDate = useRef<Date | null>(null);
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
    enabled: !!user && viewMode !== 'my_reservations'
  });
  const {
    data: userUpcomingCount = 0,
    refetch: refetchUserCount
  } = useQuery({
    queryKey: ['userReservationsCount', user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;
      const list = await getUserReservations(user.id);
      const now = new Date();
      return list.filter(res => {
        const [h, m] = (res.time_slot || '00h00').split('h');
        const dt = new Date(`${res.date}T${(h || '0').padStart(2, '0')}:${(m || '0').padStart(2, '0')}:00`);
        const end = new Date(dt.getTime() + 50 * 60 * 1000);
        return end >= now;
      }).length;
    },
    enabled: !!user?.id,
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
  const handleViewModeChange = (v: 'weekly' | 'monthly' | 'my_reservations') => {
    // Salva a data atual da aba que esta sendo deixada
    if (viewMode === 'weekly') {
      lastWeeklyDate.current = currentDate;
    } else if (viewMode === 'monthly') {
      lastMonthlyDate.current = currentDate;
    }
    setViewMode(v);
    if (v === 'weekly') {
      setCurrentDate(lastWeeklyDate.current ?? getStartOfWeek(new Date()));
    } else if (v === 'monthly') {
      setCurrentDate(lastMonthlyDate.current ?? startOfMonth(currentDate));
    }
    // 'my_reservations': nao altera currentDate

    if (typeof window !== 'undefined') {
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
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
    toast({ title: "Limite atualizado", description: `Limite operacional definido para ${newLimit} Chromebooks.`, variant: "success" });
  };

  const handleReservationSuccess = () => {
    refetch();
    refetchUserCount();
    queryClient.invalidateQueries({
      queryKey: ['totalAvailableChromebooks']
    });
    queryClient.invalidateQueries({
      queryKey: ['userReservations']
    });
    queryClient.invalidateQueries({
      queryKey: ['userReservationsCount']
    });
  };

  const handleNewReservationFromMonth = (targetDate: Date) => {
    setCurrentDate(targetDate);
    setViewMode('weekly');
    toast({
      title: "Selecione o horário",
      description: `Grade da semana de ${format(targetDate, "dd/MM", { locale: ptBR })}. Escolha o horário para agendar.`,
    });
  };

  // Sincronização em tempo real via Supabase Realtime
  useEffect(() => {
    const channel = supabase
      .channel('schema-db-changes-reservations')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reservations',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['reservations'] });
          queryClient.invalidateQueries({ queryKey: ['totalAvailableChromebooks'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'loans',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['reservations'] });
          queryClient.invalidateQueries({ queryKey: ['totalAvailableChromebooks'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'returns',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['reservations'] });
          queryClient.invalidateQueries({ queryKey: ['totalAvailableChromebooks'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const isLoading = isLoadingTotal || isLoadingReservations || isLoadingProfessores;

  return (
    <Layout title="Agendamento" showBackButton onBack={() => navigate('/')}>
      <div className="space-y-4 sm:space-y-6 max-w-7xl mx-auto relative z-10 pb-28 sm:pb-32">
      {/* ── Glass Nav Row ── Week Selector + Year/Month Selector (Visível apenas em Semanal e Histórico) ── */}
      {viewMode !== 'my_reservations' && (
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="period-bar"
        >
          {/* ── Week / Period Navigator ── */}
          <div className="period-bar__surface period-bar__period">
            <button
              onClick={() => handleDateChange('prev')}
              disabled={isLoading}
              className="period-bar__arrow period-bar__arrow--left"
              aria-label="Período anterior"
            >
              <ChevronLeft size={16} strokeWidth={2.5} />
            </button>

            <div className="period-bar__period-label">
              {displayRange}
            </div>

            <button
              onClick={() => handleDateChange('next')}
              disabled={isLoading}
              className="period-bar__arrow period-bar__arrow--right"
              aria-label="Próximo período"
            >
              <ChevronRight size={16} strokeWidth={2.5} />
            </button>
          </div>

          {/* ── Year + Month Selector ── */}
          <div className="period-bar__surface">
            {/* Year control */}
            <div className="period-bar__year-control">
              <button
                onClick={() => setCurrentDate(new Date(currentDate.getFullYear() - 1, currentDate.getMonth(), 1))}
                className="period-bar__year-btn"
                aria-label="Ano anterior"
              >
                <ChevronLeft size={14} strokeWidth={2.5} />
              </button>
              <span className="period-bar__year-value">{currentDate.getFullYear()}</span>
              <button
                onClick={() => setCurrentDate(new Date(currentDate.getFullYear() + 1, currentDate.getMonth(), 1))}
                className="period-bar__year-btn"
                aria-label="Próximo ano"
              >
                <ChevronRight size={14} strokeWidth={2.5} />
              </button>
            </div>

            {/* Month pills */}
            <div className="period-bar__months">
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
                        'period-bar__month-pill',
                        isCurrentMonth && 'period-bar__month-pill--active'
                      )}
                    >
                      {format(date, 'MMM', { locale: ptBR }).replace('.', '')}
                      {isTodayMonth && !isCurrentMonth && (
                        <span className="period-bar__today-dot" aria-hidden />
                      )}
                    </motion.button>
                  );
                })}
              </AnimatePresence>

              <button
                onClick={() => setIsMonthsExpanded(!isMonthsExpanded)}
                className="period-bar__expand-btn"
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
      )}

      {/* Weekend Warning */}
      {viewMode === 'weekly' && getWeekDays(currentDate).length === 0 && <div className="mt-4 p-3 border-3 border-warning/50 bg-warning/10 flex items-center gap-2">
        <AlertTriangle className="h-5 w-5 text-warning" />
        <span className="text-sm font-bold uppercase tracking-tight">
          Final de semana selecionado. Não há horários disponíveis.
        </span>
      </div>}

      {/* Calendar Grid - Neo Brutal - Slimmer */}
      <motion.div
        initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.4, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        className="w-full overflow-visible"
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={viewMode}
            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{
              duration: 0.22,
              exit: { duration: 0.12 },
              ease: 'easeOut',
            }}
            className="w-full"
          >
            {viewMode === 'weekly' ? (
              <SchedulingCalendar
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
              />
            ) : viewMode === 'monthly' ? (
              <SchedulingMonthView
                currentDate={currentDate}
                reservations={reservations}
                totalAvailableChromebooks={operationalLimit}
                isLoading={isLoading}
                onReservationSuccess={handleReservationSuccess}
                onNewReservation={handleNewReservationFromMonth}
              />
            ) : (
              <MyReservationsView
                currentUser={user}
                onReservationSuccess={handleReservationSuccess}
                onGoToCalendar={() => handleViewModeChange('weekly')}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </motion.div>

      {/* Legenda Discreta e Polida (Apenas Visão Semanal) */}
      {viewMode === 'weekly' && (
        <div className="pt-2 pb-6 flex justify-center">
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 px-4 py-2 rounded-2xl bg-card/70 dark:bg-card/50 backdrop-blur-md border border-border/70 shadow-sm text-xs text-muted-foreground">
            <span className="font-semibold text-foreground/70 text-[11px] uppercase tracking-wider">
              Legenda:
            </span>

            {/* Minha Reserva */}
            <div className="flex items-center gap-1.5" title="Horário agendado por você">
              <span className="h-2.5 w-2.5 rounded-full bg-blue-500 ring-2 ring-blue-500/20 shrink-0" />
              <span className="font-medium text-foreground/90">Minha Reserva</span>
            </div>

            {/* Disponível */}
            <div className="flex items-center gap-1.5" title="Totalmente livre para agendamento">
              <span className="h-2.5 w-2.5 rounded-full border border-dashed border-muted-foreground/60 bg-transparent shrink-0" />
              <span className="font-medium text-foreground/90">Disponível</span>
            </div>

            {/* Parcial */}
            <div className="flex items-center gap-1.5" title="Parte dos Chromebooks já foi reservada">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-400 ring-2 ring-amber-400/20 shrink-0" />
              <span className="font-medium text-foreground/90">Parcial</span>
            </div>

            {/* Esgotado */}
            <div className="flex items-center gap-1.5" title="Todos os Chromebooks do horário estão ocupados">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-500 ring-2 ring-rose-500/20 shrink-0" />
              <span className="font-medium text-foreground/90">Esgotado</span>
            </div>

            {/* Minecraft */}
            <div className="flex items-center gap-1.5" title="Aula com uso da licença Minecraft">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20 shrink-0" />
              <span className="font-medium text-foreground/90">Minecraft</span>
            </div>

            {/* Não Retirada */}
            <div className="flex items-center gap-1.5" title="Reserva cujo horário expirou sem retirada dos equipamentos">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500 ring-2 ring-amber-500/30 shrink-0 flex items-center justify-center text-[8px] text-black font-black">!</span>
              <span className="font-medium text-amber-600 dark:text-amber-400">Não Retirada</span>
            </div>

            {/* Divisor */}
            <div className="hidden sm:block w-px h-3.5 bg-border shrink-0" />

            {/* Mapa de Calor Discreto */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-muted-foreground">Ocupação:</span>
              <div 
                className="flex items-center gap-0.5 h-2 w-14 rounded-full overflow-hidden bg-muted p-0.5" 
                title="Mapa de calor: verde (livre) ➔ amarelo/laranja (parcial) ➔ vermelho (esgotado)"
              >
                <div className="h-full flex-1 rounded-full bg-emerald-400" />
                <div className="h-full flex-1 rounded-full bg-amber-400" />
                <div className="h-full flex-1 rounded-full bg-orange-500" />
                <div className="h-full flex-1 rounded-full bg-red-500" />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>

      {/* Barra de Navegação Inferior Liquid Glass */}
      <LiquidGlassNav
        activeTab={viewMode}
        onTabChange={handleViewModeChange}
        badgeCount={userUpcomingCount}
        variant="glass"
      />
    </Layout>
  );
};
export default SchedulingPage;

