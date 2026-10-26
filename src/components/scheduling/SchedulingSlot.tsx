import React, { useMemo, useState, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Plus, Monitor, User, CheckCircle, AlertTriangle, Clock, Trash2, ArrowRight, Laptop, Info, Box } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import type { Reservation } from '@/hooks/useDatabase';
import type { User as AuthUser } from '@supabase/supabase-js';
import { ReservationDialog } from './ReservationDialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useProfileRole } from '@/hooks/use-profile-role';
import { useDatabase } from '@/hooks/useDatabase';
import { ReservationDetailsDialog } from './ReservationDetailsDialog';

import { useSchedulingResponsible } from '@/hooks/useSchedulingResponsible';

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
  // Mantém o ReservationDialog montado mesmo após a reserva ser criada,
  // para que a tela de confirmação (done) não seja desmontada pelo Realtime.
  const [dialogOpen, setDialogOpen] = useState(false);
  const dialogOpenRef = useRef(dialogOpen);
  dialogOpenRef.current = dialogOpen;

  const isSuperAdmin = role === 'super_admin';
  const { isResponsible } = useSchedulingResponsible();

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

  // Slot expirado sem reservas: mostra "Encerrado"
  if (isAvailable && isPast) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={cn(
              "h-full min-h-[4rem] border-[3px] border-dashed border-zinc-400 dark:border-zinc-600 bg-zinc-300 dark:bg-zinc-700 rounded-xl",
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

  // Slot disponível (vazio, não expirado): ReservationDialog sempre montado
  // para que a tela de confirmação não seja desmontada quando o Realtime
  // atualizar os dados e isAvailable virar false.
  if (isAvailable || dialogOpen) {

    return (
      <ReservationDialog
        date={date}
        timeSlot={timeSlot}
        totalAvailableChromebooks={totalAvailableChromebooks}
        currentReservations={allReservationsForSlot}
        onReservationSuccess={onReservationSuccess}
        maxQuantity={totalAvailableChromebooks}
        professores={professores}
        externalOpen={dialogOpen}
        onExternalOpenChange={setDialogOpen}
      >
        <div className={cn(
          "h-full min-h-[4rem] border-[3px] border-dashed border-zinc-400 dark:border-zinc-700 bg-white dark:bg-zinc-950 rounded-xl",
          "flex items-center justify-center cursor-pointer group hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
        )}>
          <Plus className="h-5 w-5 text-zinc-400 group-hover:text-zinc-700 transition-colors" />
        </div>
      </ReservationDialog>
    );
  }

  // Se tivermos reservas (Full ou Partial)
  const visible = allReservationsForSlot.slice(0, 3);
  const hidden = allReservationsForSlot.slice(3);
  const pct = totalAvailableChromebooks > 0 ? Math.min(100, (jaReservados / totalAvailableChromebooks) * 100) : 100;
  const barColor = isFull ? "bg-error" : pct >= 75 ? "bg-orange-500" : pct >= 30 ? "bg-orange-400" : "bg-warning";

  const content = (
    <div className={cn(
      "h-full min-h-[4rem] p-1.5 border-2 bg-card flex flex-col gap-1 shadow-[3px_3px_0_0_hsl(var(--foreground))]",
      isFull ? "border-error" : "border-foreground",
      pastSlotClasses
    )}>
      <div className="flex items-center gap-1.5 pb-1 border-b-2 border-foreground/20">
        <span className="text-[9px] font-black tabular-nums text-foreground leading-none">
          {jaReservados}/{totalAvailableChromebooks}
        </span>
        <div className="flex-1 h-1.5 border border-foreground bg-muted overflow-hidden">
          <div className={cn("h-full", barColor)} style={{ width: `${pct}%` }} />
        </div>
        {isFull ? (
          <span className="text-[8px] font-black uppercase leading-none px-1 py-0.5 border-2 border-foreground bg-error text-error-foreground">Lotado</span>
        ) : (
          <span className="hidden sm:inline text-[8px] font-black uppercase leading-none text-muted-foreground">Restam {restantes}</span>
        )}
      </div>
      {visible.map((res) => {
        const isManutencao = role === 'manutencao';
        const isManutencaoRes = res.prof_role === 'manutencao' || res.prof_email === 'paulo.geremias@colegiosaojudas.com.br' || res.prof_email === 'ivo@colegiosaojudas.com.br' || res.prof_email === 'manutencao.teste@colegiosaojudas.com.br';
        const isThisMine = res.created_by === currentUser?.id;
        const roomName = res.classroom ? res.classroom.toUpperCase() : "ESPAÇO";

        return (
          <TooltipProvider key={res.id}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className={cn(
                    "relative w-full min-h-[28px] flex items-center gap-1 pl-2.5 pr-1 py-1 border-2 bg-card text-foreground transition-all overflow-hidden",
                    isThisMine
                      ? "border-foreground shadow-[2px_2px_0_0_hsl(var(--foreground))]"
                      : "border-foreground/70",
                    !isPast && (isThisMine || isAdmin || isResponsible) && "cursor-pointer motion-safe:hover:-translate-y-px",
                    (isPast || !(isThisMine || isAdmin || isResponsible)) && "cursor-default",
                  )}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isPast) return;
                    if (isThisMine || isAdmin || isResponsible) {
                      setIsDetailsOpen(res.id);
                    }
                  }}
                >
                  <span
                    aria-hidden
                    className={cn(
                      "absolute left-0 top-0 bottom-0 w-1",
                      isManutencaoRes ? "bg-muted-foreground" : res.is_minecraft ? "bg-success" : "bg-primary"
                    )}
                  />
                  {res.is_minecraft && !isManutencaoRes && (
                    <Box className="h-3 w-3 shrink-0 text-success" strokeWidth={3} />
                  )}
                  <span className="flex-1 min-w-0 truncate text-left text-[9px] sm:text-[10px] leading-tight font-black uppercase">
                    {roomName}
                  </span>
                  {!isManutencaoRes && res.quantity_requested > 0 && (
                    <span className="shrink-0 flex items-center gap-0.5 px-1 py-0.5 border-2 border-foreground bg-warning text-foreground text-[9px] font-black leading-none">
                      <Laptop className="h-2.5 w-2.5" strokeWidth={3} />
                      {res.quantity_requested}
                    </span>
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent
                side="top"
                sideOffset={8}
                className="max-w-[200px] p-2.5 border-2 border-black dark:border-zinc-700 rounded-none shadow-[3px_3px_0_0_#000] dark:shadow-[3px_3px_0_0_rgba(255,255,255,0.1)] bg-white dark:bg-zinc-900 z-[100]"
              >
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <div className="flex flex-col min-w-0">
                      <span className="text-[12px] font-black uppercase truncate leading-tight text-black dark:text-white">
                        {res.prof_name && res.prof_name !== 'Usuário Desconhecido' ? res.prof_name : (res.prof_email?.split('@')[0] || 'Professor')}
                      </span>
                      <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 lowercase truncate">
                        {res.prof_email}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-0.5 text-[11px] font-black uppercase text-zinc-800 dark:text-zinc-200 border-t-2 border-black dark:border-zinc-700 pt-2">
                    <span>{res.classroom || 'ESPAÇO'}</span>
                    {!isManutencao && <span>{res.quantity_requested} Chromebooks</span>}
                  </div>

                  {res.justification && (
                    <div className="text-[10px] font-bold italic text-zinc-700 dark:text-zinc-300 border-t-2 border-dashed border-black/20 dark:border-zinc-700 pt-1.5 mt-1 normal-case break-words max-w-[180px]">
                      "{res.justification}"
                    </div>
                  )}

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

      {hidden.length > 0 && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="text-[9px] font-black uppercase text-muted-foreground px-1 cursor-help">
                +{hidden.length} {hidden.length === 1 ? 'reserva' : 'reservas'}
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" className="p-2 border-2 border-foreground rounded-none shadow-[3px_3px_0_0_hsl(var(--foreground))] bg-card z-[100]">
              <div className="flex flex-col gap-1 text-[10px] font-black uppercase text-foreground">
                {hidden.map(r => (
                  <span key={r.id}>{r.classroom || 'Espaço'}{r.quantity_requested > 0 ? ` · ${r.quantity_requested}` : ''}</span>
                ))}
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      {isPartial && restantes > 0 && !isPast && (
        <ReservationDialog
          date={date}
          timeSlot={timeSlot}
          totalAvailableChromebooks={totalAvailableChromebooks}
          currentReservations={allReservationsForSlot}
          onReservationSuccess={onReservationSuccess}
          maxQuantity={restantes}
          professores={professores}
        >
          <div className="mt-1 min-h-[28px] flex items-center justify-center gap-1 border-2 border-dashed border-foreground bg-card text-foreground cursor-pointer transition-all hover:bg-warning hover:border-solid hover:shadow-[2px_2px_0_0_hsl(var(--foreground))] motion-safe:hover:-translate-y-px">
            <Plus className="h-3 w-3" strokeWidth={3} />
            <span className="text-[9px] font-black uppercase tracking-wide">Adicionar</span>
          </div>
        </ReservationDialog>
      )}
    </div>
  );

  return (
    <>
      {content}

      {isDetailsOpen && typeof isDetailsOpen === 'string' && (
        <ReservationDetailsDialog
          open={!!isDetailsOpen}
          onOpenChange={(open) => {
            if (!open) setIsDetailsOpen(false);
          }}
          reservation={allReservationsForSlot.find(r => r.id === isDetailsOpen)!}
          date={date}
          isOwner={allReservationsForSlot.find(r => r.id === isDetailsOpen)?.created_by === currentUser?.id || allReservationsForSlot.find(r => r.id === isDetailsOpen)?.professor_id === currentUser?.id}
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
