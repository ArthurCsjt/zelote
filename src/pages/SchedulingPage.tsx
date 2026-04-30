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
      <div className="relative mb-2">
        {/* Camada da Sombra - Reta conforme pedido */}
        <div className="absolute inset-0 translate-x-[4px] translate-y-[4px] bg-black dark:bg-white rounded-none -z-10" />
        
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          className="bg-white dark:bg-zinc-900 border-[3px] border-black dark:border-white overflow-hidden relative z-0"
        >
          <div className="flex flex-col">
            {/* ROW 1: Glued Title + Padded Toggle */}
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between">
            {/* Identificador Industrial de Agendamento */}
            <div className="flex items-center gap-3 lg:gap-4 h-12 lg:h-14 px-4 lg:px-6 border-b-[3px] border-r-[3px] border-black dark:border-white bg-white dark:bg-zinc-900 shrink-0 group relative overflow-hidden">
              {/* Efeito de brilho sutil no hover */}
              <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className="relative flex items-center justify-center">
                <div className="absolute inset-0 bg-primary/20 blur-sm rounded-full animate-pulse group-hover:bg-primary/30 transition-all" />
                <Calendar className="h-5 w-5 lg:h-6 lg:w-6 text-primary relative z-10" strokeWidth={2.5} />
                {/* Ponto de status ativo */}
                <div className="absolute -top-0.5 -right-0.5 w-2 lg:w-2.5 h-2 lg:h-2.5 bg-primary rounded-full border-[3px] border-white dark:border-zinc-900 z-20" />
              </div>

              <div className="flex flex-col justify-center leading-tight relative z-10">
                <h1 className="text-sm lg:text-xl font-[1000] uppercase tracking-[0.1em] text-black dark:text-white">
                  Agendamento
                </h1>
                <div className="flex items-center gap-2">
                  <span className="text-[7px] lg:text-[8px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">
                    Unidade de Controle
                  </span>
                </div>
              </div>
            </div>

              {/* Right side: View Toggle - Com padding para não encostar na borda direita */}
              <div className="flex items-center p-2 lg:p-4 lg:pb-4">
                <div className="flex h-8 border-[3px] border-black dark:border-zinc-700 bg-white dark:bg-zinc-950 shadow-none overflow-hidden transition-all rounded-none">
                  <button
                    onClick={() => handleViewModeChange('weekly')}
                    className={cn(
                      "px-4 text-[9px] font-[1000] uppercase tracking-widest transition-all duration-150 border-r-[3px] border-black dark:border-zinc-700",
                      viewMode === 'weekly'
                        ? "bg-primary text-primary-foreground shadow-[inset_1px_1px_0_0_rgba(0,0,0,0.2)]"
                        : "bg-white dark:bg-zinc-950 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900"
                    )}
                  >
                    Semanal
                  </button>
                  <button
                    onClick={() => handleViewModeChange('monthly')}
                    className={cn(
                      "px-4 text-[9px] font-[1000] uppercase tracking-widest transition-all duration-150",
                      viewMode === 'monthly'
                        ? "bg-primary text-primary-foreground shadow-[inset_1px_1px_0_0_rgba(0,0,0,0.2)]"
                        : "bg-white dark:bg-zinc-950 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900"
                    )}
                  >
                    Histórico
                  </button>
                </div>
              </div>
            </div>

            <div className="p-2 lg:p-4 pt-0 flex flex-col gap-3">
              {/* ROW 2: Date Navigator (left) | Months Grid (right) — alinhados */}
              <div className="flex flex-col lg:flex-row lg:items-stretch lg:justify-between gap-3">
            {/* Date Navigator com pontas coloridas */}
            {/* Date Navigator Estilo "Hub de Controle" */}
            <div className="flex h-12 lg:h-14 border-[3px] border-black dark:border-zinc-700 bg-white dark:bg-zinc-950 shadow-none flex-1 lg:max-w-2xl overflow-hidden transition-all rounded-none group/nav">
              <button
                onClick={() => handleDateChange('prev')}
                disabled={isLoading}
                className="flex items-center justify-center w-12 lg:w-14 border-r-[3px] border-black dark:border-zinc-700 bg-zinc-50 dark:bg-white/[0.03] hover:bg-primary hover:text-white dark:hover:bg-primary transition-all active:scale-95 disabled:opacity-30 shrink-0"
                aria-label="Anterior"
              >
                <ChevronLeft className="h-4 w-4 lg:h-5 lg:w-5" strokeWidth={3} />
              </button>
              
              <div className="flex-1 flex flex-col items-center justify-center px-2 lg:px-4 relative overflow-hidden group">
                {/* Indicador de topo sutil */}
                <div className="absolute top-0 left-0 right-0 h-[1px] bg-black/5 dark:bg-white/5" />
                
                <div className="flex items-center gap-1 lg:gap-2">
                  <div className="w-1 h-1 rounded-full bg-primary animate-pulse" />
                  <span className="text-[9px] lg:text-[11px] font-[1000] uppercase tracking-[0.1em] lg:tracking-[0.15em] text-black dark:text-white whitespace-nowrap text-center">
                    {displayRange}
                  </span>
                </div>
                
                <span className="hidden lg:block text-[7px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.3em] mt-1 transition-all group-hover/nav:text-primary">
                  Janela de Tempo Ativa
                </span>

                {/* Grid de fundo ultra sutil */}
                <div className="absolute inset-0 opacity-[0.02] pointer-events-none neo-brutal-dots scale-50" />
              </div>

              <button
                onClick={() => handleDateChange('next')}
                disabled={isLoading}
                className="flex items-center justify-center w-12 lg:w-14 border-l-[3px] border-black dark:border-zinc-700 bg-zinc-50 dark:bg-white/[0.03] hover:bg-primary hover:text-white dark:hover:bg-primary transition-all active:scale-95 disabled:opacity-30 shrink-0"
                aria-label="Próximo"
              >
                <ChevronRight className="h-4 w-4 lg:h-5 lg:w-5" strokeWidth={3} />
              </button>
            </div>

            {/* Months grid - card container */}
            <div className="h-12 lg:h-14 px-2 lg:px-3 border-[3px] border-black dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 shadow-none flex flex-col sm:flex-row items-center gap-2 lg:gap-3 rounded-none">
              {/* Year selector mais discreto */}
              <div className="flex items-center gap-0.5 shrink-0 pr-3 border-r border-black/10 dark:border-white/10">
                <button
                  onClick={() => setCurrentDate(new Date(currentDate.getFullYear() - 1, currentDate.getMonth(), 1))}
                  className="p-1 text-zinc-400 hover:text-primary transition-colors"
                >
                  <ChevronLeft className="h-3.5 w-3.5" strokeWidth={3} />
                </button>
                <div className="px-1 text-[11px] font-black text-zinc-900 dark:text-zinc-100 tabular-nums">
                  {currentDate.getFullYear()}
                </div>
                <button
                  onClick={() => setCurrentDate(new Date(currentDate.getFullYear() + 1, currentDate.getMonth(), 1))}
                  className="p-1 text-zinc-400 hover:text-primary transition-colors"
                >
                  <ChevronRight className="h-3.5 w-3.5" strokeWidth={3} />
                </button>
              </div>

              {/* Months list - expansível e elegante */}
              <div className="flex items-center gap-x-0.5 h-full overflow-hidden">
                <AnimatePresence mode="popLayout">
                  {Array.from({ length: 12 }, (_, i) => {
                    const date = new Date(new Date().getFullYear(), i, 1);
                    const isCurrentMonth = i === currentDate.getMonth();
                    const isTodayMonth = i === new Date().getMonth() && currentDate.getFullYear() === new Date().getFullYear();
                    
                    // Lógica para mostrar apenas o atual + próximos 3, ou todos se expandido
                    // Também garante que o mês selecionado apareça
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
                          "relative px-2.5 h-full text-[10px] font-black uppercase tracking-tight transition-all duration-200 flex items-center justify-center group shrink-0",
                          isCurrentMonth
                            ? "text-primary"
                            : "text-zinc-400 dark:text-zinc-600 hover:text-black dark:hover:text-white"
                        )}
                      >
                        <span className="relative z-10">
                          {format(date, 'MMM', { locale: ptBR }).replace('.', '')}
                        </span>
                        
                        {isCurrentMonth && (
                          <motion.div
                            layoutId="activeMonthUnderline"
                            className="absolute bottom-2 left-2 right-2 h-0.5 bg-primary rounded-full"
                            transition={{ type: "spring", stiffness: 380, damping: 30 }}
                          />
                        )}

                        {isTodayMonth && !isCurrentMonth && (
                          <div className="absolute top-3 right-1 w-1 h-1 bg-primary rounded-full animate-pulse" />
                        )}
                        
                        {!isCurrentMonth && (
                          <div className="absolute bottom-2 left-2 right-2 h-0.5 bg-zinc-200 dark:bg-zinc-800 scale-x-0 group-hover:scale-x-100 transition-transform duration-200 rounded-full" />
                        )}
                      </motion.button>
                    );
                  })}
                </AnimatePresence>

                {/* Botão discreto para expandir/recolher */}
                <button
                  onClick={() => setIsMonthsExpanded(!isMonthsExpanded)}
                  className="ml-1 p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors group"
                  title={isMonthsExpanded ? "Ver menos" : "Ver todos os meses"}
                >
                  <motion.div
                    animate={{ rotate: isMonthsExpanded ? 45 : 0 }}
                    transition={{ type: "spring", stiffness: 200 }}
                  >
                    <Plus className={cn(
                      "h-3.5 w-3.5 transition-colors",
                      isMonthsExpanded ? "text-primary" : "text-zinc-400 group-hover:text-black dark:group-hover:text-white"
                    )} />
                  </motion.div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  </div>

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