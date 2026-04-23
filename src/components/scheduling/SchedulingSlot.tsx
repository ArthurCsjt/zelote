import React, { useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { Plus, Monitor, User, CheckCircle, AlertTriangle, Clock, Trash2, ArrowRight, Laptop, Info } from 'lucide-react';
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

  const pastSlotClasses = isPast ? "opacity-40" : "";

  if (isAvailable) {
    if (isPast) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className={cn(
                "h-full min-h-[4rem] border-[3px] border-dashed border-zinc-400 dark:border-zinc-600 bg-zinc-300 dark:bg-zinc-700",
                "flex items-center justify-center gap-1.5",
                "opacity-80 cursor-not-allowed"
              )}>
                <Clock className="h-3.5 w-3.5 text-zinc-700 dark:text-zinc-300" />
                <span className="text-[9px] font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-widest">Encerrado</span>
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
          "h-full min-h-[4rem] border-[3px] border-dashed border-zinc-400 dark:border-zinc-700 bg-white dark:bg-zinc-950",
          "flex items-center justify-center cursor-pointer group hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
        )}>
          <Plus className="h-5 w-5 text-zinc-400 group-hover:text-zinc-700 transition-colors" />
        </div>
      </ReservationDialog>
    );
  }

  // Se tivermos reservas (Full ou Partial)
  const content = (
    <div className={cn(
      "h-full min-h-[4rem] p-1.5 border-3 transition-all flex flex-col gap-1.5",
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
          label = `${roomName}`;
        } else {
          // On mobile we use a much more compact label
          const isSmallScreen = typeof window !== 'undefined' && window.innerWidth < 640;
          if (isSmallScreen) {
            label = res.classroom ? `${roomName} · ${res.quantity_requested}x` : `${res.quantity_requested}x CBs`;
          } else {
            label = res.classroom ? `${roomName} + ${res.quantity_requested} Chromebooks` : `${res.quantity_requested} Chromebooks`;
          }
        }

        return (
          <TooltipProvider key={res.id}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className={cn(
                    "w-full flex-1 flex items-center justify-center text-[8px] sm:text-[10px] leading-tight font-black uppercase truncate px-1 sm:px-1.5 py-1.5 sm:py-2 border-[1px] border-black text-center transition-all",
                    !isPast && "hover:-translate-y-[2px] cursor-pointer",
                    isPast && "cursor-default",
                    // Alta resolução no texto
                    "text-white [text-shadow:_-1px_-1px_0_rgba(0,0,0,0.5),_1px_-1px_0_rgba(0,0,0,0.5),_-1px_1px_0_rgba(0,0,0,0.5),_1px_1px_0_rgba(0,0,0,0.5)]",
                    res.is_minecraft
                      ? "bg-gradient-to-br from-[#2d5a27] to-[#1e3c1a] shadow-[2px_2px_0_0_#000] sm:shadow-[3px_3px_0_0_#000]"
                      : "bg-gradient-to-br from-blue-600 to-indigo-600 shadow-[2px_2px_0_0_#000] sm:shadow-[3px_3px_0_0_#000]",
                  )}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isPast) return; // Bloqueia clique no passado
                    if (isThisMine || isAdmin || isResponsible) {
                      setIsDetailsOpen(res.id);
                    }
                  }}
                >
                  {label}
                </div>
              </TooltipTrigger>
              <TooltipContent 
                side="top" 
                sideOffset={8}
                className="max-w-[200px] p-2.5 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-none bg-white dark:bg-zinc-950 z-[100]"
              >
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <div className="flex flex-col min-w-0">
                      <span className="text-[12px] font-black uppercase truncate leading-tight text-black dark:text-white">
                        {res.prof_name && res.prof_name !== 'Usuário Desconhecido' ? res.prof_name : (res.prof_email?.split('@')[0] || 'Professor')}
                      </span>
                      <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 lowercase truncate">
                        {res.prof_email}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-0.5 text-[11px] font-bold uppercase text-zinc-500 dark:text-zinc-400 border-t border-zinc-100 dark:border-zinc-800 pt-2">
                    <span>{res.classroom || 'ESPAÇO'}</span>
                    <span>{res.quantity_requested} Chromebooks</span>
                  </div>

                  {(isThisMine || isAdmin || isResponsible) && (
                    <div className="flex gap-1.5 pt-1">
                      {(isThisMine || isSuperAdmin) && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteReservation(res.id).then((success: boolean) => success && onReservationSuccess());
                          }}
                          className="text-[10px] font-black text-red-500 uppercase hover:underline"
                        >
                          Remover
                        </button>
                      )}
                      {isResponsible && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate('/', {
                              state: {
                                fromScheduling: true,
                                reservationData: { ...res, date, time_slot: timeSlot }
                              }
                            });
                          }}
                          className="text-[10px] font-black text-primary uppercase hover:underline ml-auto"
                        >
                          Iniciar
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      })}

      {/* Botão explícito para Novo Agendamento se houver espaço e não for passado */}
      {isPartial && restantes > 0 && !isPast && (
        <div className="mt-auto flex items-center justify-center gap-1.5 py-1 border-2 border-zinc-400 dark:border-zinc-500 bg-white dark:bg-zinc-950 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors text-zinc-600 dark:text-zinc-400">
          <Plus className="h-3 w-3" />
          <span className="text-[9px] font-bold uppercase tracking-tight">Adicionar</span>
        </div>
      )}
    </div>
  );

  return (
    <>
      {isPartial && !isPast ? (
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
