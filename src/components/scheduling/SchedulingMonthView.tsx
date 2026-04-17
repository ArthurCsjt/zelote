import React, { useState, useMemo } from 'react';
import { format, isPast } from 'date-fns';
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
  const { deleteReservation } = useDatabase();
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const isSuperAdmin = role === 'super_admin';

  // Lista de e-mails responsáveis pela sala google
  const responsibleEmails = [
    'eduardo.cardoso@colegiosaojudas.com.br',
    'davi.rossin@colegiosaojudas.com.br',
    'arthur.alencar@colegiosaojudas.com.br'
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
      <div className="relative border-4 border-black dark:border-white bg-white dark:bg-zinc-950 shadow-[12px_12px_0px_0px_rgba(0,0,0,0.05)] overflow-hidden h-full flex flex-col min-h-[500px]">
        {/* Background Texture */}
        <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.07] pointer-events-none neo-brutal-dots" />

        <div className="relative z-10 p-6 flex flex-col h-full space-y-6">
          {/* Header - Technical Display Style */}
          <div className="border-b-4 border-black dark:border-white pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <div className="flex items-center gap-3">
                <div className="bg-primary p-2 border-2 border-black shadow-[3px_3px_0px_0px_#000]">
                  <CalendarDays className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-4xl font-black uppercase tracking-tighter text-foreground drop-shadow-[2px_2px_0px_rgba(0,0,0,0.1)]">
                  {format(selectedDate, 'dd/MM/yyyy')}
                </h3>
              </div>
              <p className="text-xs font-black text-muted-foreground uppercase tracking-widest mt-2 flex items-center gap-2">
                <div className="w-2 h-2 bg-primary animate-pulse rounded-full" />
                {isDayPast ? 'Leitura de Dados Históricos' : 'Monitoramento de Recursos em Tempo Real'}
              </p>
            </div>
            
            {!isDayPast && (
              <Button 
                onClick={() => navigate('/agendamento')}
                className="bg-black text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200 rounded-none border-2 border-black dark:border-white font-black uppercase italic tracking-wider shadow-[4px_4px_0px_0px_rgba(59,130,246,0.5)] transform hover:-translate-x-1 hover:-translate-y-1 transition-all"
              >
                Nova Reserva
              </Button>
            )}
          </div>

          {/* Stats Grid - Hardware Dashboard Widgets */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Total Widget */}
            <div className="relative group overflow-hidden border-4 border-black dark:border-white p-4 bg-zinc-50 dark:bg-zinc-900 shadow-[6px_6px_0px_0px_rgba(0,0,0,0.1)] transition-all hover:-translate-y-1">
              <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                <Monitor className="h-12 w-12" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full" /> Total de Chromebooks
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-black text-foreground tracking-tighter">{totalAvailableChromebooks}</span>
                <span className="text-[8px] font-bold text-muted-foreground uppercase">unidades</span>
              </div>
              <div className="mt-2 h-1 bg-zinc-200 dark:bg-zinc-800 border border-black/10">
                <div className="h-full bg-black dark:bg-white w-full" />
              </div>
            </div>

            {/* Reserved Widget */}
            <div className="relative group overflow-hidden border-4 border-info/50 bg-info/5 dark:bg-info/10 p-4 shadow-[6px_6px_0px_0px_hsl(var(--info)/0.2)] transition-all hover:-translate-y-1">
              <div className="absolute top-0 right-0 p-2 opacity-15 group-hover:opacity-25 transition-opacity">
                <Clock className="h-12 w-12 text-info" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest text-info mb-1 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-info rounded-full animate-pulse" /> Reservado
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-black text-info tracking-tighter">{totalReserved}</span>
                <span className="text-[8px] font-bold text-info/70 uppercase">reservas</span>
              </div>
              <div className="mt-2 h-1 bg-info/10 border border-info/20">
                <div 
                  className="h-full bg-info transition-all duration-1000" 
                  style={{ width: `${(totalReserved / totalAvailableChromebooks) * 100}%` }} 
                />
              </div>
            </div>

            {/* Available Widget */}
            <div className="relative group overflow-hidden border-4 border-success/50 bg-success/5 dark:bg-success/10 p-4 shadow-[6px_6px_0px_0px_hsl(var(--success)/0.2)] transition-all hover:-translate-y-1">
              <div className="absolute top-0 right-0 p-2 opacity-15 group-hover:opacity-25 transition-opacity">
                <CheckCircle className="h-12 w-12 text-success" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest text-success mb-1 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-success rounded-full" /> Disponíveis
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-black text-success tracking-tighter">{available}</span>
                <span className="text-[8px] font-bold text-success/70 uppercase">disponíveis</span>
              </div>
              <div className="mt-2 h-1 bg-success/10 border border-success/20">
                <div 
                  className="h-full bg-success transition-all duration-1000" 
                  style={{ width: `${(available / totalAvailableChromebooks) * 100}%` }} 
                />
              </div>
            </div>
          </div>

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

                  return (
                    <div
                      key={res.id}
                      className={cn(
                        "group relative border-2 transition-all hover:bg-zinc-50 dark:hover:bg-white/[0.02] bg-white dark:bg-black/20",
                        isMinecraft ? "border-[#3c8527]/50" : "border-black/5 dark:border-white/5",
                        "cursor-pointer overflow-hidden shadow-sm"
                      )}
                      onClick={() => {
                        setSelectedReservation(res);
                        setIsDetailsOpen(true);
                      }}
                    >
                      {/* Status accent line */}
                      <div className={cn(
                        "absolute left-0 top-0 bottom-0 w-1",
                        isMinecraft ? "bg-[#3c8527]" : isAtendida ? "bg-green-500" : "bg-primary"
                      )} />

                      <div className="p-3 pl-5 flex items-center justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-black text-sm truncate uppercase tracking-tight">{res.prof_name}</span>
                            {isMinecraft && (
                              <span className="text-[8px] font-black bg-[#3c8527] text-white px-1 py-0.5 rounded-none">
                                MINECRAFT
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-[10px] text-muted-foreground font-bold uppercase tracking-tight">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" /> {res.time_slot}
                            </span>
                            {res.classroom && (
                              <span className="flex items-center gap-1">
                                🏫 {res.classroom}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-1.5">
                          <div className="flex items-center gap-2">
                            {isAtendida && (
                              <div className="bg-green-500 text-white p-0.5 border border-black/10">
                                <CheckCircle className="h-3 w-3" />
                              </div>
                            )}
                            <span className="text-xl font-black italic tracking-tighter leading-none">
                              {res.quantity_requested}<span className="text-[10px] not-italic ml-0.5 opacity-40 uppercase">cb</span>
                            </span>
                          </div>
                          
                          {!isAtendida && isResponsible && (
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 px-2 text-[8px] font-black uppercase text-primary border border-primary/20 hover:bg-primary hover:text-white rounded-none"
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
                                Iniciar Empréstimo
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Quick description preview */}
                      {res.justification && (
                        <div className="px-5 pb-2">
                          <p className="text-[10px] text-muted-foreground truncate italic opacity-80 overflow-hidden">
                            "{res.justification}"
                          </p>
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
    <div className="flex flex-col lg:flex-row gap-8 items-start">
      {/* Calendar - Technical Blueprint Style */}
      <div className="w-full lg:w-[450px] shrink-0 border-4 border-black dark:border-white bg-white dark:bg-zinc-950 shadow-[12px_12px_0px_0px_rgba(0,0,0,0.05)] overflow-hidden">
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
              head_row: "flex",
              head_cell: "text-muted-foreground w-full font-black text-[11px] uppercase pb-6 tracking-widest",
              row: "flex w-full mt-2",
              cell: "h-16 w-full text-center text-sm p-0 relative focus-within:relative focus-within:z-20",
              day: cn(
                "h-16 w-full p-0 font-bold border-2 border-transparent hover:border-black dark:hover:border-white transition-all rounded-none",
                "flex flex-col items-center justify-start pt-3 relative overflow-hidden group"
              ),
              day_selected: "bg-primary text-white border-black dark:border-white font-black shadow-[inset_6px_6px_0px_0px_rgba(0,0,0,0.2)] scale-100 z-10",
              day_today: "bg-primary/10 dark:bg-primary/20 text-foreground border-2 border-black dark:border-white ring-2 ring-primary ring-offset-2",
              day_outside: "text-muted-foreground opacity-30",
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
                  <div className="relative w-full h-full flex flex-col items-center justify-between pb-2">
                    <span className={cn(
                      "text-lg transition-transform",
                      activeModifiers.selected ? "text-white scale-110" : "text-foreground font-black group-hover:scale-110",
                      activeModifiers.today ? "text-primary dark:text-primary-foreground underline underline-offset-4" : ""
                    )}>
                      {date.getDate()}
                    </span>
                    
                    {/* Occupancy Indicators - Tech Bars */}
                    {tRes > 0 && (
                      <div className="flex gap-0.5 mt-auto px-1.5 w-full justify-center">
                        <div className={cn(
                          "h-1.5 flex-1 rounded-none border-[0.5px] border-black/10 transition-all",
                          rate > 0 ? "bg-green-500" : "bg-zinc-500/10"
                        )} />
                        {totalAvailableChromebooks > 30 && (
                          <>
                            <div className={cn(
                              "h-1.5 flex-1 rounded-none border-[0.5px] border-black/10 transition-all",
                              rate > 50 ? "bg-yellow-500" : "bg-zinc-500/10"
                            )} />
                            <div className={cn(
                              "h-1.5 flex-1 rounded-none border-[0.5px] border-black/10 transition-all",
                              rate >= 90 ? "bg-red-500" : "bg-zinc-500/10"
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
      <div className="flex-1 min-w-0 h-full">
        {renderDayDetails()}
      </div>
    </div>
  );
};
