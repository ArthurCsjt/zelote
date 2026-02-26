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
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

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

  // MY RESERVATION - Neo Brutal Style
  if (myReservation) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className={cn(
                "h-16 p-2 border-3 transition-all flex flex-col justify-center gap-0.5 cursor-pointer",
                myReservation.is_minecraft
                  ? "border-[#3c8527] bg-[#3c8527]/10 shadow-[3px_3px_0px_0px_#3c8527/0.3]"
                  : "border-info bg-info/10 shadow-[3px_3px_0px_0px_hsl(var(--info)/0.3)]",
                "hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,0.1)]",
                pastSlotClasses
              )}
              onClick={() => setIsDetailsOpen(true)}
            >
              <div className="flex items-center gap-1">
                {myReservation.is_minecraft ? (
                  <>
                    <Monitor className="h-3 w-3 text-[#3c8527] shrink-0" />
                    <span className="text-[10px] font-black uppercase text-[#3c8527] truncate">
                      MINECRAFT
                    </span>
                  </>
                ) : myReservation.quantity_requested === 0 ? (
                  <>
                    <CheckCircle className="h-3 w-3 text-info shrink-0" />
                    <span className="text-[10px] font-black uppercase text-info truncate">
                      ESPAÇO RESERVADO
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
              {myReservation.quantity_requested > 0 ? (
                <>
                  <Monitor className="h-2.5 w-2.5 text-muted-foreground" />
                  <span className="text-[9px] font-bold text-muted-foreground">
                    {myReservation.quantity_requested} CB
                  </span>
                </>
              ) : (
                <span className="text-[9px] font-black uppercase text-info/70 ">
                  Apenas Sala
                </span>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent className="border-3 border-foreground/20 rounded-none shadow-[4px_4px_0px_0px_hsl(var(--foreground)/0.1)]">
            <p className="font-bold text-sm">
              {myReservation.is_minecraft && <span className="text-[#3c8527] mr-2">[MINECRAFT]</span>}
              {myReservation.justification}
            </p>
            <p className="text-xs text-muted-foreground">
              {myReservation.prof_name && myReservation.prof_name !== 'Usuário Desconhecido' ? myReservation.prof_name : (myReservation.prof_email || 'Usuário Desconhecido')} · {myReservation.quantity_requested > 0 ? `${myReservation.quantity_requested} Chromebooks` : 'Reserva de Espaço'}
              {myReservation.classroom && ` · Sala: ${myReservation.classroom}`}
            </p>
            <p className="text-[10px] font-black text-blue-600 mt-2 uppercase tracking-tighter italic">Clique para ver detalhes e opções</p>
          </TooltipContent>
        </Tooltip>

        <ReservationDetailsDialog
          open={isDetailsOpen}
          onOpenChange={setIsDetailsOpen}
          reservation={myReservation}
          date={date}
          isOwner={true}
          isAdmin={!!isAdmin}
          isResponsible={!!isResponsible}
          onCancel={() => {
            deleteReservation(myReservation!.id).then((success: boolean) => {
              if (success) {
                onReservationSuccess();
                setIsDetailsOpen(false);
              }
            });
          }}
        />
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
                {jaReservados > 0 ? `${jaReservados}/${totalAvailableChromebooks} 💻` : "Apenas Espaço"}
              </p>
              <p className="text-[9px] text-muted-foreground truncate">
                {allReservationsForSlot.length > 1
                  ? `${allReservationsForSlot.length} reservas`
                  : (allReservationsForSlot[0]?.prof_name && allReservationsForSlot[0]?.prof_name !== 'Usuário Desconhecido'
                    ? allReservationsForSlot[0]?.prof_name
                    : (allReservationsForSlot[0]?.prof_email || 'Usuário Desconhecido'))
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
                    {res.prof_name && res.prof_name !== 'Usuário Desconhecido' ? res.prof_name : (res.prof_email || 'Usuário Desconhecido')}
                    {res.classroom && <span className="ml-2 text-[9px] px-1.5 bg-info/10 text-info">SALA: {res.classroom}</span>}
                  </p>
                  <p className="text-muted-foreground mb-1">
                    {res.justification} · {res.quantity_requested > 0 ? `${res.quantity_requested} CB` : "Apenas Espaço"}
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
                  {(isSuperAdmin || res.created_by === currentUser?.id) && (
                    <Button
                      variant="destructive"
                      size="sm"
                      className="h-6 px-2 text-[9px] font-black uppercase rounded-none border-2 border-foreground mb-2"
                      onClick={() => deleteReservation(res.id).then((success: boolean) => success && onReservationSuccess())}
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      {res.created_by === currentUser?.id ? 'Cancelar' : 'Remover'}
                    </Button>
                  )}

                  {isResponsible && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-6 px-2 text-[9px] font-black uppercase rounded-none border-2 border-primary bg-primary/5 hover:bg-primary hover:text-white transition-all ml-2 mb-2"
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
                      <ArrowRight className="h-3 w-3 mr-1" />
                      Iniciar Empréstimo
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
                        {allReservationsForSlot.length > 0 ? "SALA EM USO" : "Disponível"}
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
                      {res.prof_name && res.prof_name !== 'Usuário Desconhecido' ? res.prof_name : (res.prof_email || 'Usuário Desconhecido')}
                      {res.classroom && <span className="ml-2 text-[9px] px-1.5 bg-info/10 text-info">SALA: {res.classroom}</span>}
                    </p>
                    <p className="text-muted-foreground mb-1">
                      {res.justification} · {res.quantity_requested > 0 ? `${res.quantity_requested} CB` : "Apenas Espaço"}
                    </p>
                    {(isSuperAdmin || res.created_by === currentUser?.id) && (
                      <Button
                        variant="destructive"
                        size="sm"
                        className="h-6 px-2 text-[9px] font-black uppercase rounded-none border-2 border-foreground mb-2"
                        onClick={() => deleteReservation(res.id).then((success: boolean) => success && onReservationSuccess())}
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        {res.created_by === currentUser?.id ? 'Cancelar' : 'Remover'}
                      </Button>
                    )}

                    {isResponsible && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-6 px-2 text-[9px] font-black uppercase rounded-none border-2 border-primary bg-primary/5 hover:bg-primary hover:text-white transition-all ml-2 mb-2"
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
