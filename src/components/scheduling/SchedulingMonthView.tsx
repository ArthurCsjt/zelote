import React, { useState, useMemo } from 'react';
import { format, isPast, isSameDay, parseISO, differenceInMinutes, addMinutes } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { Monitor, Clock, User, CalendarDays, ArrowRight, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useProfileRole } from '@/hooks/use-profile-role';
import { useDatabase } from '@/hooks/useDatabase';
import { ReservationDetailsDialog } from './ReservationDetailsDialog';
import type { Reservation } from '@/hooks/useDatabase';

interface SchedulingMonthViewProps {
  currentDate: Date;
  reservations: Reservation[];
  totalAvailableChromebooks: number;
  isLoading: boolean;
  onReservationSuccess?: () => void;
}

const ReservationTimer: React.FC<{ date: string; timeSlot: string }> = ({ date, timeSlot }) => {
  const [now, setNow] = React.useState(new Date());

  React.useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 30000); // Update every 30s for better accuracy
    return () => clearInterval(interval);
  }, []);

  const { startTime, endTime, isToday } = React.useMemo(() => {
    // Parse timeSlot like "08h00"
    const [hours, minutes] = timeSlot.toLowerCase().split('h').map(Number);

    // date is "YYYY-MM-DD"
    const start = new Date(date + 'T' +
      String(hours).padStart(2, '0') + ':' +
      String(minutes).padStart(2, '0') + ':00');

    const end = addMinutes(start, 50); // Standard 50min duration

    return {
      startTime: start,
      endTime: end,
      isToday: isSameDay(new Date(), start)
    };
  }, [date, timeSlot]);

  if (!isToday) return null;

  const diffStart = differenceInMinutes(startTime, now);
  const diffEnd = differenceInMinutes(endTime, now);

  if (diffStart > 0 && diffStart <= 60) {
    return (
      <span className="flex items-center gap-1.5 px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-[10px] sm:text-[11px] font-black text-blue-700 dark:text-blue-300 uppercase tracking-tight shadow-[2px_2px_0px_0px_rgba(59,130,246,0.1)]">
        <Clock className="h-3 w-3 animate-pulse" />
        Inicia em {diffStart}m
      </span>
    );
  }

  if (diffStart <= 0 && diffEnd > 0) {
    const isEndingSoon = diffEnd <= 10;
    return (
      <span className={cn(
        "flex items-center gap-1.5 px-2 py-0.5 border text-[10px] sm:text-[11px] font-black uppercase tracking-tight transition-all",
        isEndingSoon
          ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 animate-pulse shadow-[2px_2px_0px_0px_rgba(239,68,68,0.1)]"
          : "bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-300 shadow-[2px_2px_0px_0px_rgba(249,115,22,0.1)]"
      )}>
        <div className={cn(
          "w-1.5 h-1.5 rounded-full",
          isEndingSoon ? "bg-red-600 animate-ping" : "bg-orange-500 animate-pulse"
        )} />
        {isEndingSoon ? `Falta ${diffEnd}m` : `Em curso: ${diffEnd}m rest.`}
      </span>
    );
  }

  return null;
};

