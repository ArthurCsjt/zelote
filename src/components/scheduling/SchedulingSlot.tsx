import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Plus, Monitor, User, CheckCircle, AlertTriangle, Clock } from 'lucide-react';
import type { Reservation } from '@/hooks/useDatabase';
import type { User as AuthUser } from '@supabase/supabase-js';
import { ReservationDialog } from './ReservationDialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { format } from 'date-fns';

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
  
  const { jaReservados, restantes, myReservation, isAvailable, isPartial, isFull, isPast } = useMemo(() => {
    const jaReservados = allReservationsForSlot.reduce((sum, res) => sum + res.quantity_requested, 0);
    const restantes = totalAvailableChromebooks - jaReservados;
    const myReservation = allReservationsForSlot.find(res => res.created_by === currentUser?.id);
    
    const isAvailable = jaReservados === 0;
    const isPartial = jaReservados > 0 && restantes > 0;
    const isFull = restantes <= 0 && jaReservados > 0;
    
    // Verifica se a data é anterior ao dia atual (ignorando a hora)
    const todayStart = new Date(new Date().setHours(0, 0, 0, 0));
    const isPast = date < todayStart;

    return { jaReservados, restantes, myReservation, isAvailable, isPartial, isFull, isPast };
  }, [allReservationsForSlot, totalAvailableChromebooks, currentUser, date]);

  // DATA PASSADA - BLOQUEADO
  if (isPast) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={cn(
              "slot past min-h-[60px] sm:min-h-[70px]",
              "bg-muted/30 border border-border/30",
              "flex items-center justify-center",
              "opacity-40 cursor-not-allowed"
            )}>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">Horário passado</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // MINHA RESERVA
  if (myReservation) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={cn(
              "slot my-reservation min-h-[60px] sm:min-h-[70px]",
              "bg-gradient-to-br from-info-bg/50 to-info-bg/30",
              "border-l-4 border-l-info",
              "border border-info/20",
              "p-3 flex flex-col justify-center gap-1",
              "hover:shadow-md transition-shadow"
            )}>
              <div className="flex items-center gap-1.5">
                <CheckCircle className="h-4 w-4 text-info dark:text-info-foreground shrink-0" />
                <span className="text-xs font-semibold text-info-foreground truncate">
                  Minha Reserva
                </span>
              </div>
              <p className="text-xs font-medium text-foreground dark:text-info-foreground truncate">
                {myReservation.subject}
              </p>
              <div className="flex items-center gap-1">
                <Monitor className="h-3 w-3 text-info dark:text-info-foreground" />
                <span className="text-[10px] font-medium text-muted-foreground dark:text-info-foreground/80">
                  {myReservation.quantity_requested} Chromebook{myReservation.quantity_requested > 1 ? 's' : ''}
                </span>
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs">
            <div className="space-y-1">
              <p className="font-semibold text-sm">{myReservation.subject}</p>
              <p className="text-xs text-muted-foreground">
                {myReservation.prof_name} · {myReservation.quantity_requested} CB
              </p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
  
  // ESGOTADO
  if (isFull) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={cn(
              "slot full min-h-[60px] sm:min-h-[70px]",
              "bg-gradient-to-br from-error-bg/50 to-error-bg/30",
              "border-l-4 border-l-error",
              "border border-error/20",
              "p-3 flex flex-col justify-center gap-1"
            )}>
              <div className="flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4 text-error dark:text-error-foreground shrink-0" />
                <span className="text-xs font-semibold text-error-foreground truncate">
                  Esgotado
                </span>
              </div>
              <p className="text-xs font-medium text-foreground dark:text-error-foreground">
                {jaReservados}/{totalAvailableChromebooks} 💻
              </p>
              <p className="text-[10px] text-muted-foreground dark:text-error-foreground/80 truncate">
                {allReservationsForSlot.length > 1 
                  ? `${allReservationsForSlot.length} reservas` 
                  : allReservationsForSlot[0]?.prof_name
                }
              </p>
            </div>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs">
            <div className="space-y-2">
              <p className="font-semibold text-sm">Reservas neste horário:</p>
              {allReservationsForSlot.map((res, idx) => (
                <div key={idx} className="text-xs">
                  <p className="font-medium">{res.prof_name}</p>
                  <p className="text-muted-foreground">{res.subject} · {res.quantity_requested} CB</p>
                </div>
              ))}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
  
  // PARCIALMENTE RESERVADO
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
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className={cn(
                "slot partial min-h-[60px] sm:min-h-[70px]",
                "bg-gradient-to-br from-warning-bg/50 to-warning-bg/30",
                "border-l-4 border-l-warning",
                "border border-warning/20",
                "p-3 flex flex-col justify-center gap-1",
                "cursor-pointer hover:shadow-lg hover:scale-[1.02]",
                "group"
              )}>
                <div className="flex items-center gap-1.5">
                  <Monitor className="h-4 w-4 text-warning dark:text-warning-foreground shrink-0 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-semibold text-warning-foreground truncate">
                    Disponível
                  </span>
                </div>
                <p className="text-xs font-medium text-foreground dark:text-warning-foreground">
                  {restantes}/{totalAvailableChromebooks} 💻 restantes
                </p>
                <p className="text-[10px] text-muted-foreground dark:text-warning-foreground/80">
                  {jaReservados} reservados
                </p>
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs">
              <div className="space-y-2">
                <p className="font-semibold text-sm">Reservas existentes:</p>
                {allReservationsForSlot.map((res, idx) => (
                  <div key={idx} className="text-xs">
                    <p className="font-medium">{res.prof_name}</p>
                    <p className="text-muted-foreground">{res.subject} · {res.quantity_requested} CB</p>
                  </div>
                ))}
                <p className="pt-2 font-bold text-success">Clique para reservar os {restantes} restantes.</p>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </ReservationDialog>
    );
  }

  // DISPONÍVEL (VAZIO)
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
        "slot available min-h-[60px] sm:min-h-[70px]",
        "bg-background-secondary border-2 border-dashed border-border hover:bg-muted dark:bg-card/50 dark:border-border-strong",
        "flex items-center justify-center cursor-pointer",
        "group"
      )}>
        <Plus className="h-5 w-5 text-muted-foreground transition-transform group-hover:scale-110" />
      </div>
    </ReservationDialog>
  );
};