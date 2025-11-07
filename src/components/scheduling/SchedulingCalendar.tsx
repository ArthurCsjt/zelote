import React, { useMemo } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { timeSlots, getWeekDays } from '@/utils/scheduling';
import { SchedulingSlot } from './SchedulingSlot';
import type { Reservation } from '@/hooks/useDatabase';
import type { User as AuthUser } from '@supabase/supabase-js';
import { Loader2 } from 'lucide-react';

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
  const gridTemplateColumns = `80px repeat(${weekDays.length}, 1fr)`;

  return (
    <div className="calendar-grid" style={{ gridTemplateColumns }}>
      
      {/* Cabeçalho da Grade (Dias da Semana) */}
      <div></div> {/* Canto superior esquerdo vazio */}
      {weekDays.map((day, index) => (
        <div key={index} className="grid-header text-center font-semibold text-muted-foreground mb-2">
          {format(day, 'EEE', { locale: ptBR }).toUpperCase().slice(0, 3)}{' '}
          <span className="font-normal text-sm">{format(day, 'dd/MM')}</span>
        </div>
      ))}

      {/* Corpo da Grade (Slots de Horário) */}
      {timeSlots.map((timeSlot, timeIndex) => (
        <React.Fragment key={timeIndex}>
          {/* Rótulo da Hora */}
          <div className="time-label text-right text-sm font-medium text-muted-foreground pr-4 h-[60px] flex items-center justify-end">
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
  );
};