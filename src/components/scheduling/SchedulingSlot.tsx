import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Plus, Monitor, User, CheckCircle, AlertTriangle, Clock, Trash2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import type { Reservation } from '@/hooks/useDatabase';
import type { User as AuthUser } from '@supabase/supabase-js';
import { ReservationDialog } from './ReservationDialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useProfileRole } from '@/hooks/use-profile-role';
import { useDatabase } from '@/hooks/useDatabase';

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
  const { role, isAdmin } = useProfileRole();
  const { deleteReservation } = useDatabase();
  const navigate = useNavigate();

  const isSuperAdmin = role === 'super_admin';

  // Lista de e-mails responsáveis pela sala google (conforme solicitado pelo usuário)
  const responsibleEmails = [
    'eduardo.cardoso@colegiosaojudas.com.br',
    'davi.rossin@colegiosaojudas.com.br',
    'arthur.alencar@colegiosaojudas.com.br'
  ];

  const isResponsible = useMemo(() => {
    return isSuperAdmin || (currentUser?.email && responsibleEmails.includes(currentUser.email));
  }, [isSuperAdmin, currentUser]);

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

  // MY RESERVATION - Refined Neo Brutal Style
  if (myReservation) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={cn(
              "h-14 p-1.5 transition-all flex flex-col justify-center gap-0 bg-card",
              myReservation.is_minecraft
                ? "border-l-3 border-l-[#3c8527] bg-[#3c8527]/5"
                : "border-l-3 border-l-info bg-info/5",
              pastSlotClasses
            )}>
              <div className="flex items-center gap-1">
                {myReservation.is_minecraft ? (
                  <>
                    <Monitor className="h-2.5 w-2.5 text-[#3c8527] shrink-0" />
                    <span className="text-[9px] font-black uppercase text-[#3c8527] truncate">
                      Minecraft
                    </span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-2.5 w-2.5 text-info shrink-0" />
                    <span className="text-[9px] font-black uppercase text-info truncate">
                      Minha
                    </span>
                  </>
                )}
              </div>
              <p className="text-[9px] font-bold text-foreground/80 truncate leading-tight">
                {myReservation.justification}
              </p>
              <span className="text-[8px] font-bold text-muted-foreground">
                {myReservation.quantity_requested} CB
              </span>
            </div>
          </TooltipTrigger>
          <TooltipContent className="border-2 border-foreground/20 rounded-none shadow-[3px_3px_0px_0px_hsl(var(--foreground)/0.1)]">
            <p className="font-bold text-sm">
              {myReservation.is_minecraft && <span className="text-[#3c8527] mr-2">[MINECRAFT]</span>}
              {myReservation.justification}
            </p>
            <p className="text-xs text-muted-foreground">
              {myReservation.prof_name && myReservation.prof_name !== 'Usuário Desconhecido' ? myReservation.prof_name : (myReservation.prof_email || 'Usuário Desconhecido')} · {myReservation.quantity_requested} Chromebooks
              {myReservation.classroom && ` · Sala: ${myReservation.classroom}`}
            </p>
            {myReservation.created_by === currentUser?.id && (
              <Button
                variant="destructive"
                size="sm"
                className="w-full mt-2 h-6 text-[9px] font-black uppercase rounded-none border border-foreground"
                onClick={() => deleteReservation(myReservation!.id).then((success: boolean) => success && onReservationSuccess())}
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Cancelar
              </Button>
            )}
            {isResponsible && (
              <Button
                variant="outline"
                size="sm"
                className="w-full mt-2 h-6 text-[9px] font-black uppercase rounded-none border border-primary bg-primary/5 hover:bg-primary hover:text-white transition-all"
                onClick={() => {
                  navigate('/', {
                    state: {
                      fromScheduling: true,
                      reservationData: {
                        ...myReservation,
                        date: date,
                        time_slot: timeSlot
                      }
                    }
                  });
                }}
              >
                <ArrowRight className="h-3 w-3 mr-1" />
                Empréstimo
              </Button>
            )}
            {isSuperAdmin && myReservation.created_by !== currentUser?.id && (
              <Button
                variant="destructive"
                size="sm"
                className="w-full mt-2 h-6 text-[9px] font-black uppercase rounded-none border border-foreground"
                onClick={() => deleteReservation(myReservation!.id).then((success: boolean) => success && onReservationSuccess())}
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Remover (Admin)
              </Button>
            )}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // FULL - Refined Neo Brutal Style
  if (isFull) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={cn(
              "h-14 p-1.5 transition-all flex flex-col justify-center gap-0 cursor-not-allowed bg-card",
              (allReservationsForSlot.some(r => r.is_minecraft))
                ? "border-l-3 border-l-[#3c8527] bg-[#3c8527]/5"
                : "border-l-3 border-l-error bg-error/5",
              pastSlotClasses
            )}>
              <div className="flex items-center gap-1">
                {allReservationsForSlot.some(r => r.is_minecraft) ? (
                  <>
                    <Monitor className="h-2.5 w-2.5 text-[#3c8527] shrink-0" />
                    <span className="text-[9px] font-black uppercase text-[#3c8527] truncate">
                      Minecraft
                    </span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-2.5 w-2.5 text-error shrink-0" />
                    <span className="text-[9px] font-black uppercase text-error truncate">
                      Esgotado
                    </span>
                  </>
                )}
              </div>
              <p className="text-[9px] font-bold text-foreground/80">
                {jaReservados}/{totalAvailableChromebooks}
              </p>
              <p className="text-[8px] text-muted-foreground truncate">
                {allReservationsForSlot.length > 1
                  ? `${allReservationsForSlot.length} reservas`
                  : (allReservationsForSlot[0]?.prof_name && allReservationsForSlot[0]?.prof_name !== 'Usuário Desconhecido'
                    ? allReservationsForSlot[0]?.prof_name.split(' ')[0]
                    : 'Reservado')
                }
              </p>
            </div>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs border-2 border-foreground/20 rounded-none shadow-[3px_3px_0px_0px_hsl(var(--foreground)/0.1)]">
            <div className="space-y-2">
              <p className="font-black text-xs uppercase">Reservas:</p>
              {allReservationsForSlot.map((res, idx) => (
                <div key={idx} className={cn(
                  "text-xs border-l-2 pl-2",
                  res.is_minecraft ? "border-[#3c8527]" : "border-error"
                )}>
                  <p className="font-bold text-[11px]">
                    {res.is_minecraft && <span className="text-[#3c8527] mr-1">[MC]</span>}
                    {res.prof_name && res.prof_name !== 'Usuário Desconhecido' ? res.prof_name : (res.prof_email || 'Usuário')}
                    {res.classroom && <span className="ml-1 text-[8px] px-1 bg-info/10 text-info">{res.classroom}</span>}
                  </p>
                  <p className="text-[10px] text-muted-foreground mb-1">{res.justification} · {res.quantity_requested} CB</p>
                  {res.associated_loans && res.associated_loans.length > 0 && (
                    <div className="flex flex-wrap gap-0.5 mt-1 mb-1">
                      {res.associated_loans.map((loan, lIdx) => (
                        <span key={lIdx} className="text-[7px] font-bold bg-primary text-primary-foreground px-1 py-0.5">
                          {loan.chromebook_id}
                        </span>
                      ))}
                    </div>
                  )}
                  {(isSuperAdmin || res.created_by === currentUser?.id) && (
                    <Button
                      variant="destructive"
                      size="sm"
                      className="h-5 px-2 text-[8px] font-black uppercase rounded-none border border-foreground mb-1"
                      onClick={() => deleteReservation(res.id).then((success: boolean) => success && onReservationSuccess())}
                    >
                      <Trash2 className="h-2.5 w-2.5 mr-1" />
                      {res.created_by === currentUser?.id ? 'Cancelar' : 'Remover'}
                    </Button>
                  )}
                  {isResponsible && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-5 px-2 text-[8px] font-black uppercase rounded-none border border-primary bg-primary/5 hover:bg-primary hover:text-white transition-all ml-1 mb-1"
                      onClick={() => {
                        navigate('/', {
                          state: {
                            fromScheduling: true,
                            reservationData: {
                              ...res,
                              date: date,
                              time_slot: timeSlot
                            }
                          }
                        });
                      }}
                    >
                      <ArrowRight className="h-2.5 w-2.5 mr-1" />
                      Empréstimo
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // PARTIAL - Refined Neo Brutal Style
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
                "h-14 p-1.5 transition-all flex flex-col justify-center gap-0 cursor-pointer group bg-card",
                allReservationsForSlot.some(r => r.is_minecraft)
                  ? "border-l-3 border-l-[#3c8527] bg-[#3c8527]/5"
                  : "border-l-3 border-l-warning bg-warning/5",
                "hover:bg-warning/10",
                pastSlotClasses
              )}>
                <div className="flex items-center gap-1">
                  {allReservationsForSlot.some(r => r.is_minecraft) ? (
                    <>
                      <Monitor className="h-2.5 w-2.5 text-[#3c8527] shrink-0" />
                      <span className="text-[9px] font-black uppercase text-[#3c8527] truncate">
                        Minecraft
                      </span>
                    </>
                  ) : (
                    <>
                      <Monitor className="h-2.5 w-2.5 text-warning shrink-0" />
                      <span className="text-[9px] font-black uppercase text-warning truncate">
                        Parcial
                      </span>
                    </>
                  )}
                </div>
                <p className="text-[9px] font-bold text-foreground/80">
                  {restantes}/{totalAvailableChromebooks}
                </p>
                <p className="text-[8px] text-muted-foreground">
                  {jaReservados} usados
                </p>
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs border-2 border-foreground/20 rounded-none shadow-[3px_3px_0px_0px_hsl(var(--foreground)/0.1)]">
              <div className="space-y-2">
                <p className="font-black text-xs uppercase">Reservas:</p>
                {allReservationsForSlot.map((res, idx) => (
                  <div key={idx} className={cn(
                    "text-xs border-l-2 pl-2",
                    res.is_minecraft ? "border-[#3c8527]" : "border-warning"
                  )}>
                    <p className="font-bold text-[11px]">
                      {res.is_minecraft && <span className="text-[#3c8527] mr-1">[MC]</span>}
                      {res.prof_name && res.prof_name !== 'Usuário Desconhecido' ? res.prof_name : (res.prof_email || 'Usuário')}
                      {res.classroom && <span className="ml-1 text-[8px] px-1 bg-info/10 text-info">{res.classroom}</span>}
                    </p>
                    <p className="text-[10px] text-muted-foreground mb-1">{res.justification} · {res.quantity_requested} CB</p>
                    {(isSuperAdmin || res.created_by === currentUser?.id) && (
                      <Button
                        variant="destructive"
                        size="sm"
                        className="h-5 px-2 text-[8px] font-black uppercase rounded-none border border-foreground mb-1"
                        onClick={() => deleteReservation(res.id).then((success: boolean) => success && onReservationSuccess())}
                      >
                        <Trash2 className="h-2.5 w-2.5 mr-1" />
                        {res.created_by === currentUser?.id ? 'Cancelar' : 'Remover'}
                      </Button>
                    )}
                    {isResponsible && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-5 px-2 text-[8px] font-black uppercase rounded-none border border-primary bg-primary/5 hover:bg-primary hover:text-white transition-all ml-1 mb-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate('/', {
                            state: {
                              fromScheduling: true,
                              reservationData: {
                                ...res,
                                date: date,
                                time_slot: timeSlot
                              }
                            }
                          });
                        }}
                      >
                        <ArrowRight className="h-2.5 w-2.5 mr-1" />
                        Empréstimo
                      </Button>
                    )}
                  </div>
                ))}
                <p className="pt-1 font-black text-success text-[10px] uppercase">
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
              "h-14 bg-muted/20",
              "flex items-center justify-center gap-1",
              "opacity-30 cursor-not-allowed"
            )}>
              <Clock className="h-2.5 w-2.5 text-muted-foreground" />
              <span className="text-[8px] font-bold text-muted-foreground uppercase">—</span>
            </div>
          </TooltipTrigger>
          <TooltipContent className="border border-foreground/20 rounded-none">
            <p className="text-xs font-medium">Horário expirado</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // AVAILABLE (EMPTY) - Refined Style
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
        "h-14 bg-card border-l-3 border-l-transparent",
        "flex items-center justify-center cursor-pointer group transition-all",
        "hover:bg-primary/5 hover:border-l-primary/50"
      )}>
        <Plus className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary group-hover:scale-110 transition-all" />
      </div>
    </ReservationDialog>
  );
};
