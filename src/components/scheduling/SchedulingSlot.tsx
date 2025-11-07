import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Plus, Monitor, User, CheckCircle, AlertTriangle, Eye } from 'lucide-react';
import type { Reservation } from '@/hooks/useDatabase';
import type { User as AuthUser } from '@supabase/supabase-js';
import { ReservationDialog } from './ReservationDialog';
import { ReservationViewDialog } from './ReservationViewDialog'; // NOVO IMPORT

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
  
  // 1. Minha Reserva (AGORA CLICÁVEL PARA VISUALIZAR/EDITAR)
  if (myReservation) {
    return (
      <ReservationViewDialog
        open={false} // Controlado internamente pelo slot
        onOpenChange={() => {}} // Não é necessário, mas mantido para tipagem
        reservation={myReservation}
        professores={professores}
        totalAvailableChromebooks={totalAvailableChromebooks}
        allReservationsForSlot={allReservationsForSlot}
        onReservationUpdate={onReservationSuccess}
      >
        <div className={cn(
          "slot my-reservation cursor-pointer hover:shadow-md",
          "bg-blue-50/80 border-l-4 border-l-blue-500 text-blue-900 dark:bg-blue-950/50 dark:border-l-blue-400 dark:text-blue-200",
          "p-2 flex flex-col justify-center"
        )}>
          <div className="slot-title flex items-center gap-1 text-blue-700 dark:text-blue-400">
            <CheckCircle className="h-3 w-3" />
            Minha Reserva
          </div>
          <div className="slot-subtitle text-xs font-medium text-blue-800 dark:text-blue-300">
            {myReservation.subject}
          </div>
          <div className="text-[10px] text-blue-600 dark:text-blue-400 flex items-center gap-1">
            <Monitor className="h-3 w-3" />
            {myReservation.quantity_requested} 💻
          </div>
        </div>
      </ReservationViewDialog>
    );
  }
  
  // 2. Esgotado (AGORA CLICÁVEL PARA VISUALIZAR TODAS AS RESERVAS)
  if (isFull) {
    return (
      <ReservationViewDialog
        open={false}
        onOpenChange={() => {}}
        reservation={allReservationsForSlot[0]} // Usa a primeira reserva para contexto
        professores={professores}
        totalAvailableChromebooks={totalAvailableChromebooks}
        allReservationsForSlot={allReservationsForSlot}
        onReservationUpdate={onReservationSuccess}
      >
        <div className={cn(
          "slot full cursor-pointer hover:shadow-md",
          "bg-red-50/80 border-l-4 border-l-red-500 text-red-900 dark:bg-red-950/50 dark:border-l-red-400 dark:text-red-200",
          "p-2 flex flex-col justify-center"
        )}>
          <div className="slot-title flex items-center gap-1 text-red-700 dark:text-red-400">
            <AlertTriangle className="h-3 w-3" />
            Esgotado
          </div>
          <div className="slot-subtitle text-xs font-medium text-red-800 dark:text-red-300">
            {jaReservados}/{totalAvailableChromebooks} 💻
          </div>
          <div className="text-[10px] text-red-600 dark:text-red-400 flex items-center gap-1">
            <Eye className="h-3 w-3" />
            Ver detalhes
          </div>
        </div>
      </ReservationViewDialog>
    );
  }
  
  // 3. Parcialmente Reservado (CLICÁVEL PARA RESERVAR OU VER DETALHES)
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
          "bg-amber-50/80 border-l-4 border-l-amber-500 text-amber-900 dark:bg-amber-950/50 dark:border-l-amber-400 dark:text-amber-200",
          "p-2 flex flex-col justify-center"
        )}>
          <div className="slot-title flex items-center gap-1 text-amber-700 dark:text-amber-400">
            <Monitor className="h-3 w-3" />
            Disponível
          </div>
          <div className="slot-subtitle text-xs font-medium text-amber-800 dark:text-amber-300">
            {restantes}/{totalAvailableChromebooks} 💻 restantes
          </div>
          <div className="text-[10px] text-amber-600 dark:text-amber-400">
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