import React, { useState, useMemo } from 'react';
import { format, isPast } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { Monitor, Clock, User, CalendarDays, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useProfileRole } from '@/hooks/use-profile-role';
import type { Reservation } from '@/hooks/useDatabase';

interface SchedulingMonthViewProps {
  currentDate: Date;
  reservations: Reservation[];
  totalAvailableChromebooks: number;
  isLoading: boolean;
}

export const SchedulingMonthView: React.FC<SchedulingMonthViewProps> = ({
  currentDate,
  reservations,
  totalAvailableChromebooks,
  isLoading,
}) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const { role } = useProfileRole();

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

  const modifiers = useMemo(() => {
    const reservedDays: Date[] = [];
    const fullDays: Date[] = [];

    reservationsByDay.forEach((resList, dateKey) => {
      const totalReserved = resList.reduce((sum, res) => sum + res.quantity_requested, 0);
      const date = new Date(dateKey + 'T12:00:00');

      if (totalReserved > 0) {
        reservedDays.push(date);
      }
      if (totalReserved >= totalAvailableChromebooks) {
        fullDays.push(date);
      }
    });

    return {
      reserved: reservedDays,
      full: fullDays,
    };
  }, [reservationsByDay, totalAvailableChromebooks]);

  const renderDayDetails = () => {
    if (!selectedDate) return null;

    const dateKey = format(selectedDate, 'yyyy-MM-dd');
    const dayReservations = reservationsByDay.get(dateKey) || [];
    const totalReserved = dayReservations.reduce((sum, res) => sum + res.quantity_requested, 0);
    const available = totalAvailableChromebooks - totalReserved;

    const isDayPast = isPast(selectedDate);

    return (
      <div className="border-4 border-foreground/30 bg-card shadow-[6px_6px_0px_0px_hsl(var(--foreground)/0.2)] p-6 space-y-6">

        {/* Header */}
        <div className="border-b-4 border-foreground/20 pb-4">
          <h3 className="text-3xl font-black uppercase tracking-tight text-foreground">
            📅 {format(selectedDate, 'dd/MM/yyyy')}
          </h3>
          <p className="text-base font-bold text-muted-foreground mt-2">
            {isDayPast ? '📚 Histórico de reservas' : '📊 Detalhes e disponibilidade'}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-5 border-4 border-foreground/30 bg-muted/40 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.15)]">
            <p className="text-xs font-black uppercase tracking-wide text-muted-foreground mb-2">💻 Total</p>
            <p className="text-5xl font-black text-foreground">{totalAvailableChromebooks}</p>
          </div>
          <div className="text-center p-5 border-4 border-info/50 bg-info/20 shadow-[4px_4px_0px_0px_hsl(var(--info)/0.3)]">
            <p className="text-xs font-black uppercase tracking-wide text-info mb-2">📌 Reservados</p>
            <p className="text-5xl font-black text-info">{totalReserved}</p>
          </div>
          <div className="text-center p-5 border-4 border-success/50 bg-success/20 shadow-[4px_4px_0px_0px_hsl(var(--success)/0.3)]">
            <p className="text-xs font-black uppercase tracking-wide text-success mb-2">✅ Disponíveis</p>
            <p className="text-5xl font-black text-success">{available}</p>
          </div>
        </div>

        {/* Reservations List */}
        {dayReservations.length > 0 ? (
          <div className="space-y-4 pt-4 border-t-4 border-foreground/20">
            <p className="text-sm font-black uppercase tracking-wide text-foreground mb-3">
              📋 Reservas do Dia ({dayReservations.length}):
            </p>
            {dayReservations.map((res) => {
              const isMinecraft = res.is_minecraft;
              return (
                <div
                  key={res.id}
                  className={cn(
                    "p-5 border-4 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,0.15)]",
                    isMinecraft
                      ? "border-[#3c8527] bg-[#3c8527]/20 hover:bg-[#3c8527]/25"
                      : "border-primary/40 bg-primary/10 hover:bg-primary/15"
                  )}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center border-3",
                        isMinecraft
                          ? "bg-[#3c8527] border-[#2d6520] text-white"
                          : "bg-primary border-primary/50 text-primary-foreground"
                      )}>
                        <User className="h-5 w-5" />
                      </div>
                      <span className="font-black text-lg text-foreground">{res.prof_name}</span>
                    </div>
                    <Badge className={cn(
                      "font-black text-base px-4 py-2 border-0 rounded-none shadow-[3px_3px_0px_0px_rgba(0,0,0,0.3)]",
                      isMinecraft
                        ? "bg-[#3c8527] text-white"
                        : "bg-primary text-primary-foreground"
                    )}>
                      {res.quantity_requested} CB
                    </Badge>
                  </div>

                  {isMinecraft && (
                    <div className="mb-3 inline-block px-3 py-1.5 bg-[#3c8527] text-white text-xs font-black uppercase border-2 border-[#2d6520]">
                      🎮 MINECRAFT
                    </div>
                  )}

                  <p className="text-base font-bold text-foreground mt-3 mb-3 leading-relaxed">
                    {res.justification || res.subject}
                  </p>

                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-foreground/10 border-2 border-foreground/20">
                      <Clock className="h-5 w-5 text-foreground" />
                      <span className="font-black text-foreground">{res.time_slot}</span>
                    </div>
                    {res.classroom && (
                      <div className="px-3 py-1.5 bg-info/20 border-2 border-info/40 font-black text-foreground">
                        🏫 {res.classroom}
                      </div>
                    )}
                  </div>

                  {isResponsible && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full mt-4 h-8 text-[11px] font-black uppercase rounded-none border-2 border-primary bg-primary/5 hover:bg-primary hover:text-white transition-all flex items-center justify-center gap-2"
                      onClick={() => {
                        navigate('/', {
                          state: {
                            fromScheduling: true,
                            reservationData: {
                              ...res,
                              date: dateKey, // selectedDate formatado
                              time_slot: res.time_slot
                            }
                          }
                        });
                      }}
                    >
                      <ArrowRight className="h-4 w-4" />
                      Iniciar Empréstimo Desta Reserva
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-10 border-4 border-dashed border-foreground/20 bg-muted/10">
            <Monitor className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
            <p className="text-xl font-black text-muted-foreground uppercase">📭 Nenhuma reserva</p>
            <p className="text-base text-muted-foreground/70 mt-2">para este dia</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

      {/* Calendar - Neo Brutal */}
      <div className="border-3 border-foreground/20 bg-card shadow-[4px_4px_0px_0px_hsl(var(--foreground)/0.1)] p-4">
        <div className="border-b-3 border-foreground/10 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-black uppercase tracking-tight text-foreground">
              Visão Mensal
            </h3>
          </div>
          <p className="text-xs font-medium text-muted-foreground mt-0.5">
            Clique em um dia para ver os detalhes
          </p>
        </div>

        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={setSelectedDate}
          month={currentDate}
          className="w-full p-0 flex justify-center"
          locale={ptBR}
          disableNavigation
          classNames={{
            months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0 w-full",
            month: "space-y-4 w-full",
            caption: "hidden",
            caption_label: "hidden",
            nav: "hidden",
            nav_button: "hidden",
            nav_button_previous: "hidden",
            nav_button_next: "hidden",
            table: "w-full border-collapse",
            head_row: "flex",
            head_cell: "text-muted-foreground w-full font-black text-[10px] uppercase",
            row: "flex w-full mt-1",
            cell: "h-10 w-full text-center text-sm p-0 relative focus-within:relative focus-within:z-20",
            day: cn(
              "h-10 w-full p-0 font-bold border-2 border-transparent hover:border-foreground/20 transition-all"
            ),
            day_selected: "bg-primary text-primary-foreground border-primary font-black",
            day_today: "bg-accent text-accent-foreground border-foreground/30",
            day_outside: "text-muted-foreground opacity-50",
            day_disabled: "text-muted-foreground opacity-50",
            day_hidden: "invisible",
          }}
          modifiers={{
            reserved: modifiers.reserved,
            full: modifiers.full,
          }}
          modifiersClassNames={{
            reserved: "bg-info/10 border-info/30 text-info-foreground",
            full: "bg-error/10 border-error/30 text-error-foreground",
          }}
        />
      </div>

      {/* Day Details */}
      <div className="lg:col-span-1">
        {renderDayDetails()}
      </div>
    </div>
  );
};
