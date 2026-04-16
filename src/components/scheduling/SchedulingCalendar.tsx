import React, { useMemo } from 'react';
import { format, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { timeSlots, getWeekDays } from '@/utils/scheduling';
import { SchedulingSlot } from './SchedulingSlot';
import type { Reservation } from '@/hooks/useDatabase';
import type { User as AuthUser } from '@supabase/supabase-js';
import { Loader2, CheckCircle, AlertTriangle, Monitor, Laptop, Clock, Info } from 'lucide-react';

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
  const weekDays = getWeekDays(currentDate);

  const { reservationsMap, dailyTotals, dailySlotsData } = useMemo(() => {
    const map = new Map<string, Reservation[]>();
    const totals = new Map<string, number>();
    const slotsData = new Map<string, Map<string, number>>();

    reservations.forEach(res => {
      // Map por slot
      const key = `${res.date}_${res.time_slot}`;
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key)?.push(res);

      // Soma diária
      const currentTotal = totals.get(res.date) || 0;
      totals.set(res.date, currentTotal + (res.quantity_requested || 0));

      // Dados por slot para o Mapa de Calor
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

  const gridTemplateColumns = `100px repeat(${weekDays.length}, 1fr)`;

  return (
    <div className="space-y-4">

      <div
        className="grid gap-1 min-w-[700px]"
        style={{ gridTemplateColumns }}
      >

        {/* Header Row */}
        {/* Top-Left Corner: Network Status Integration */}
        <div className="h-36 min-w-[100px] flex flex-col items-center justify-center border-4 border-black dark:border-white bg-green-500 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] relative overflow-hidden">
          {/* Subtle textured background for the corner too */}
          <div className="absolute inset-0 opacity-10 pointer-events-none" 
               style={{ 
                 backgroundImage: `radial-gradient(circle, white 1px, transparent 1px)`,
                 backgroundSize: '8px 8px' 
               }} 
          />
          
          <div className="relative z-10 flex flex-col items-center">
            <div className="bg-white p-2 border-2 border-black shadow-[2px_2px_0px_0px_#000] mb-2 transform -rotate-3 hover:rotate-0 transition-transform cursor-help">
              <Monitor className="h-5 w-5 text-green-600" />
            </div>
            <div className="flex flex-col items-center leading-none">
              <span className="text-lg font-black text-white drop-shadow-[1px_1px_0px_rgba(0,0,0,0.5)]">
                {totalAvailableChromebooks}
              </span>
              <span className="text-[9px] font-black uppercase text-white tracking-widest">
                Disponíveis
              </span>
            </div>
          </div>
        </div>
        {weekDays.map((day, index) => {
          const isCurrentDay = isToday(day);
          const dateKey = format(day, 'yyyy-MM-dd');
          const totalReserved = dailyTotals.get(dateKey) || 0;
          const daySlots = dailySlotsData.get(dateKey);
          
          return (
            <div
              key={index}
              className={cn(
                "h-36 flex flex-col border-4 transition-all relative group overflow-hidden",
                isCurrentDay
                  ? "bg-primary border-primary shadow-[4px_4px_0px_0px_hsl(var(--foreground)/0.3)]"
                  : "bg-white dark:bg-zinc-900 border-black dark:border-white hover:bg-zinc-50 dark:hover:bg-zinc-800"
              )}
            >
              {/* Background Texture Overlay - Modern Graph Paper Grid */}
              <div className="absolute inset-0 pointer-events-none" 
                   style={{ 
                     backgroundImage: `
                       linear-gradient(to right, ${isCurrentDay ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'} 1px, transparent 1px),
                       linear-gradient(to bottom, ${isCurrentDay ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'} 1px, transparent 1px)
                     `,
                     backgroundSize: '20px 20px' 
                   }} 
              />
              <div className="absolute inset-0 pointer-events-none" 
                   style={{ 
                     backgroundImage: `
                       linear-gradient(to right, ${isCurrentDay ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)'} 1px, transparent 1px),
                       linear-gradient(to bottom, ${isCurrentDay ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)'} 1px, transparent 1px)
                     `,
                     backgroundSize: '4px 4px' 
                   }} 
              />

              {/* Day/Date Section */}
              <div className={cn(
                "flex-1 flex flex-col items-center justify-center p-2 relative z-10",
                isCurrentDay ? "text-primary-foreground" : "text-foreground"
              )}>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80 mb-0.5">
                  {format(day, 'EEEE', { locale: ptBR })}
                </span>
                <span className="text-xl font-black tracking-tighter leading-none">
                  {format(day, 'dd/MM')}
                </span>
              </div>

              {/* Heatmap Footer - Modern Integrated Dashboard */}
              <div className={cn(
                "h-20 border-t-4 border-black dark:border-white relative overflow-hidden group/footer",
                isCurrentDay ? "bg-white" : "bg-zinc-50 dark:bg-zinc-800"
              )}>
                {/* Content Overlay */}
                <div className="relative z-10 p-2 flex flex-col justify-between h-full">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="bg-black text-white dark:bg-white dark:text-black px-2 py-1 text-lg font-black leading-none shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.2)]">
                      {totalReserved}
                    </span>
                    <span className={cn(
                      "text-xs font-black leading-tight tracking-tight",
                      isCurrentDay ? "text-black" : "text-foreground"
                    )}>
                      Chromebooks<br />reservados.
                    </span>
                  </div>

                  {/* Integrated Heatmap Bar - Full Width at Bottom */}
                  <div className="flex w-full h-6 gap-[2px] mt-auto border-t-2 border-black/5 dark:border-white/5">
                    {timeSlots.map((slot) => {
                      const usage = daySlots?.get(slot) || 0;
                      const rate = totalAvailableChromebooks > 0 ? (usage / totalAvailableChromebooks) * 100 : 0;
                      
                      let color = "bg-zinc-200 dark:bg-zinc-700/50";
                      if (rate > 0) color = "bg-green-500 shadow-[inset_0_-2px_0_0_rgba(0,0,0,0.1)]";
                      if (rate > 40) color = "bg-yellow-500 shadow-[inset_0_-2px_0_0_rgba(0,0,0,0.1)]";
                      if (rate > 70) color = "bg-orange-500 shadow-[inset_0_-2px_0_0_rgba(0,0,0,0.1)]";
                      if (rate >= 100) color = "bg-red-500 shadow-[inset_0_-2px_0_0_rgba(0,0,0,0.1)]";

                      return (
                        <div 
                          key={slot}
                          className={cn("flex-1 h-full transition-all duration-300 hover:scale-y-125 hover:z-20", color)}
                          title={`${slot}: ${usage} aparelhos`}
                        />
                      );
                    })}
                  </div>
                </div>
                
                {/* Floating Info on Hover */}
                <div className="absolute top-0 right-0 p-1 opacity-0 group-hover/footer:opacity-100 transition-opacity">
                  <Info className="h-3 w-3 text-zinc-400" />
                </div>
              </div>
            </div>
          );
        })}

        {/* Time Slots Grid */}
        {timeSlots.map((timeSlot, timeIndex) => (
          <React.Fragment key={timeIndex}>
            {/* Time Label */}
            <div className="h-16 flex items-center justify-center border-3 border-foreground/10 bg-muted/20">
              <span className="text-xs font-black text-muted-foreground">
                {timeSlot}
              </span>
            </div>

            {/* Day Slots */}
            {weekDays.map((day, dayIndex) => {
              const dateKey = format(day, 'yyyy-MM-dd');
              const slotKey = `${dateKey}_${timeSlot}`;
              const reservationsForSlot = reservationsMap.get(slotKey) || [];

              return (
                <SchedulingSlot
                  key={dayIndex}
                  date={day}
                  timeSlot={timeSlot}
                  totalAvailableChromebooks={totalAvailableChromebooks}
                  allReservationsForSlot={reservationsForSlot}
                  currentUser={currentUser}
                  onReservationSuccess={onReservationSuccess}
                  professores={professores}
                />
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};
