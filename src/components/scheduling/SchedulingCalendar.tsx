import React, { useMemo, useRef, useEffect, useState } from 'react';
import { format, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { timeSlots, getWeekDays } from '@/utils/scheduling';
import { SchedulingSlot } from './SchedulingSlot';
import type { Reservation } from '@/hooks/useDatabase';
import type { User as AuthUser } from '@supabase/supabase-js';
import { Loader2, CheckCircle, AlertTriangle, Monitor, Laptop, Clock, Info, GripVertical } from 'lucide-react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

interface SchedulingCalendarProps {
  currentDate: Date;
  reservations: Reservation[];
  totalAvailableChromebooks: number;
  currentUser: AuthUser | null;
  isLoading: boolean;
  onReservationSuccess: () => void;
  professores: { id: string; nome_completo: string }[];
}

export const SchedulingCalendar: React.FC<SchedulingCalendarProps> = ({
  currentDate,
  reservations,
  totalAvailableChromebooks,
  currentUser,
  isLoading,
  onReservationSuccess,
  professores,
}) => {
  const [hoveredDate, setHoveredDate] = React.useState<string | null>(null);
  const [hoveredTime, setHoveredTime] = React.useState<string | null>(null);
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

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center h-96 gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-lg font-bold uppercase tracking-wide text-muted-foreground">
          Carregando agendamentos...
        </p>
      </div>
    );
  }

  // Responsive sizes
  const timeColumnWidth = isMobile ? 60 : 100;
  const dayColumnMinWidth = isMobile ? 120 : 160;
  const totalMinWidth = timeColumnWidth + (weekDays.length * dayColumnMinWidth);
  const gridTemplateColumns = `${timeColumnWidth}px repeat(${weekDays.length}, 1fr)`;

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
        className="relative border-4 border-black dark:border-white shadow-[12px_12px_0px_0px_rgba(0,0,0,0.05)] bg-white dark:bg-zinc-950 overflow-hidden cursor-grab active:cursor-grabbing"
      >
        <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.07] pointer-events-none neo-brutal-dots font-black text-black" />

        <motion.div
          drag="x"
          dragConstraints={constraintsRef}
          dragElastic={0.1}
          className="grid gap-0 relative z-10 select-none"
          style={{
            gridTemplateColumns,
            minWidth: totalMinWidth,
            width: '100%'
          }}
          onMouseLeave={() => {
            setHoveredDate(null);
            setHoveredTime(null);
          }}
        >
          {/* Header Row */}
          <div className={cn(
            "h-32 sm:h-36 flex flex-col items-center justify-center border-b-4 border-r-4 border-black dark:border-white bg-green-500 relative overflow-hidden transition-all",
            `min-w-[${timeColumnWidth}px]`
          )}>
            <div className="absolute inset-0 opacity-10 pointer-events-none"
              style={{
                backgroundImage: `radial-gradient(circle, white 1px, transparent 1px)`,
                backgroundSize: '8px 8px'
              }}
            />

            <div className="relative z-10 flex flex-col items-center p-2">
              <div className="bg-white p-1.5 sm:p-2 border-2 border-black shadow-[2px_2px_0px_0px_#000] mb-1 sm:mb-2 transform -rotate-3 transition-transform">
                <Monitor className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
              </div>
              <div className="flex flex-col items-center leading-none">
                <span className="text-lg sm:text-xl font-black text-white drop-shadow-[1px_1px_0px_rgba(0,0,0,0.5)]">
                  {totalAvailableChromebooks}
                </span>
                <span className="text-[8px] sm:text-[10px] font-black uppercase text-white tracking-widest text-center">
                  {isMobile ? 'Disp.' : 'Disponíveis'}
                </span>
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
                    ? "bg-primary text-white"
                    : isHoveredColumn
                      ? "bg-primary/10 dark:bg-primary/20"
                      : "bg-white dark:bg-zinc-900"
                )}
              >
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
                  "flex-1 flex flex-col items-center justify-center p-2 sm:p-3 relative z-10",
                  isCurrentDay ? "text-white" : "text-foreground"
                )}>
                  <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] opacity-90 mb-0.5 drop-shadow-sm">
                    {format(day, isMobile ? 'EEE' : 'EEEE', { locale: ptBR })}
                  </span>
                  <span className="text-2xl sm:text-3xl font-black tracking-tighter leading-none xl:drop-shadow-sm">
                    {format(day, 'dd/MM')}
                  </span>
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

                      let color = "bg-[#F3F4F6] dark:bg-zinc-800/40"; // Quase invisível
                      if (rate >= 50) color = "bg-[#22C55E]";
                      else if (rate > 0) color = "bg-[#F97316]";

                      return (
                        <div
                          key={slot}
                          className={cn(
                            "flex-1 max-w-[16px] h-full relative group/tooltip cursor-default transition-all duration-200",
                            color
                          )}
                        >
                          {/* Tooltip Arredondado - Sem Seta */}
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-[4px] opacity-0 group-hover/tooltip:opacity-100 pointer-events-none z-[100] transition-opacity">
                            <div className="bg-black text-white px-2 py-1 rounded-[4px] shadow-sm whitespace-nowrap">
                              <span className="text-[10px] font-normal tracking-wide text-white">
                                {slot}: {usage} aparelhos
                              </span>
                            </div>
                          </div>
                        </div>
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
                <div className={cn(
                  "min-h-[4rem] sm:min-h-[5rem] h-full flex items-center justify-center border-b-2 border-r-4 border-black/10 dark:border-white/10 transition-all",
                  isHoveredRow ? "bg-primary/20 dark:bg-primary/30" : "bg-blue-50/50 dark:bg-blue-900/10"
                )}>
                  <div className={cn(
                    "flex flex-col items-center py-1.5 sm:py-2 transition-transform duration-300",
                    isHoveredRow ? "scale-105 sm:scale-110" : ""
                  )}>
                    <div className={cn(
                      "bg-white dark:bg-zinc-900 px-2 sm:px-4 py-1 sm:py-1.5 rounded-lg border transition-all duration-300 shadow-sm",
                      isHoveredRow
                        ? "border-primary ring-2 ring-primary/20"
                        : "border-blue-200 dark:border-blue-800"
                    )}>
                      <span className={cn(
                        "text-[11px] sm:text-[14px] font-black tracking-tighter transition-colors",
                        isHoveredRow ? "text-primary" : "text-blue-900 dark:text-blue-300"
                      )}>
                        {timeSlot}
                      </span>
                    </div>
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
                        "min-h-[4rem] sm:min-h-[5rem] h-full border-b-2 border-r-2 last:border-r-0 border-black/5 dark:border-white/5 transition-colors duration-200 translate-z-0",
                        isHoveredRow || isHoveredCol ? "bg-primary/[0.03] dark:bg-primary/[0.08]" : ""
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
        </motion.div>
      </div>
    </div>
  );
};
