import React, { useMemo, useRef, useEffect, useState } from 'react';
import { format, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { timeSlots, getWeekDays } from '@/utils/scheduling';
import { SchedulingSlot } from './SchedulingSlot';
import type { Reservation } from '@/hooks/useDatabase';
import type { User as AuthUser } from '@supabase/supabase-js';
import { Loader2, CheckCircle, AlertTriangle, Monitor, Laptop, Clock, Info, GripVertical, ArrowRight, ArrowDown } from 'lucide-react';
import { motion, useMotionValue, useSpring, AnimatePresence } from 'framer-motion';

interface SchedulingCalendarProps {
  currentDate: Date;
  reservations: Reservation[];
  totalAvailableChromebooks: number;
  currentUser: AuthUser | null;
  isLoading: boolean;
  onReservationSuccess: () => void;
  onUpdateLimit: (newLimit: number) => void;
  professores: { id: string; nome_completo: string }[];
  physicalTotal?: number;
}

export const SchedulingCalendar: React.FC<SchedulingCalendarProps> = ({
  currentDate,
  reservations,
  totalAvailableChromebooks,
  currentUser,
  isLoading,
  onReservationSuccess,
  onUpdateLimit,
  professores,
  physicalTotal = 0,
}) => {
  const [isEditingLimit, setIsEditingLimit] = useState(false);
  const [newLimit, setNewLimit] = useState(totalAvailableChromebooks.toString());

  // Sincroniza o valor do input quando a prop muda (ex: após carregar do banco)
  useEffect(() => {
    setNewLimit(totalAvailableChromebooks.toString());
  }, [totalAvailableChromebooks]);

  const [hoveredDate, setHoveredDate] = React.useState<string | null>(null);
  const [hoveredTime, setHoveredTime] = React.useState<string | null>(null);
  const [hoveredHeatmapInfo, setHoveredHeatmapInfo] = React.useState<{ date: string; slot: string; usage: number } | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const constraintsRef = useRef<HTMLDivElement>(null);

  const weekDays = getWeekDays(currentDate);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const { reservationsMap, dailyTotals, dailySlotsData } = useMemo(() => {
    const map = new Map<string, Reservation[]>();
    const totals = new Map<string, number>();
    const slotsData = new Map<string, Map<string, number>>();

    reservations.forEach(res => {
      const key = `${res.date}_${res.time_slot}`;
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key)?.push(res);

      const currentTotal = totals.get(res.date) || 0;
      totals.set(res.date, currentTotal + (res.quantity_requested || 0));

      if (!slotsData.has(res.date)) {
        slotsData.set(res.date, new Map());
      }
      const daySlots = slotsData.get(res.date)!;
      const slotUsage = daySlots.get(res.time_slot) || 0;
      daySlots.set(res.time_slot, slotUsage + (res.quantity_requested || 0));
    });

    return {
      reservationsMap: map,
      dailyTotals: totals,
      dailySlotsData: slotsData
    };
  }, [reservations]);

  // Responsive sizes
  const timeColumnWidth = isMobile ? 60 : 100;
  const dayColumnMinWidth = isMobile ? 120 : 160;
  const totalMinWidth = timeColumnWidth + (weekDays.length * dayColumnMinWidth);
  const gridTemplateColumns = `${timeColumnWidth}px repeat(${weekDays.length}, 1fr)`;
  const GridContainer = (isMobile ? 'div' : motion.div) as any;

  if (isLoading) {
    return (
      <div className="space-y-4 relative overflow-hidden">
        {/* Mobile Hint - Professional Indicator */}
        {isMobile && (
          <div className="flex items-center justify-center gap-2 mb-2 opacity-50">
            <GripVertical className="h-3 w-3 text-muted-foreground" />
            <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">
              Carregando estrutura...
            </span>
          </div>
        )}

        <div className="relative border-4 border-black dark:border-white shadow-[12px_12px_0px_0px_rgba(0,0,0,0.05)] bg-white dark:bg-zinc-950 overflow-hidden">
          <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.07] pointer-events-none neo-brutal-dots font-black text-black" />

          <div
            className="grid gap-0 relative z-10 select-none animate-pulse"
            style={{
              gridTemplateColumns,
              minWidth: totalMinWidth,
              width: '100%'
            }}
          >
            {/* Header Row: Total Chromebooks Skeleton */}
            <div className={cn(
              "h-32 sm:h-36 flex flex-col items-center justify-center border-b-4 border-r-4 border-black dark:border-white bg-zinc-200 dark:bg-zinc-800 relative overflow-hidden",
              `min-w-[${timeColumnWidth}px]`
            )}>
              <div className="w-8 h-8 rounded bg-zinc-300 dark:bg-zinc-700 animate-pulse mb-2" />
              <div className="w-12 h-4 rounded bg-zinc-300 dark:bg-zinc-700 animate-pulse" />
            </div>

            {/* Header Row: 5 Week Days Skeletons */}
            {weekDays.map((_, index) => (
              <div
                key={index}
                className="min-h-[8rem] sm:min-h-[9rem] flex flex-col border-b-4 border-r-4 last:border-r-0 border-black dark:border-white bg-zinc-50 dark:bg-zinc-900/50 p-3 sm:p-4 justify-between"
              >
                <div className="w-16 h-3 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
                <div className="w-10 h-6 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
                <div className="w-full h-4 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse mt-2" />
              </div>
            ))}

            {/* Time Slot Rows (6 periods) */}
            {timeSlots.map((timeSlot, timeIndex) => (
              <React.Fragment key={timeIndex}>
                {/* Time Column Cell */}
                <div className="min-h-[4rem] sm:min-h-[5rem] h-full flex items-center justify-center border-b-2 border-r-4 border-black/10 dark:border-white/10 bg-zinc-100/50 dark:bg-zinc-900/20">
                  <div className="w-12 h-6 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
                </div>

                {/* 5 Slots */}
                {weekDays.map((_, dayIndex) => (
                  <div
                    key={dayIndex}
                    className="min-h-[4rem] sm:min-h-[5rem] h-full border-b border-r last:border-r-0 border-zinc-200 dark:border-zinc-800 p-2 flex items-center justify-center bg-zinc-50/20 dark:bg-zinc-950/20"
                  >
                    <div className="w-full h-full min-h-[3rem] border-2 border-dashed border-zinc-200 dark:border-zinc-800 flex flex-col items-center justify-center p-2 gap-1 animate-pulse">
                      <div className="w-1/2 h-2.5 rounded bg-zinc-100 dark:bg-zinc-900" />
                      <div className="w-3/4 h-2 rounded bg-zinc-100 dark:bg-zinc-900" />
                    </div>
                  </div>
                ))}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 relative overflow-hidden">
      {/* Mobile Hint - Professional Indicator */}
      {isMobile && (
        <div className="flex items-center justify-center gap-2 mb-2 animate-pulse">
          <GripVertical className="h-3 w-3 text-muted-foreground" />
          <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">
            Arraste lateralmente para navegar
          </span>
        </div>
      )}

      <div
        ref={constraintsRef}
        className="relative border-4 border-black dark:border-white shadow-[12px_12px_0px_0px_rgba(0,0,0,0.05)] bg-white dark:bg-zinc-950 overflow-x-auto md:overflow-hidden scrollbar-none cursor-grab active:cursor-grabbing"
      >
        <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.07] pointer-events-none neo-brutal-dots font-black text-black" />

        <GridContainer
          {...(!isMobile ? {
            drag: "x",
            dragConstraints: constraintsRef,
            dragElastic: 0.1,
            onMouseLeave: () => {
              setHoveredDate(null);
              setHoveredTime(null);
            }
          } : {})}
          className="grid gap-0 relative z-10 select-none"
          style={{
            gridTemplateColumns,
            minWidth: totalMinWidth,
            width: '100%',
            touchAction: isMobile ? 'pan-x pan-y' : 'none'
          }}
        >
          {/* Header Row */}
          <div 
            className={cn(
              "h-32 sm:h-36 flex flex-col border-b-4 border-r-4 border-black dark:border-white bg-white dark:bg-zinc-900 relative overflow-hidden transition-all sticky left-0 z-30",
              `min-w-[${timeColumnWidth}px]`
            )}
            style={{ left: -4 }}
          >
            <div className="absolute inset-0 opacity-[0.05] dark:opacity-10 pointer-events-none z-0"
              style={{
                backgroundImage: `radial-gradient(circle, currentColor 1px, transparent 1px)`,
                backgroundSize: '8px 8px'
              }}
            />

            {/* Top Half - Available Chromebooks */}
            <div className="flex-1 flex flex-col items-center justify-center relative z-10">
              <div
                className={cn(
                  "relative z-10 flex flex-col items-center p-1 sm:p-2",
                  (currentUser?.email === 'arthur.alencar@colegiosaojudas.com.br' || (currentUser as any)?.role === 'admin') && "cursor-pointer group/edit"
                )}
                onClick={() => {
                  if (currentUser?.email === 'arthur.alencar@colegiosaojudas.com.br' || (currentUser as any)?.role === 'admin') {
                    setIsEditingLimit(true);
                  }
                }}
              >
                {isEditingLimit ? (
                  <div className="flex flex-col items-center gap-1 animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                    <input
                      type="number"
                      value={newLimit}
                      onChange={(e) => setNewLimit(e.target.value)}
                      className="w-12 h-6 text-center bg-white border-2 border-black text-black font-black text-[11px] focus:outline-none focus:ring-0"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const val = parseInt(newLimit);
                          if (!isNaN(val) && val >= 0) {
                            onUpdateLimit(val);
                            setIsEditingLimit(false);
                          }
                        }
                        if (e.key === 'Escape') {
                          setIsEditingLimit(false);
                          setNewLimit(totalAvailableChromebooks.toString());
                        }
                      }}
                    />
                    <div className="flex gap-1">
                      <button
                        onClick={() => {
                          const val = parseInt(newLimit);
                          if (!isNaN(val) && val >= 0) {
                            onUpdateLimit(val);
                            setIsEditingLimit(false);
                          }
                        }}
                        className="bg-black text-white text-[7px] px-1 py-0.5 font-black uppercase"
                      >
                        Salvar
                      </button>
                      <button
                        onClick={() => setIsEditingLimit(false)}
                        className="bg-white text-black border border-black text-[7px] px-1 py-0.5 font-black uppercase"
                      >
                        X
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-col items-center leading-none gap-1">
                      <div className="flex items-center gap-1.5">
                        <Monitor className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-primary" strokeWidth={3} />
                        <span className="text-[8px] sm:text-[9px] font-black uppercase text-zinc-400 dark:text-zinc-500 tracking-[0.2em]">
                          Frota
                        </span>
                      </div>
                      <span className="text-2xl sm:text-3xl font-black tabular-nums text-black dark:text-white tracking-tighter">
                        {totalAvailableChromebooks}
                      </span>
                      <span className="text-[7px] sm:text-[9px] font-black uppercase text-zinc-600 dark:text-zinc-300 tracking-[0.25em] text-center">
                        {isMobile ? 'Disp.' : 'Disponíveis'}
                      </span>
                      {(currentUser?.email === 'arthur.alencar@colegiosaojudas.com.br' || (currentUser as any)?.role === 'admin') && (
                        <span className="text-[6px] sm:text-[7px] font-black tabular-nums px-1.5 py-0.5 border border-black/40 dark:border-white/30 bg-zinc-50 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">
                          Físico · {physicalTotal}
                        </span>
                      )}
                    </div>
                  </>

                )}
              </div>
            </div>

            {/* Bottom Half - Heatmap Indicator Label aligned with daily heatmaps */}
            <div className="px-1 py-1 sm:px-2 sm:py-1.5 border-t-4 border-black dark:border-white bg-zinc-50 dark:bg-zinc-950 relative z-10 flex flex-col justify-between items-center h-[40px] sm:h-[50px] select-none shrink-0 w-full overflow-hidden">
              <div className="flex-1 flex flex-col justify-center items-center">
                <span className="text-[7.5px] sm:text-[9.5px] font-[1000] uppercase tracking-tight text-black dark:text-white text-center leading-none">
                  Mapa de Calor
                </span>
                <div className="flex items-center gap-0.5 mt-0.5 text-zinc-500 dark:text-zinc-400 shrink-0 scale-90 sm:scale-100 transition-transform">
                  <span className="text-[5.5px] sm:text-[7.5px] font-[1000] uppercase tracking-wider leading-none">
                    Chromebooks
                  </span>
                  <ArrowRight className="h-1.5 w-1.5 sm:h-2 sm:w-2 stroke-[3.5]" />
                </div>
              </div>

              {/* Discrete block legend perfectly matching the 6 heatmap columns */}
              <div className="flex w-full h-[6px] sm:h-[8px] gap-[2px] relative z-20 justify-center px-1 sm:px-2 mt-1">
                <div className="flex-1 bg-zinc-200/60 dark:bg-zinc-700/30 rounded-[1px]" title="Livre (0%)" />
                <div className="flex-1 bg-amber-300 dark:bg-amber-400 rounded-[1px]" title="Pouco Uso" />
                <div className="flex-1 bg-orange-400 dark:bg-orange-400 rounded-[1px]" title="Parcial" />
                <div className="flex-1 bg-orange-500 dark:bg-orange-500 rounded-[1px]" title="Alto Uso" />
                <div className="flex-1 bg-orange-600 dark:bg-orange-600 rounded-[1px]" title="Quase Cheio" />
                <div className="flex-1 bg-red-600 dark:bg-red-500 rounded-[1px]" title="Esgotado (100%)" />
              </div>
            </div>
          </div>

          {weekDays.map((day, index) => {
            const isCurrentDay = isToday(day);
            const dateKey = format(day, 'yyyy-MM-dd');
            const totalReserved = dailyTotals.get(dateKey) || 0;
            const daySlots = dailySlotsData.get(dateKey);
            const isHoveredColumn = hoveredDate === dateKey;

            return (
              <div
                key={index}
                className={cn(
                  "min-h-[8rem] sm:min-h-[9rem] flex flex-col border-b-4 border-r-4 last:border-r-0 border-black dark:border-white transition-all relative group overflow-visible",
                  isCurrentDay
                    ? "bg-gradient-to-br from-primary via-primary to-primary/85 text-white"
                    : isHoveredColumn
                      ? "bg-primary/10 dark:bg-primary/20"
                      : "bg-white dark:bg-zinc-900"
                )}
              >
                {/* Today accent stripe */}
                {isCurrentDay && (
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-black dark:bg-white z-20" />
                )}
                <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
                  <div className="absolute inset-0 opacity-40"
                    style={{
                      backgroundImage: `
                           linear-gradient(to right, ${isCurrentDay ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'} 1px, transparent 1px),
                           linear-gradient(to bottom, ${isCurrentDay ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'} 1px, transparent 1px)
                         `,
                      backgroundSize: '20px 20px'
                    }}
                  />
                </div>


                <div className={cn(
                  "flex-1 flex flex-col items-center justify-center p-2 sm:p-3 relative z-10 overflow-hidden",
                  isCurrentDay ? "text-white" : "text-foreground"
                )}>
                  <AnimatePresence mode="wait">
                    {hoveredHeatmapInfo?.date === dateKey ? (
                      <motion.div
                        key="info"
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -20, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className="flex flex-col items-center justify-center text-center"
                      >
                        <span className={cn(
                          "text-[11px] sm:text-[13px] font-black uppercase tracking-[0.25em] mb-1.5",
                          isCurrentDay ? "text-white/90" : "text-primary"
                        )}>
                          {hoveredHeatmapInfo.slot}
                        </span>
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-2xl sm:text-4xl font-black">
                            {hoveredHeatmapInfo.usage}
                          </span>
                          <span className="text-[12px] sm:text-[14px] font-black uppercase opacity-80">
                            CHROMEBOOKS
                          </span>
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="date"
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -20, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className="flex flex-col items-center justify-center"
                      >
                        <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] opacity-90 mb-0.5 drop-shadow-sm">
                          {format(day, isMobile ? 'EEE' : 'EEEE', { locale: ptBR })}
                        </span>
                        <span className="text-2xl sm:text-3xl font-black tracking-tighter leading-none xl:drop-shadow-sm">
                          {format(day, 'dd/MM')}
                        </span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Neo-Brutalism Heatmap Card Footer */}
                <div className={cn(
                  "px-2 py-1.5 flex flex-col sm:px-3 sm:py-2 border-t-4 border-black dark:border-white relative z-10 bg-white dark:bg-zinc-950 justify-end"
                )}>

                  {/* Grid de Calor Robusto */}
                  <div className="flex w-full h-[24px] sm:h-[30px] gap-[2px] relative z-20 justify-start">
                    {timeSlots.map((slot) => {
                      const usage = daySlots?.get(slot) || 0;
                      const rate = totalAvailableChromebooks > 0 ? (usage / totalAvailableChromebooks) * 100 : 0;

                      // Cores espelham os estados dos slots: cinza → laranja → vermelho
                      let color = "bg-zinc-200/60 dark:bg-zinc-700/30"; // Vazio / Disponível
                      if (rate >= 100) color = "bg-red-600 dark:bg-red-500";           // Esgotado
                      else if (rate >= 75) color = "bg-orange-600 dark:bg-orange-500"; // Quase cheio
                      else if (rate >= 30) color = "bg-orange-400 dark:bg-orange-400"; // Parcial
                      else if (rate > 0) color = "bg-amber-300 dark:bg-amber-400";    // Pouco uso

                      return (
                        <div
                          key={slot}
                          onMouseEnter={() => setHoveredHeatmapInfo({ date: dateKey, slot, usage })}
                          onMouseLeave={() => setHoveredHeatmapInfo(null)}
                          className={cn(
                            "flex-1 max-w-[16px] h-full relative cursor-crosshair transition-all duration-200",
                            color,
                            hoveredHeatmapInfo?.date === dateKey && hoveredHeatmapInfo?.slot === slot
                              ? "scale-y-125 ring-2 ring-black dark:ring-white z-30"
                              : "opacity-80 hover:opacity-100"
                          )}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}

          {timeSlots.map((timeSlot, timeIndex) => {
            const isHoveredRow = hoveredTime === timeSlot;

            return (
              <React.Fragment key={timeIndex}>
                <div 
                  className={cn(
                    "min-h-[4rem] sm:min-h-[5rem] h-full flex items-center justify-center border-b-2 border-r-4 border-black/10 dark:border-white/10 sticky left-0 z-20 shadow-[2px_0_0_0_#000_inset]",
                    isHoveredRow ? "bg-zinc-100 dark:bg-zinc-800" : "bg-zinc-50 dark:bg-zinc-950"
                  )}
                  style={{ left: -4 }}
                >
                  <div className="flex flex-col items-center">
                    <div className={cn(
                      "bg-white dark:bg-zinc-950 px-3 py-1 border-2 border-black dark:border-white transition-none",
                      isHoveredRow ? "bg-black text-white dark:bg-white dark:text-black" : "text-zinc-600 dark:text-zinc-400"
                    )}>
                      <span className="text-[11px] sm:text-[13px] font-bold tracking-tight uppercase">
                        {timeSlot.replace('h', ':')}
                      </span>
                    </div>
                    <div className="w-[2px] h-2 bg-black/20 dark:bg-white/20" />
                  </div>
                </div>

                {weekDays.map((day, dayIndex) => {
                  const dateKey = format(day, 'yyyy-MM-dd');
                  const slotKey = `${dateKey}_${timeSlot}`;
                  const reservationsForSlot = reservationsMap.get(slotKey) || [];
                  const isHoveredCol = hoveredDate === dateKey;

                  return (
                    <div
                      key={dayIndex}
                      className={cn(
                        "min-h-[4rem] sm:min-h-[5rem] h-full border-b border-r last:border-r-0 border-zinc-200 dark:border-zinc-800 translate-z-0",
                        isHoveredRow || isHoveredCol ? "bg-zinc-100/50 dark:bg-zinc-800/30" : ""
                      )}
                      onMouseEnter={() => {
                        if (!isMobile) {
                          setHoveredDate(dateKey);
                          setHoveredTime(timeSlot);
                        }
                      }}
                    >
                      <SchedulingSlot
                        date={day}
                        timeSlot={timeSlot}
                        totalAvailableChromebooks={totalAvailableChromebooks}
                        allReservationsForSlot={reservationsForSlot}
                        currentUser={currentUser}
                        onReservationSuccess={onReservationSuccess}
                        professores={professores}
                      />
                    </div>
                  );
                })}
              </React.Fragment>
            );
          })}
        </GridContainer>
      </div>
    </div>
  );
};
