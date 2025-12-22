import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Plus, Monitor, User, CheckCircle, AlertTriangle, Clock } from 'lucide-react';
import type { Reservation } from '@/hooks/useDatabase';
import type { User as AuthUser } from '@supabase/supabase-js';
import { ReservationDialog } from './ReservationDialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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
    const hasMinecraft = allReservationsForSlot.some(res => res.is_minecraft);

    const [hourStr, minuteStr] = timeSlot.split('h');
    const slotTime = new Date(date);
    slotTime.setHours(parseInt(hourStr), parseInt(minuteStr), 0, 0);

    const now = new Date();
    const isPast = slotTime < now;

    return { jaReservados, restantes, myReservation, isAvailable, isPartial, isFull, isPast, hasMinecraft };
  }, [allReservationsForSlot, totalAvailableChromebooks, currentUser, date, timeSlot]);

  const pastSlotClasses = isPast ? "opacity-40 cursor-not-allowed pointer-events-none" : "";

  // MY RESERVATION - Neo Brutal Style
  if (myReservation) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={cn(
              "h-16 p-2 border-3 transition-all flex flex-col justify-center gap-0.5",
              myReservation.is_minecraft
                ? "border-[#3c8527] bg-[#3c8527]/10 shadow-[3px_3px_0px_0px_#3c8527/0.3]"
                : "border-info bg-info/10 shadow-[3px_3px_0px_0px_hsl(var(--info)/0.3)]",
              pastSlotClasses
            )}>
              <div className="flex items-center gap-1">
                {myReservation.is_minecraft ? (
                  <>
                    <Monitor className="h-3 w-3 text-[#3c8527] shrink-0" />
                    <span className="text-[10px] font-black uppercase text-[#3c8527] truncate">
                      MINECRAFT
                    </span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-3 w-3 text-info shrink-0" />
                    <span className="text-[10px] font-black uppercase text-info truncate">
                      Minha Reserva
                    </span>
                  </>
                )}
              </div>
              <p className="text-[10px] font-bold text-foreground truncate">
                {myReservation.justification}
              </p>
              <div className="flex items-center gap-1">
                <Monitor className="h-2.5 w-2.5 text-muted-foreground" />
                <span className="text-[9px] font-bold text-muted-foreground">
                  {myReservation.quantity_requested} CB
                </span>
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent className="border-3 border-foreground/20 rounded-none shadow-[4px_4px_0px_0px_hsl(var(--foreground)/0.1)]">
            <p className="font-bold text-sm">
              {myReservation.is_minecraft && <span className="text-[#3c8527] mr-2">[MINECRAFT]</span>}
              {myReservation.justification}
            </p>
            <p className="text-xs text-muted-foreground">
              {myReservation.prof_name} · {myReservation.quantity_requested} Chromebooks
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // FULL - Neo Brutal Style
  if (isFull) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={cn(
              "h-16 p-2 border-3 transition-all flex flex-col justify-center gap-0.5 cursor-not-allowed",
              (allReservationsForSlot.some(r => r.is_minecraft))
                ? "border-[#3c8527] bg-[#3c8527]/20 shadow-[3px_3px_0px_0px_#3c8527/0.3]"
                : "border-error bg-error/10 shadow-[3px_3px_0px_0px_hsl(var(--error)/0.3)]",
              pastSlotClasses
            )}>
              <div className="flex items-center gap-1">
                {allReservationsForSlot.some(r => r.is_minecraft) ? (
                  <>
                    <Monitor className="h-3 w-3 text-[#3c8527] shrink-0" />
                    <span className="text-[10px] font-black uppercase text-[#3c8527] truncate">
                      MINECRAFT
                    </span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-3 w-3 text-error shrink-0" />
                    <span className="text-[10px] font-black uppercase text-error truncate">
                      Esgotado
                    </span>
                  </>
                )}
              </div>
              <p className="text-[10px] font-bold text-foreground">
                {jaReservados}/{totalAvailableChromebooks} 💻
              </p>
              <p className="text-[9px] text-muted-foreground truncate">
                {allReservationsForSlot.length > 1
                  ? `${allReservationsForSlot.length} reservas`
                  : allReservationsForSlot[0]?.prof_name
                }
              </p>
            </div>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs border-3 border-foreground/20 rounded-none shadow-[4px_4px_0px_0px_hsl(var(--foreground)/0.1)]">
            <div className="space-y-2">
              <p className="font-black text-sm uppercase">Reservas neste horário:</p>
              {allReservationsForSlot.map((res, idx) => (
                <div key={idx} className={cn(
                  "text-xs border-l-2 pl-2",
                  res.is_minecraft ? "border-[#3c8527]" : "border-error"
                )}>
                  <p className="font-bold">
                    {res.is_minecraft && <span className="text-[#3c8527] mr-1">[MINECRAFT]</span>}
                    {res.prof_name}
                  </p>
                  <p className="text-muted-foreground">{res.justification} · {res.quantity_requested} CB</p>
                </div>
              ))}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // PARTIAL - Neo Brutal Style
  if (isPartial) {
    return (
      <ReservationDialog
        date={date}
        timeSlot={timeSlot}
        totalAvailableChromebooks={totalAvailableChromebooks}
        currentReservations={allReservationsForSlot}
        onReservationSuccess={onReservationSuccess}
        maxQuantity={restantes}
      >
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className={cn(
                "h-16 p-2 border-3 transition-all flex flex-col justify-center gap-0.5 cursor-pointer group",
                allReservationsForSlot.some(r => r.is_minecraft)
                  ? "border-[#3c8527] bg-[#3c8527]/10"
                  : "border-warning bg-warning/10",
                "hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] hover:-translate-x-0.5 hover:-translate-y-0.5",
                pastSlotClasses
              )}>
                <div className="flex items-center gap-1">
                  {allReservationsForSlot.some(r => r.is_minecraft) ? (
                    <>
                      <Monitor className="h-3 w-3 text-[#3c8527] shrink-0" />
                      <span className="text-[10px] font-black uppercase text-[#3c8527] truncate">
                        MINECRAFT
                      </span>
                    </>
                  ) : (
                    <>
                      <Monitor className="h-3 w-3 text-warning shrink-0 group-hover:scale-110 transition-transform" />
                      <span className="text-[10px] font-black uppercase text-warning truncate">
                        Disponível
                      </span>
                    </>
                  )}
                </div>
                <p className="text-[10px] font-bold text-foreground">
                  {restantes}/{totalAvailableChromebooks} 💻
                </p>
                <p className="text-[9px] text-muted-foreground">
                  {jaReservados} reservados
                </p>
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs border-3 border-foreground/20 rounded-none shadow-[4px_4px_0px_0px_hsl(var(--foreground)/0.1)]">
              <div className="space-y-2">
                <p className="font-black text-sm uppercase">Reservas existentes:</p>
                {allReservationsForSlot.map((res, idx) => (
                  <div key={idx} className={cn(
                    "text-xs border-l-2 pl-2",
                    res.is_minecraft ? "border-[#3c8527]" : "border-warning"
                  )}>
                    <p className="font-bold">
                      {res.is_minecraft && <span className="text-[#3c8527] mr-1">[MINECRAFT]</span>}
                      {res.prof_name}
                    </p>
                    <p className="text-muted-foreground">{res.justification} · {res.quantity_requested} CB</p>
                  </div>
                ))}
                <p className="pt-2 font-black text-success text-xs uppercase">
                  Clique para reservar {restantes} restantes
                </p>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </ReservationDialog>
    );
  }

  // PAST EMPTY
  if (isPast) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={cn(
              "h-16 border-3 border-dashed border-foreground/10 bg-muted/10",
              "flex items-center justify-center gap-1",
              "opacity-40 cursor-not-allowed"
            )}>
              <Clock className="h-3 w-3 text-muted-foreground" />
              <span className="text-[10px] font-bold text-muted-foreground uppercase">Passado</span>
            </div>
          </TooltipTrigger>
          <TooltipContent className="border-3 border-foreground/20 rounded-none">
            <p className="text-xs font-medium">Horário já expirou</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // AVAILABLE (EMPTY) - Neo Brutal Style
  return (
    <ReservationDialog
      date={date}
      timeSlot={timeSlot}
      totalAvailableChromebooks={totalAvailableChromebooks}
      currentReservations={allReservationsForSlot}
      onReservationSuccess={onReservationSuccess}
      maxQuantity={totalAvailableChromebooks}
    >
      <div className={cn(
        "h-16 border-3 border-dashed border-foreground/20 bg-background",
        "flex items-center justify-center cursor-pointer group transition-all",
        "hover:border-primary hover:bg-primary/5",
        "hover:shadow-[3px_3px_0px_0px_hsl(var(--primary)/0.2)] hover:-translate-x-0.5 hover:-translate-y-0.5"
      )}>
        <Plus className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:scale-110 transition-all" />
      </div>
    </ReservationDialog>
  );
};
