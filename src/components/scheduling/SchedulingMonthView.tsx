import React, { useState, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isPast } from 'date-fns';
import { ptBR } from 'date-fns/locale'; // IMPORT CORRIGIDO
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Monitor, Clock, User, AlertTriangle } from 'lucide-react';
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

  // Pré-processa as reservas por dia (YYYY-MM-DD)
  const reservationsByDay = useMemo(() => {
    const map = new Map<string, Reservation[]>();
    reservations.forEach(res => {
      const key = res.date; // YYYY-MM-DD
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key)?.push(res);
    });
    return map;
  }, [reservations]);

  // Função para determinar o modificador de dia no calendário
  const modifiers = useMemo(() => {
    const reservedDays: Date[] = [];
    const fullDays: Date[] = [];
    
    reservationsByDay.forEach((resList, dateKey) => {
      const totalReserved = resList.reduce((sum, res) => sum + res.quantity_requested, 0);
      const date = new Date(dateKey + 'T12:00:00'); // Adiciona hora para evitar problemas de fuso
      
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

  // Renderiza o conteúdo detalhado do dia selecionado
  const renderDayDetails = () => {
    if (!selectedDate) return null;

    const dateKey = format(selectedDate, 'yyyy-MM-dd');
    const dayReservations = reservationsByDay.get(dateKey) || [];
    const totalReserved = dayReservations.reduce((sum, res) => sum + res.quantity_requested, 0);
    const available = totalAvailableChromebooks - totalReserved;
    
    const isDayPast = isPast(selectedDate);

    return (
      <GlassCard className="p-4 space-y-4">
        <CardHeader className="p-0">
          <CardTitle className="text-xl font-bold text-foreground">
            Reservas para {format(selectedDate, 'dd/MM/yyyy')}
          </CardTitle>
          <CardDescription>
            {isDayPast ? 'Histórico de reservas' : 'Detalhes e disponibilidade'}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="p-0 space-y-3">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="text-lg font-bold">{totalAvailableChromebooks}</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-blue-500/10">
              <p className="text-xs text-muted-foreground">Reservados</p>
              <p className="text-lg font-bold text-blue-600">{totalReserved}</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-green-500/10">
              <p className="text-xs text-muted-foreground">Disponíveis</p>
              <p className="text-lg font-bold text-green-600">{available}</p>
            </div>
          </div>
          
          {dayReservations.length > 0 ? (
            <div className="space-y-2 pt-3 border-t border-border">
              {dayReservations.map((res) => (
                <div key={res.id} className="p-3 rounded-lg bg-card hover:bg-card-hover border border-border">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-purple-500" />
                      <span className="font-medium text-sm">{res.prof_name}</span>
                    </div>
                    <Badge className="bg-primary hover:bg-primary text-primary-foreground">
                      {res.quantity_requested} CB
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 ml-6 truncate">
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
            <div className="text-center py-4 text-muted-foreground">
              <Monitor className="h-8 w-8 mx-auto mb-2" />
              Nenhuma reserva agendada para este dia.
            </div>
          )}
        </CardContent>
      </GlassCard>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <GlassCard className="p-4">
        <CardHeader className="p-0 pb-4">
          <CardTitle className="text-lg font-semibold">Visão Mensal</CardTitle>
          <CardDescription>
            Clique em um dia para ver os detalhes das reservas.
          </CardDescription>
        </CardHeader>
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={setSelectedDate}
          month={currentDate} // Controla o mês exibido
          className="w-full p-0"
          locale={ptBR} // ADICIONANDO LOCALE AQUI
          classNames={{
            months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
            month: "space-y-4",
            caption: "flex justify-center pt-1 relative items-center",
            caption_label: "text-sm font-medium",
            nav: "space-x-1 flex items-center",
            nav_button: cn(
              "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
            ),
            nav_button_previous: "absolute left-1",
            nav_button_next: "absolute right-1",
            table: "w-full border-collapse space-y-1",
            head_row: "flex",
            head_cell:
              "text-muted-foreground rounded-md w-full font-normal text-[0.8rem]",
            row: "flex w-full mt-2",
            cell: "h-9 w-full text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
            day: cn(
              "h-9 w-full p-0 font-normal aria-selected:opacity-100"
            ),
            day_selected:
              "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
            day_today: "bg-accent text-accent-foreground",
            day_outside: "day-outside text-muted-foreground opacity-50",
            day_disabled: "text-muted-foreground opacity-50",
            day_range_middle:
              "aria-selected:bg-accent aria-selected:text-accent-foreground",
            day_hidden: "invisible",
            // Modificadores customizados
            day_reserved: "bg-blue-500/10 border border-blue-500/30",
            day_full: "bg-red-500/10 border border-red-500/30",
          }}
          modifiers={{
            reserved: modifiers.reserved,
            full: modifiers.full,
          }}
          modifiersClassNames={{
            reserved: "day-reserved",
            full: "day-full",
          }}
        />
      </GlassCard>
      
      {/* Detalhes do Dia Selecionado */}
      <div className="lg:col-span-1">
        {renderDayDetails()}
      </div>
    </div>
  );
};