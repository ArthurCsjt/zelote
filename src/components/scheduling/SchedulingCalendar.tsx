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

// Neo-Brutal Legend Component
const CalendarLegend = () => (
  <div className="border-3 border-foreground/20 bg-card p-4 shadow-[4px_4px_0px_0px_hsl(var(--foreground)/0.1)]">
    <h3 className="text-xs font-black uppercase tracking-wide mb-3 text-foreground">Legenda</h3>
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 border-2 border-info bg-info/20" />
        <span className="font-medium">Minha Reserva</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 border-2 border-dashed border-foreground/30 bg-background" />
        <span className="font-medium">Disponível</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 border-2 border-warning bg-warning/20" />
        <span className="font-medium">Parcial</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 border-2 border-error bg-error/20" />
        <span className="font-medium">Esgotado</span>
      </div>
    </div>
  </div>
);

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
  
  const gridTemplateColumns = `80px repeat(${weekDays.length}, 1fr)`;

  return (
    <div className="space-y-4">
      <CalendarLegend />
      
      <div 
        className="grid gap-1 min-w-[700px]" 
        style={{ gridTemplateColumns }}
      >
        
        {/* Header Row */}
        <div className="h-14" /> {/* Empty corner */}
        {weekDays.map((day, index) => {
          const isCurrentDay = isToday(day);
          return (
            <div 
              key={index} 
              className={cn(
                "h-14 flex flex-col items-center justify-center border-3 transition-all",
                isCurrentDay 
                  ? "bg-primary text-primary-foreground border-primary shadow-[3px_3px_0px_0px_hsl(var(--foreground)/0.3)]" 
                  : "bg-muted/30 border-foreground/10 hover:bg-muted/50"
              )}
            >
              <span className="text-xs font-black uppercase tracking-wide">
                {format(day, 'EEE', { locale: ptBR }).toUpperCase().slice(0, 3)}
              </span>
              <span className={cn(
                "text-sm font-bold",
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