export const SchedulingMonthView: React.FC<SchedulingMonthViewProps> = ({
  currentDate,
  reservations,
  totalAvailableChromebooks,
  isLoading,
  onReservationSuccess,
}) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const { role, isAdmin } = useProfileRole();
  const isManutencao = role === 'manutencao';
  const { deleteReservation } = useDatabase();
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const isSuperAdmin = role === 'super_admin';

  // Lista de e-mails responsáveis pela sala google
  const responsibleEmails = [
    'eduardo.cardoso@colegiosaojudas.com.br',
    'davi.rossin@colegiosaojudas.com.br',
    'arthur.alencar@colegiosaojudas.com.br',
    'gabriela.mazuchi@colegiosaojudas.com.br'
  ];

  const isResponsible = useMemo(() => {
    return isSuperAdmin || (currentUser?.email && responsibleEmails.includes(currentUser.email));
  }, [isSuperAdmin, currentUser]);

  const reservationsByDay = useMemo(() => {
    const map = new Map<string, Reservation[]>();
    reservations.forEach(res => {
      const key = res.date;
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key)?.push(res);
    });
    return map;
  }, [reservations]);

  const renderDayDetails = () => {
    if (!selectedDate) return null;

    const dateKey = format(selectedDate, 'yyyy-MM-dd');
    const dayReservations = reservationsByDay.get(dateKey) || [];
    const totalReserved = dayReservations.reduce((sum, res) => sum + res.quantity_requested, 0);
    const available = totalAvailableChromebooks - totalReserved;
    const isDayPast = isPast(selectedDate);

    return (
      <div className="relative w-full border-4 border-black dark:border-white bg-white dark:bg-zinc-950 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.05)] sm:shadow-[12px_12px_0px_0px_rgba(0,0,0,0.05)] overflow-hidden h-full flex flex-col min-h-0 sm:min-h-[500px] rounded-2xl">
        {/* Background Texture */}
        <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.07] pointer-events-none neo-brutal-dots" />

        <div className="relative z-10 p-3 sm:p-5 flex flex-col h-full space-y-3 sm:space-y-4">
          {/* Header - Technical Display Style */}
          <div className="border-b-2 border-black dark:border-zinc-800 pb-2 sm:pb-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-3">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="bg-primary p-1 border-2 border-black shadow-[1.5px_1.5px_0_0_#000] dark:shadow-[1.5px_1.5px_0_0_rgba(255,255,255,0.05)]">
                  <CalendarDays className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </div>
                <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tighter text-foreground drop-shadow-sm">
                  {format(selectedDate, 'dd/MM/yyyy')}
                </h3>
              </div>
              <p className="text-[9px] sm:text-xs font-black text-muted-foreground uppercase tracking-wider mt-1 flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 bg-primary animate-pulse rounded-full" />
                {isDayPast ? 'Leitura de Dados Históricos' : 'Monitoramento em Tempo Real'}
              </p>
            </div>

            {!isDayPast && (
              <Button
                onClick={() => navigate('/agendamento')}
                className="bg-black text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200 rounded-none border-2 border-black dark:border-white font-black uppercase italic text-xs tracking-wider shadow-[3px_3px_0_0_rgba(59,130,246,0.5)] transform hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all py-1 h-8"
              >
                Nova Reserva
              </Button>
            )}
          </div>

          {/* Stats Grid - Hardware Dashboard Widgets - Restricted to Admin/Responsible */}
          {(isAdmin || isResponsible) && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Total Widget */}
              <div className="relative overflow-hidden border-2 border-black dark:border-zinc-700 py-1.5 px-3 bg-zinc-50/50 dark:bg-zinc-900/50 shadow-[2px_2px_0_0_#000] dark:shadow-[2px_2px_0_0_rgba(255,255,255,0.05)] transition-all flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-[9px] font-black uppercase tracking-wider text-muted-foreground">
                    Total
                  </p>
                  <p className="text-[7px] font-bold text-muted-foreground uppercase tracking-tight">Chromebooks</p>
                </div>
                <div className="flex items-baseline gap-1 shrink-0">
                  <span className="text-2xl font-[1000] text-foreground tracking-tighter leading-none">{totalAvailableChromebooks}</span>
                  <span className="text-[8px] font-bold text-muted-foreground uppercase">unid</span>
                </div>
              </div>

              {/* Reserved Widget */}
              <div className="relative overflow-hidden border-2 border-info bg-info/5 dark:bg-info/10 py-1.5 px-3 shadow-[2px_2px_0_0_hsl(var(--info)/0.2)] transition-all flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-[9px] font-black uppercase tracking-wider text-info">
                    Reservado
                  </p>
                  <p className="text-[7px] font-bold text-info/70 uppercase tracking-tight">Reservas Ativas</p>
                </div>
                <div className="flex items-baseline gap-1 shrink-0">
                  <span className="text-2xl font-[1000] text-info tracking-tighter leading-none">{totalReserved}</span>
                  <span className="text-[8px] font-bold text-info/70 uppercase">unid</span>
                </div>
              </div>

              {/* Available Widget */}
              <div className="relative overflow-hidden border-2 border-success bg-success/5 dark:bg-success/10 py-1.5 px-3 shadow-[2px_2px_0_0_hsl(var(--success)/0.2)] transition-all flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-[9px] font-black uppercase tracking-wider text-success">
                    Disponíveis
                  </p>
                  <p className="text-[7px] font-bold text-success/70 uppercase tracking-tight">Sobra/Déficit</p>
                </div>
                <div className="flex items-baseline gap-1 shrink-0">
                  <span className={cn(
                    "text-2xl font-[1000] tracking-tighter leading-none",
                    available < 0 ? "text-error" : "text-success"
                  )}>{available}</span>
                  <span className="text-[8px] font-bold text-success/70 uppercase">unid</span>
                </div>
              </div>
            </div>
          )}

          {/* Reservations List */}
          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar border-t-4 border-black/10 dark:border-white/10 pt-4">
            {dayReservations.length > 0 ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between mb-4 sticky top-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md z-20 py-1 border-b-2 border-black/5">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground opacity-60">
                    Registros de Sistema ({dayReservations.length})
                  </p>
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    <div className="w-1.5 h-1.5 rounded-full bg-zinc-300 dark:bg-zinc-700" />
                  </div>
                </div>

                {dayReservations.map((res) => {
                  const isMinecraft = res.is_minecraft;
                  const isAtendida = res.associated_loans && res.associated_loans.length >= res.quantity_requested;
                  const isManutencaoRes = res.prof_role === 'manutencao' || res.prof_email === 'paulo.geremias@colegiosaojudas.com.br' || res.prof_email === 'ivo@colegiosaojudas.com.br' || res.prof_email === 'manutencao.teste@colegiosaojudas.com.br';
                  const displayName = res.prof_name.includes('@') ? res.prof_name.split('@')[0] : res.prof_name;

                  return (
                    <div
                      key={res.id}
                      className={cn(
                        "group relative border-[3px] transition-all cursor-pointer overflow-hidden rounded-xl",
                        isManutencaoRes
                          ? "border-zinc-500 dark:border-zinc-600 bg-zinc-50/50 dark:bg-zinc-900/50 shadow-[3px_3px_0_0_#52525b] hover:shadow-[4px_4px_0_0_#52525b]"
                          : isMinecraft
                            ? "border-[#3c8527] bg-[#3c8527]/5 dark:bg-[#3c8527]/10 shadow-[3px_3px_0_0_#3c8527] hover:shadow-[4px_4px_0_0_#3c8527]"
                            : "border-black dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-[3px_3px_0_0_#000] dark:shadow-[3px_3px_0_0_rgba(255,255,255,0.05)] hover:shadow-[4px_4px_0_0_#000] dark:hover:shadow-[4px_4px_0_0_rgba(255,255,255,0.08)]",
                        "hover:-translate-x-0.5 hover:-translate-y-0.5"
                      )}
                      onClick={() => {
                        setSelectedReservation(res);
                        setIsDetailsOpen(true);
                      }}
                    >
                      <div className="p-3.5 pl-4 sm:pl-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col min-w-0">
                            <span className="font-[1000] text-sm sm:text-base truncate uppercase tracking-tight text-black dark:text-white">{displayName}</span>
                            <span className="text-[10px] sm:text-[11px] text-zinc-500 dark:text-zinc-400 truncate lowercase font-bold">
                              {res.prof_email}
                            </span>
                            {isMinecraft && (
                              <div className="mt-1">
                                <span className="text-[8px] font-black bg-[#3c8527] text-white px-1.5 py-0.5 rounded-none">
                                  MINECRAFT
                                </span>
                              </div>
                            )}
                          </div>
                          
                          {/* Badges container */}
                          <div className="flex flex-wrap items-center gap-2 mt-2.5">
                            <span className="flex items-center gap-1 px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 border border-black/25 dark:border-white/10 text-[9px] sm:text-[10px] font-black uppercase text-zinc-700 dark:text-zinc-300">
                              <Clock className="h-3 w-3" /> {res.time_slot}
                            </span>
                            {res.classroom && (
                              <span className="px-2.5 py-0.5 bg-primary text-white dark:bg-blue-600 border border-black dark:border-zinc-700 text-[9px] sm:text-[10px] font-[1000] uppercase tracking-wider shadow-[1.5px_1.5px_0_0_#000] dark:shadow-[1.5px_1.5px_0_0_rgba(255,255,255,0.15)] rounded-md">
                                {res.classroom}
                              </span>
                            )}
                            <ReservationTimer date={res.date} timeSlot={res.time_slot} />
                          </div>
                        </div>

                        <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3 border-t sm:border-t-0 border-zinc-100 dark:border-zinc-800/80 pt-2 sm:pt-0 shrink-0">
                          <div className="flex items-center gap-2">
                            {isAtendida && (
                              <div className="bg-emerald-500 text-white p-0.5 border border-black/10 flex items-center justify-center">
                                <CheckCircle className="h-3 w-3" />
                              </div>
                            )}
                            {!isManutencaoRes ? (
                              <span className="text-2xl sm:text-3xl font-[1000] italic tracking-tighter leading-none whitespace-nowrap text-black dark:text-white drop-shadow-sm">
                                {res.quantity_requested}<span className="text-[10px] sm:text-[11px] not-italic ml-0.5 opacity-80 uppercase font-black">CBs</span>
                              </span>
                            ) : (
                              <span className="text-[10px] font-[1000] uppercase text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 border-2 border-black dark:border-zinc-700 px-2 py-1 shadow-[2px_2px_0px_0px_#000]">
                                MANUTENÇÃO
                              </span>
                            )}
                          </div>

                          {!isAtendida && isResponsible && (
                            <div className="flex items-center">
                              <Button
                                size="sm"
                                className="h-8 px-4 text-[10px] font-[1000] uppercase bg-primary text-white border-[2.5px] border-black shadow-[3px_3px_0_0_#000] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-150 rounded-none shrink-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate('/', {
                                    state: {
                                      fromScheduling: true,
                                      reservationData: { ...res, date: dateKey, time_slot: res.time_slot }
                                    }
                                  });
                                }}
                              >
                                <ArrowRight className="h-3.5 w-3.5 mr-1.5" />
                                Iniciar
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Speech callout justification preview */}
                      {res.justification && (
                        <div className="px-5 pb-3.5 pt-0.5">
                          <div className="pl-3 border-l-[3px] border-primary/30 dark:border-primary/50 py-0.5">
                            <p className="text-[11px] sm:text-xs text-zinc-600 dark:text-zinc-300 italic font-medium leading-relaxed">
                              "{res.justification}"
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Withdrawn Chromebooks Section - Premium Neo Brutal Style */}
                      {!isManutencao && res.associated_loans && res.associated_loans.length > 0 && (
                        <div className="mx-0 sm:mx-5 mb-3 sm:mb-4 p-3 sm:p-4 bg-primary/5 dark:bg-primary/10 border-2 border-black/10 dark:border-white/10 relative overflow-hidden group/retirados">
                          {/* Decorative pattern */}
                          <div className="absolute inset-0 opacity-[0.03] pointer-events-none neo-brutal-dots bg-primary/20" />

                          <div className="relative z-10 flex flex-col gap-2 sm:gap-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="p-1 sm:p-1.5 bg-primary text-white border-2 border-black flex items-center justify-center">
                                  <Monitor className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                                </div>
                                <span className="text-[9px] sm:text-[11px] font-black uppercase text-foreground tracking-tight sm:tracking-[0.15em] flex items-center gap-2">
                                  RETIRADOS
                                  <span className="text-primary text-sm sm:text-base font-black">
                                    {res.associated_loans.length}
                                  </span>
                                </span>
                              </div>
                              <div className="h-[1px] sm:h-[2px] flex-1 mx-2 sm:mx-4 bg-black/5 dark:bg-white/5" />
                            </div>

                            <div className="flex flex-wrap gap-1.5 sm:gap-2.5">
                              {res.associated_loans.map((loan, idx) => (
                                <div
                                  key={idx}
                                  className="px-2 sm:px-3 py-1 sm:py-1.5 bg-white dark:bg-zinc-900 text-primary dark:text-blue-400 text-[8px] sm:text-[10px] font-black uppercase border-2 border-black dark:border-white/20"
                                >
                                  {loan.chromebook_id}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center py-16 bg-zinc-50/50 dark:bg-white/[0.02] border-2 border-dashed border-black/5 dark:border-white/5">
                <div className="relative">
                  <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full animate-pulse" />
                  <Monitor className="h-20 w-20 text-muted-foreground/20 relative z-10" />
                </div>
                <p className="text-xl font-black text-muted-foreground/30 uppercase mt-6 tracking-[0.3em]">
                  Sistema Vazio
                </p>
                <p className="text-[10px] text-muted-foreground/40 font-bold uppercase tracking-widest mt-2">
                  Nenhum registro encontrado para este ciclo
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-8 border-2 border-muted-foreground/20 rounded-none font-black text-[10px] uppercase tracking-widest hover:border-primary hover:text-primary transition-all px-8 h-10"
                  onClick={() => navigate('/agendamento')}
                >
                  Ver Grade de Agendamentos
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Modals integration */}
        {dayReservations.length > 0 && selectedReservation && (
          <ReservationDetailsDialog
            open={isDetailsOpen}
            onOpenChange={setIsDetailsOpen}
            reservation={selectedReservation}
            date={selectedDate}
            isAdmin={!!isAdmin}
            isResponsible={!!isResponsible}
            isOwner={selectedReservation.created_by === currentUser?.id}
            onCancel={() => {
              deleteReservation(selectedReservation.id).then((success: boolean) => {
                if (success) {
                  onReservationSuccess?.();
                  setIsDetailsOpen(false);
                  setSelectedReservation(null);
                }
              });
            }}
          />
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col lg:flex-row gap-4 sm:gap-8 items-stretch lg:items-start">
      {/* Calendar - Technical Blueprint Style */}
      <div className="w-full lg:w-[450px] shrink-0 border-4 border-black dark:border-white bg-white dark:bg-zinc-950 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.05)] sm:shadow-[12px_12px_0px_0px_rgba(0,0,0,0.05)] overflow-hidden rounded-2xl">
        {/* Header Display */}
        <div className="bg-black text-white p-5 flex justify-between items-center border-b-4 border-black">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-5 bg-primary" />
            <h3 className="text-xl font-black uppercase tracking-tighter">
              Visão Mensal
            </h3>
          </div>
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
            <div className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
            <div className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
          </div>
        </div>

        <div className="p-6 relative">
          {/* Subtle Grid dots */}
          <div className="absolute inset-0 opacity-[0.05] pointer-events-none neo-brutal-dots font-black text-black" />

          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            month={currentDate}
            className="w-full p-0 flex justify-center"
            locale={ptBR}
            classNames={{
              months: "flex flex-col sm:flex-row w-full",
              month: "space-y-0 w-full",
              caption: "hidden",
              caption_label: "hidden",
              nav: "hidden",
              nav_button: "hidden",
              nav_button_previous: "hidden",
              nav_button_next: "hidden",
              table: "w-full border-collapse",
              head_row: "flex w-full border-b border-zinc-150 dark:border-zinc-800/80 pb-2.5",
              head_cell: "text-zinc-400 dark:text-zinc-500 w-full font-[900] text-[10px] sm:text-[11px] uppercase tracking-[0.2em] text-center",
              row: "flex w-full mt-1.5",
              cell: "h-16 w-full text-center text-sm p-0 relative focus-within:relative focus-within:z-20 border border-zinc-100/70 dark:border-zinc-900/40 first:border-l-0 last:border-r-0",
              day: cn(
                "h-16 w-full p-0 font-bold transition-all rounded-none",
                "flex flex-col items-center justify-between pb-2 pt-2.5 relative overflow-hidden group bg-transparent hover:bg-zinc-50 dark:hover:bg-zinc-900/30"
              ),
              day_selected: "!bg-primary !text-white !border-2 !border-black dark:!border-white font-[1000] shadow-[3px_3px_0_0_#000] dark:shadow-[3px_3px_0_0_rgba(255,255,255,0.15)] scale-[0.96] z-20 rounded-xl",
              day_today: "bg-primary/5 dark:bg-primary/10 text-primary dark:text-blue-400 border-[3px] border-primary dark:border-blue-500 font-[1000] rounded-xl z-10 aria-selected:!bg-primary aria-selected:!text-white aria-selected:!border-2 aria-selected:!border-black dark:aria-selected:!border-white",
              day_outside: "text-muted-foreground opacity-30 pointer-events-none bg-zinc-50/40 dark:bg-zinc-950/20",
              day_disabled: "text-muted-foreground opacity-30",
              day_hidden: "invisible",
            }}
            components={{
              DayContent: ({ date, activeModifiers }) => {
                const dKey = format(date, 'yyyy-MM-dd');
                const dRes = reservationsByDay.get(dKey) || [];
                const tRes = dRes.reduce((sum, res) => sum + res.quantity_requested, 0);
                const rate = (tRes / totalAvailableChromebooks) * 100;

                return (
                  <div className="relative w-full h-full flex flex-col items-center justify-between pb-1">
                    <span className={cn(
                      "text-base transition-all font-[900]",
                      activeModifiers.selected
                        ? "text-white scale-110 drop-shadow-[0_1px_2px_rgba(0,0,0,0.2)]"
                        : activeModifiers.today
                          ? "text-primary dark:text-blue-400 font-[1000]"
                          : "text-zinc-800 dark:text-zinc-200 group-hover:text-black dark:group-hover:text-white group-hover:scale-110"
                    )}>
                      {date.getDate()}
                    </span>

                    {/* Occupancy Indicators - Tech Bars */}
                    {tRes > 0 && !isManutencao && (
                      <div className="flex gap-1 mt-auto px-1 w-full justify-center">
                        <div className={cn(
                          "h-1.5 w-3.5 transition-all border border-black/10 dark:border-white/5",
                          rate > 0 ? "bg-emerald-500 shadow-[1px_1px_0_0_rgba(0,0,0,0.15)]" : "bg-zinc-100 dark:bg-zinc-800"
                        )} />
                        {totalAvailableChromebooks > 30 && (
                          <>
                            <div className={cn(
                              "h-1.5 w-3.5 transition-all border border-black/10 dark:border-white/5",
                              rate > 50 ? "bg-amber-500 shadow-[1px_1px_0_0_rgba(0,0,0,0.15)]" : "bg-zinc-100 dark:bg-zinc-800"
                            )} />
                            <div className={cn(
                              "h-1.5 w-3.5 transition-all border border-black/10 dark:border-white/5",
                              rate >= 90 ? "bg-rose-500 shadow-[1px_1px_0_0_rgba(0,0,0,0.15)]" : "bg-zinc-100 dark:bg-zinc-800"
                            )} />
                          </>
                        )}
                      </div>
                    )}
                  </div>
                );
              }
            }}
          />
        </div>
      </div>

      {/* Day Details Dashboard */}
      <div className="flex-1 min-w-0 w-full h-full">
        {renderDayDetails()}
      </div>
    </div>
  );
};
