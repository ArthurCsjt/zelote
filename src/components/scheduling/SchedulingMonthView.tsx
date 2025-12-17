import React, { useState, useMemo } from 'react';
import { format, isPast } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { Monitor, Clock, User, CalendarDays } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Reservation } from '@/hooks/useDatabase';

interface SchedulingMonthViewProps {
  currentDate: Date;
  reservations: Reservation[];
  totalAvailableChromebooks: number;
  isLoading: boolean;
}

export const SchedulingMonthView: React.FC<SchedulingMonthViewProps> = ({
  currentDate,
  reservations,
  totalAvailableChromebooks,
  isLoading,
}) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  const reservationsByDay = useMemo(() => {
    const map = new Map<string, Reservation[]>();
    reservations.forEach(res => {
      const key = res.date;
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key)?.push(res);
    });
    return map;
  }, [reservations]);

  const modifiers = useMemo(() => {
    const reservedDays: Date[] = [];
    const fullDays: Date[] = [];
    
    reservationsByDay.forEach((resList, dateKey) => {
      const totalReserved = resList.reduce((sum, res) => sum + res.quantity_requested, 0);
      const date = new Date(dateKey + 'T12:00:00');
      
      if (totalReserved > 0) {
        reservedDays.push(date);
      }
      if (totalReserved >= totalAvailableChromebooks) {
        fullDays.push(date);
      }
    });

    return {
      reserved: reservedDays,
      full: fullDays,
    };
  }, [reservationsByDay, totalAvailableChromebooks]);

  const renderDayDetails = () => {
    if (!selectedDate) return null;

    const dateKey = format(selectedDate, 'yyyy-MM-dd');
    const dayReservations = reservationsByDay.get(dateKey) || [];
    const totalReserved = dayReservations.reduce((sum, res) => sum + res.quantity_requested, 0);
    const available = totalAvailableChromebooks - totalReserved;
    
    const isDayPast = isPast(selectedDate);

    return (
      <div className="border-3 border-foreground/20 bg-card shadow-[4px_4px_0px_0px_hsl(var(--foreground)/0.1)] p-4 space-y-4">
        
        {/* Header */}
        <div className="border-b-3 border-foreground/10 pb-3">
          <h3 className="text-lg font-black uppercase tracking-tight text-foreground">
            {format(selectedDate, 'dd/MM/yyyy')}
          </h3>
          <p className="text-xs font-medium text-muted-foreground mt-0.5">
            {isDayPast ? 'Histórico de reservas' : 'Detalhes e disponibilidade'}
          </p>
        </div>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center p-3 border-3 border-foreground/10 bg-muted/20">
            <p className="text-[9px] font-black uppercase tracking-wide text-muted-foreground">Total</p>
            <p className="text-xl font-black text-foreground">{totalAvailableChromebooks}</p>
          </div>
          <div className="text-center p-3 border-3 border-info/30 bg-info/5">
            <p className="text-[9px] font-black uppercase tracking-wide text-muted-foreground">Reservados</p>
            <p className="text-xl font-black text-info">{totalReserved}</p>
          </div>
          <div className="text-center p-3 border-3 border-success/30 bg-success/5">
            <p className="text-[9px] font-black uppercase tracking-wide text-muted-foreground">Disponíveis</p>
            <p className="text-xl font-black text-success">{available}</p>
          </div>
        </div>
        
        {/* Reservations List */}
        {dayReservations.length > 0 ? (
          <div className="space-y-2 pt-2 border-t-3 border-foreground/10">
            <p className="text-[10px] font-black uppercase tracking-wide text-muted-foreground">
              Reservas do Dia:
            </p>
            {dayReservations.map((res) => (
              <div 
                key={res.id} 
                className="p-3 border-3 border-foreground/10 bg-background hover:bg-muted/30 transition-colors"
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-primary" />
                    <span className="font-bold text-sm text-foreground">{res.prof_name}</span>
                  </div>
                  <Badge className="bg-primary text-primary-foreground font-black text-xs border-0 rounded-none">
                    {res.quantity_requested} CB
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1.5 ml-6 truncate">
                  {res.subject}
                </p>
                <p className="text-[10px] text-muted-foreground mt-1 ml-6 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {res.time_slot}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 border-3 border-dashed border-foreground/10">
            <Monitor className="h-10 w-10 mx-auto mb-2 text-muted-foreground/50" />
            <p className="text-sm font-bold text-muted-foreground">Nenhuma reserva</p>
            <p className="text-xs text-muted-foreground/70">para este dia</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      
      {/* Calendar - Neo Brutal */}
      <div className="border-3 border-foreground/20 bg-card shadow-[4px_4px_0px_0px_hsl(var(--foreground)/0.1)] p-4">
        <div className="border-b-3 border-foreground/10 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-black uppercase tracking-tight text-foreground">
              Visão Mensal
            </h3>
          </div>
          <p className="text-xs font-medium text-muted-foreground mt-0.5">
            Clique em um dia para ver os detalhes
          </p>
        </div>
        
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={setSelectedDate}
          month={currentDate}
          className="w-full p-0 flex justify-center"
          locale={ptBR}
          classNames={{
            months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0 w-full",
            month: "space-y-4 w-full",
            caption: "flex justify-center pt-1 relative items-center",
            caption_label: "text-sm font-black uppercase tracking-wide",
            nav: "space-x-1 flex items-center",
            nav_button: cn(
              "h-8 w-8 bg-transparent border-2 border-foreground/20 p-0 hover:bg-muted transition-colors"
            ),
            nav_button_previous: "absolute left-1",
            nav_button_next: "absolute right-1",
            table: "w-full border-collapse",
            head_row: "flex",
            head_cell: "text-muted-foreground w-full font-black text-[10px] uppercase",
            row: "flex w-full mt-1",
            cell: "h-10 w-full text-center text-sm p-0 relative focus-within:relative focus-within:z-20",
            day: cn(
              "h-10 w-full p-0 font-bold border-2 border-transparent hover:border-foreground/20 transition-all"
            ),
            day_selected: "bg-primary text-primary-foreground border-primary font-black",
            day_today: "bg-accent text-accent-foreground border-foreground/30",
            day_outside: "text-muted-foreground opacity-50",
            day_disabled: "text-muted-foreground opacity-50",
            day_hidden: "invisible",
          }}
          modifiers={{
            reserved: modifiers.reserved,
            full: modifiers.full,
          }}
          modifiersClassNames={{
            reserved: "bg-info/10 border-info/30 text-info-foreground",
            full: "bg-error/10 border-error/30 text-error-foreground",
          }}
        />
      </div>
      
      {/* Day Details */}
      <div className="lg:col-span-1">
        {renderDayDetails()}
      </div>
    </div>
  );
};
