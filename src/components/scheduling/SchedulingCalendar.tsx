import React, { useMemo } from 'react';
import { format, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { timeSlots, getWeekDays } from '@/utils/scheduling';
import { SchedulingSlot } from './SchedulingSlot';
import type { Reservation } from '@/hooks/useDatabase';
import type { User as AuthUser } from '@supabase/supabase-js';
import { Loader2, CheckCircle, AlertTriangle, Monitor, Clock } from 'lucide-react';

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

  const reservationsMap = useMemo(() => {
    const map = new Map<string, Reservation[]>();
    reservations.forEach(res => {
      const key = `${res.date}_${res.time_slot}`;
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key)?.push(res);
    });
    return map;
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

  const gridTemplateColumns = `60px repeat(${weekDays.length}, 1fr)`;

  return (
    <div className="space-y-0">
      <div
        className="grid gap-[2px] min-w-[600px] bg-foreground/5"
        style={{ gridTemplateColumns }}
      >
        {/* Header Row */}
        <div className="h-10 bg-card" /> {/* Empty corner */}
        {weekDays.map((day, index) => {
          const isCurrentDay = isToday(day);
          return (
            <div
              key={index}
              className={cn(
                "h-10 flex flex-col items-center justify-center transition-all bg-card",
                isCurrentDay
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted/30"
              )}
            >
              <span className="text-[10px] font-black uppercase tracking-wide">
                {format(day, 'EEE', { locale: ptBR }).toUpperCase().slice(0, 3)}
              </span>
              <span className={cn(
                "text-xs font-bold",
                isCurrentDay ? "text-primary-foreground/90" : "text-muted-foreground"
              )}>
                {format(day, 'dd/MM')}
              </span>
            </div>
          );
        })}

        {/* Time Slots Grid */}
        {timeSlots.map((timeSlot, timeIndex) => (
          <React.Fragment key={timeIndex}>
            {/* Time Label */}
            <div className="h-14 flex items-center justify-center bg-muted/30">
              <span className="text-[10px] font-black text-muted-foreground">
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
