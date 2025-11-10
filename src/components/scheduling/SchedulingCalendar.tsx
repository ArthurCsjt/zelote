import React, { useMemo } from 'react';
import { format, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { timeSlots, getWeekDays } from '@/utils/scheduling';
import { SchedulingSlot } from './SchedulingSlot';
import type { Reservation } from '@/hooks/useDatabase';
import type { User as AuthUser } from '@supabase/supabase-js';
import { Loader2, CheckCircle, AlertTriangle, Monitor, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface SchedulingCalendarProps {
  currentDate: Date;
  reservations: Reservation[];
  totalAvailableChromebooks: number;
  currentUser: AuthUser | null;
  isLoading: boolean;
  onReservationSuccess: () => void;
  professores: { id: string; nome_completo: string }[];
}

// Componente de Legenda (Novo)
const CalendarLegend = () => (
  <Card className="p-3 shadow-sm border-border dark:bg-card/50">
    <CardTitle className="text-sm font-semibold mb-2">Legenda</CardTitle>
    <div className="grid grid-cols-2 gap-2 text-xs">
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-full bg-blue-500" />
        Minha Reserva
      </div>
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-full bg-green-500" />
        Disponível (Vazio)
      </div>
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-full bg-amber-500" />
        Parcialmente Reservado
      </div>
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-full bg-red-500" />
        Esgotado
      </div>
    </div>
  </Card>
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

  // Pré-processa as reservas para acesso rápido por dia e hora
  const reservationsMap = useMemo(() => {
    const map = new Map<string, Reservation[]>(); // Key: YYYY-MM-DD_HHhMM
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
      <div className="flex justify-center items-center h-96">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="ml-4 text-lg text-muted-foreground">Carregando agendamentos...</p>
      </div>
    );
  }
  
  // Define o grid dinamicamente (1 coluna de hora + N colunas de dia)
  // Em mobile, o grid será forçado a rolar horizontalmente (min-width: 700px no CSS)
  const gridTemplateColumns = `80px repeat(${weekDays.length}, 1fr)`;

  return (
    <div className="space-y-4">
      <CalendarLegend />
      
      <div className="calendar-grid" style={{ gridTemplateColumns }}>
        
        {/* Cabeçalho da Grade (Dias da Semana) */}
        <div></div> {/* Canto superior esquerdo vazio */}
        {weekDays.map((day, index) => {
          const isCurrentDay = isToday(day);
          return (
            <div 
              key={index} 
              className={cn(
                "grid-header p-2 rounded-lg transition-colors",
                isCurrentDay ? "bg-primary text-primary-foreground font-bold shadow-md" : "hover:bg-muted/50"
              )}
            >
              {format(day, 'EEE', { locale: ptBR }).toUpperCase().slice(0, 3)}{' '}
              <span className={cn("font-normal text-sm", isCurrentDay ? "text-primary-foreground/80" : "text-muted-foreground")}>
                {format(day, 'dd/MM')}
              </span>
            </div>
          );
        })}

        {/* Corpo da Grade (Slots de Horário) */}
        {timeSlots.map((timeSlot, timeIndex) => (
          <React.Fragment key={timeIndex}>
            {/* Rótulo da Hora */}
            <div className="time-label">
              {timeSlot}
            </div>
            
            {/* Slots dos Dias */}
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