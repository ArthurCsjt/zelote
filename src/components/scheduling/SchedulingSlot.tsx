import React, { useMemo, useState } from 'react';
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
import { ReservationDetailsDialog } from './ReservationDetailsDialog';

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
  const [isDetailsOpen, setIsDetailsOpen] = useState<string | false>(false);

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

    const isAvailable = allReservationsForSlot.length === 0;
    const isPartial = !isAvailable && restantes > 0;
    const isFull = !isAvailable && restantes <= 0;
    const hasMinecraft = allReservationsForSlot.some(res => res.is_minecraft);

    const [hourStr, minuteStr] = timeSlot.split('h');
    const slotTime = new Date(date);
    slotTime.setHours(parseInt(hourStr), parseInt(minuteStr), 0, 0);

    const now = new Date();
    const isPast = slotTime < now;

    return { jaReservados, restantes, myReservation, isAvailable, isPartial, isFull, isPast, hasMinecraft };
  }, [allReservationsForSlot, totalAvailableChromebooks, currentUser, date, timeSlot]);

  const pastSlotClasses = isPast ? "opacity-40 cursor-not-allowed pointer-events-none" : "";

  if (isAvailable) {
    if (isPast) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className={cn(
                "min-h-16 border-3 border-dashed border-foreground/10 bg-muted/10",
                "flex items-center justify-center gap-1",
                "opacity-40 cursor-not-allowed"
              )}>
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-[10px] font-bold text-muted-foreground uppercase">Expirado</span>
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
          "min-h-16 border-3 border-dashed border-foreground/20 bg-background",
          "flex items-center justify-center cursor-pointer group transition-all",
          "hover:border-primary hover:bg-primary/5",
          "hover:shadow-[3px_3px_0px_0px_hsl(var(--primary)/0.2)] hover:-translate-x-0.5 hover:-translate-y-0.5"
        )}>
          <Plus className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:scale-110 transition-all" />
        </div>
      </ReservationDialog>
    );
  }

  // Se tivermos reservas (Full ou Partial)
  const content = (
    <div className={cn(
      "min-h-16 p-1 border-3 transition-all flex flex-col gap-1",
      isFull
        ? "border-error bg-error/10 cursor-not-allowed"
        : "border-warning bg-warning/10 cursor-pointer hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] hover:-translate-x-0.5 hover:-translate-y-0.5",
      pastSlotClasses
    )}>
      {allReservationsForSlot.map((res) => {
        const isThisMine = res.created_by === currentUser?.id;
        const roomName = res.classroom ? res.classroom.toUpperCase() : "ESPAÇO";
        let label = "";

        if (res.quantity_requested === 0) {
          label = `${roomName} RESERVADA`;
        } else {
          label = res.classroom ? `${roomName} + ${res.quantity_requested} CB` : `${res.quantity_requested} CB`;
        }

        return (
          <TooltipProvider key={res.id}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className={cn(
                    "w-full text-[9px] sm:text-[10px] leading-tight font-black uppercase truncate px-1.5 py-2 border-2 border-black text-center transition-all hover:-translate-y-[2px] cursor-pointer",
                    isThisMine
                      ? "bg-blue-600 text-white shadow-[3px_3px_0_0_#000]"
                      : res.is_minecraft
                        ? "bg-[#3c8527] text-white shadow-[3px_3px_0_0_#000]"
                        : "bg-white text-black dark:bg-zinc-800 dark:text-zinc-100 shadow-[3px_3px_0_0_#000]",
                  )}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isThisMine || isAdmin || isResponsible) {
                      setIsDetailsOpen(res.id);
                    }
                  }}
                >
                  {label}
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-sm border-3 border-foreground/20 rounded-none shadow-[4px_4px_0px_0px_hsl(var(--foreground)/0.1)] p-3">
                <div className="space-y-2">
                  <p className="font-bold text-sm leading-tight">
                    {res.is_minecraft && <span className="text-[#3c8527] mr-1">[MINECRAFT]</span>}
                    {res.prof_name && res.prof_name !== 'Usuário Desconhecido' ? res.prof_name : (res.prof_email || 'Usuário Desconhecido')}
                    {res.classroom && <span className="ml-2 text-[10px] px-1.5 py-0.5 border border-info text-info">SALA: {res.classroom}</span>}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {res.justification || "Sem justificativa"} · {res.quantity_requested > 0 ? `${res.quantity_requested} CB` : "Apenas Espaço"}
                  </p>

                  {res.associated_loans && res.associated_loans.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1 mb-2">
                      {res.associated_loans.map((loan, lIdx) => (
                        <span key={lIdx} className="text-[8px] font-black bg-blue-600 text-white px-1.5 py-0.5 border border-black">
                          {loan.chromebook_id}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    {(isThisMine || isSuperAdmin) && (
                      <Button
                        variant="destructive"
                        size="sm"
                        className="h-6 px-2 text-[9px] font-black uppercase rounded-none border-2 border-foreground"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteReservation(res.id).then((success: boolean) => success && onReservationSuccess());
                        }}
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        {isThisMine ? 'Cancelar' : 'Remover'}
                      </Button>
                    )}

                    {isResponsible && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-6 px-2 text-[9px] font-black uppercase rounded-none border-2 border-primary bg-primary/5 hover:bg-primary hover:text-white transition-all"
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
                        <ArrowRight className="h-3 w-3 mr-1" />
                        Iniciar Empréstimo
                      </Button>
                    )}
                  </div>

                  {(isThisMine || isAdmin || isResponsible) && (
                    <p className="text-[9px] font-black text-blue-600 uppercase tracking-tighter italic mt-1">Clique na tag para mais detalhes</p>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      })}

      {/* Botão explícito para Novo Agendamento se houver espaço e não for passado */}
      {isPartial && restantes > 0 && !isPast && (
        <div className="mt-auto flex items-center justify-center gap-1.5 py-1.5 border-2 border-dashed border-warning bg-warning/5 hover:bg-warning/15 transition-all text-warning group/btn">
          <Plus className="h-4 w-4 group-hover/btn:scale-125 transition-transform" />
          <span className="text-[10px] font-black uppercase">Agendar</span>
        </div>
      )}
    </div>
  );

  return (
    <>
      {isPartial ? (
        <ReservationDialog
          date={date}
          timeSlot={timeSlot}
          totalAvailableChromebooks={totalAvailableChromebooks}
          currentReservations={allReservationsForSlot}
          onReservationSuccess={onReservationSuccess}
          maxQuantity={restantes}
        >
          {content}
        </ReservationDialog>
      ) : (
        content
      )}

      {isDetailsOpen && typeof isDetailsOpen === 'string' && (
        <ReservationDetailsDialog
          open={!!isDetailsOpen}
          onOpenChange={(open) => {
            if (!open) setIsDetailsOpen(false);
          }}
          reservation={allReservationsForSlot.find(r => r.id === isDetailsOpen)!}
          date={date}
          isOwner={allReservationsForSlot.find(r => r.id === isDetailsOpen)?.created_by === currentUser?.id}
          isAdmin={!!isAdmin}
          isResponsible={!!isResponsible}
          onCancel={() => {
            if (typeof isDetailsOpen === 'string') {
              deleteReservation(isDetailsOpen).then((success: boolean) => {
                if (success) {
                  onReservationSuccess();
                  setIsDetailsOpen(false);
                }
              });
            }
          }}
        />
      )}
    </>
  );
};
