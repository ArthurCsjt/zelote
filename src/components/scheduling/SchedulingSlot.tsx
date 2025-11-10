import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Plus, Monitor, User, CheckCircle, AlertTriangle } from 'lucide-react';
import type { Reservation } from '@/hooks/useDatabase';
import type { User as AuthUser } from '@supabase/supabase-js';
import { ReservationDialog } from './ReservationDialog';

interface SchedulingSlotProps {
  date: Date;
  timeSlot: string;
  totalAvailableChromebooks: number;
  allReservationsForSlot: Reservation[];
  currentUser: AuthUser | null;
  onReservationSuccess: () => void;
  professores: { id: string; nome_completo: string }[];
}

export const SchedulingSlot: React.FC<SchedulingSlotProps> = ({
  date,
  timeSlot,
  totalAvailableChromebooks,
  allReservationsForSlot,
  currentUser,
  onReservationSuccess,
  professores,
}) => {
  
  // --- Lógica de Cálculo de Estado ---
  const { jaReservados, restantes, myReservation, isAvailable, isPartial, isFull } = useMemo(() => {
    const jaReservados = allReservationsForSlot.reduce((sum, res) => sum + res.quantity_requested, 0);
    const restantes = totalAvailableChromebooks - jaReservados;
    const myReservation = allReservationsForSlot.find(res => res.created_by === currentUser?.id);
    
    const isAvailable = jaReservados === 0;
    const isPartial = jaReservados > 0 && restantes > 0;
    const isFull = restantes <= 0 && jaReservados > 0;

    return { jaReservados, restantes, myReservation, isAvailable, isPartial, isFull };
  }, [allReservationsForSlot, totalAvailableChromebooks, currentUser]);

  // --- Renderização Condicional ---
  
  // 1. Minha Reserva
  if (myReservation) {
    return (
      <div className={cn(
        "slot my-reservation",
        // Usando cores semânticas para 'info' (azul neutro)
        "bg-info-bg/80 border-l-4 border-l-info text-info-foreground dark:bg-info-bg/50 dark:border-l-info dark:text-info-foreground",
        "p-2 flex flex-col justify-center"
      )}>
        <div className="slot-title flex items-center gap-1 text-info dark:text-info">
          <CheckCircle className="h-3 w-3" />
          Minha Reserva
        </div>
        <div className="slot-subtitle text-xs font-medium text-foreground dark:text-info-foreground">
          {myReservation.subject}
        </div>
        <div className="text-[10px] text-muted-foreground dark:text-info-foreground/80">
          {myReservation.prof_name} ({myReservation.quantity_requested} 💻)
        </div>
      </div>
    );
  }
  
  // 2. Esgotado
  if (isFull) {
    return (
      <div className={cn(
        "slot full",
        // Usando cores semânticas para 'error' (vermelho)
        "bg-error-bg/80 border-l-4 border-l-error text-error-foreground dark:bg-error-bg/50 dark:border-l-error dark:text-error-foreground",
        "p-2 flex flex-col justify-center"
      )}>
        <div className="slot-title flex items-center gap-1 text-error dark:text-error">
          <AlertTriangle className="h-3 w-3" />
          Esgotado
        </div>
        <div className="slot-subtitle text-xs font-medium text-foreground dark:text-error-foreground">
          {allReservationsForSlot[0]?.prof_name || 'Múltiplas reservas'}
        </div>
        <div className="text-[10px] text-muted-foreground dark:text-error-foreground/80">
          {jaReservados}/{totalAvailableChromebooks} 💻
        </div>
      </div>
    );
  }
  
  // 3. Parcialmente Reservado
  if (isPartial) {
    return (
      <ReservationDialog
        date={date}
        timeSlot={timeSlot}
        totalAvailableChromebooks={totalAvailableChromebooks}
        currentReservations={allReservationsForSlot}
        onReservationSuccess={onReservationSuccess}
        professores={professores}
        maxQuantity={restantes}
      >
        <div className={cn(
          "slot partial cursor-pointer hover:shadow-md",
          // Usando cores semânticas para 'warning' (âmbar)
          "bg-warning-bg/80 border-l-4 border-l-warning text-warning-foreground dark:bg-warning-bg/50 dark:border-l-warning dark:text-warning-foreground",
          "p-2 flex flex-col justify-center"
        )}>
          <div className="slot-title flex items-center gap-1 text-warning dark:text-warning">
            <Monitor className="h-3 w-3" />
            Disponível
          </div>
          <div className="slot-subtitle text-xs font-medium text-foreground dark:text-warning-foreground">
            {restantes}/{totalAvailableChromebooks} 💻 restantes
          </div>
          <div className="text-[10px] text-muted-foreground dark:text-warning-foreground/80">
            {jaReservados} reservados
          </div>
        </div>
      </ReservationDialog>
    );
  }

  // 4. Disponível (Vazio)
  return (
    <ReservationDialog
      date={date}
      timeSlot={timeSlot}
      totalAvailableChromebooks={totalAvailableChromebooks}
      currentReservations={allReservationsForSlot}
      onReservationSuccess={onReservationSuccess}
      professores={professores}
      maxQuantity={totalAvailableChromebooks}
    >
      <div className={cn(
        "slot available",
        "bg-background-secondary border-2 border-dashed border-border hover:bg-muted dark:bg-card/50 dark:border-border-strong",
        "flex items-center justify-center cursor-pointer"
      )}>
        <Plus className="h-5 w-5 text-muted-foreground transition-transform group-hover:scale-110" />
      </div>
    </ReservationDialog>
  );
};