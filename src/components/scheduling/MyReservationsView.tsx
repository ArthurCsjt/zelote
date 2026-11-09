import React, { useState, useMemo } from 'react';
import { format, parseISO, isToday, isTomorrow, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useQuery } from '@tanstack/react-query';
import type { User as AuthUser } from '@supabase/supabase-js';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Laptop, 
  Trash2, 
  AlertTriangle, 
  CheckCircle2, 
  RotateCcw, 
  Plus, 
  Search, 
  Loader2, 
  ArrowRight,
  ShieldAlert
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { getUserReservations, deleteReservation, type Reservation } from '@/services/reservationService';
import { formatChromebookTag } from '@/utils/scheduling';
import { ReservationDetailsDialog } from './ReservationDetailsDialog';
import { useProfileRole } from '@/hooks/use-profile-role';
import { useSchedulingResponsible } from '@/hooks/useSchedulingResponsible';

interface MyReservationsViewProps {
  currentUser: AuthUser | null;
  onReservationSuccess: () => void;
  onGoToCalendar: () => void;
}

export const MyReservationsView: React.FC<MyReservationsViewProps> = ({
  currentUser,
  onReservationSuccess,
  onGoToCalendar,
}) => {
  const { isAdmin } = useProfileRole();
  const { isResponsible } = useSchedulingResponsible();

  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  const [searchQuery, setSearchQuery] = useState('');
  const [cancelingId, setCancelingId] = useState<string | null>(null);
  const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const { data: userReservations = [], isLoading, refetch } = useQuery({
    queryKey: ['userReservations', currentUser?.id],
    queryFn: () => getUserReservations(currentUser?.id || ''),
    enabled: !!currentUser?.id,
  });

  const now = new Date();

  const { upcoming, past } = useMemo(() => {
    const up: Reservation[] = [];
    const pa: Reservation[] = [];

    userReservations.forEach(res => {
      const [h, m] = (res.time_slot || '00h00').split('h');
      const dt = new Date(`${res.date}T${(h || '0').padStart(2, '0')}:${(m || '0').padStart(2, '0')}:00`);
      const end = new Date(dt.getTime() + 50 * 60 * 1000);

      if (end >= now) {
        up.push(res);
      } else {
        pa.push(res);
      }
    });

    up.sort((a, b) => `${a.date} ${a.time_slot}`.localeCompare(`${b.date} ${b.time_slot}`));
    pa.sort((a, b) => `${b.date} ${b.time_slot}`.localeCompare(`${a.date} ${a.time_slot}`));

    return { upcoming: up, past: pa };
  }, [userReservations, now]);

  const displayedList = useMemo(() => {
    const list = activeTab === 'upcoming' ? upcoming : past;
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(res => 
      (res.classroom || '').toLowerCase().includes(q) ||
      (res.justification || '').toLowerCase().includes(q) ||
      res.date.includes(q) ||
      res.time_slot.toLowerCase().includes(q)
    );
  }, [activeTab, upcoming, past, searchQuery]);

  const handleCancelReservation = async (reservation: Reservation) => {
    setCancelingId(reservation.id);
    try {
      const success = await deleteReservation(reservation.id);
      if (success) {
        toast({
          title: "Reserva cancelada com sucesso",
          description: `Horário ${reservation.time_slot} do dia ${format(parseISO(reservation.date), "dd/MM/yyyy")} foi liberado.`,
          variant: "success"
        });
        setConfirmCancelId(null);
        await refetch();
        onReservationSuccess();
      } else {
        toast({
          title: "Erro ao cancelar reserva",
          description: "Não foi possível cancelar no momento. Tente novamente.",
          variant: "destructive"
        });
      }
    } catch {
      toast({
        title: "Erro de conexão",
        description: "Falha ao comunicar com o servidor.",
        variant: "destructive"
      });
    } finally {
      setCancelingId(null);
    }
  };

  const getDayBadge = (dateStr: string) => {
    const dt = parseISO(dateStr);
    if (isToday(dt)) {
      return <span className="bg-red-500 text-white font-black text-[9px] uppercase px-2 py-0.5 border border-black shadow-[1px_1px_0_0_#000]">Hoje</span>;
    }
    if (isTomorrow(dt)) {
      return <span className="bg-amber-400 text-black font-black text-[9px] uppercase px-2 py-0.5 border border-black shadow-[1px_1px_0_0_#000]">Amanhã</span>;
    }
    const diff = differenceInDays(dt, now);
    if (diff > 1 && diff <= 7) {
      return <span className="bg-blue-100 dark:bg-blue-900/60 text-blue-900 dark:text-blue-200 font-bold text-[9px] uppercase px-2 py-0.5 border border-black/30">Em {diff} dias</span>;
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] border-4 border-black dark:border-white bg-card p-8 shadow-[8px_8px_0_0_#000]">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
        <span className="font-black text-sm uppercase tracking-wider text-muted-foreground">
          Carregando suas reservas...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Barra de Ações & Filtros */}
      <div className="border-4 border-black dark:border-white bg-card p-3 sm:p-4 shadow-[6px_6px_0_0_#000] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Toggle Próximas vs Passadas */}
        <div className="flex items-center gap-1.5 p-1 bg-muted border-2 border-black dark:border-white/20">
          <button
            onClick={() => { setActiveTab('upcoming'); setConfirmCancelId(null); }}
            className={cn(
              "px-3 py-1.5 text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2",
              activeTab === 'upcoming'
                ? "bg-primary text-primary-foreground shadow-[2px_2px_0_0_#000] border border-black"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <span>Próximas Reservas</span>
            <span className={cn(
              "px-1.5 py-0.2 rounded text-[10px] font-black",
              activeTab === 'upcoming' ? "bg-white text-primary" : "bg-black/10 dark:bg-white/10"
            )}>
              {upcoming.length}
            </span>
          </button>

          <button
            onClick={() => { setActiveTab('past'); setConfirmCancelId(null); }}
            className={cn(
              "px-3 py-1.5 text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2",
              activeTab === 'past'
                ? "bg-primary text-primary-foreground shadow-[2px_2px_0_0_#000] border border-black"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <span>Passadas</span>
            <span className={cn(
              "px-1.5 py-0.2 rounded text-[10px] font-black",
              activeTab === 'past' ? "bg-white text-primary" : "bg-black/10 dark:bg-white/10"
            )}>
              {past.length}
            </span>
          </button>
        </div>

        {/* Campo de Busca & Atalho para Novo Agendamento */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="h-4 w-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar por sala ou data..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-8 text-xs border-2 border-black dark:border-white shadow-[2px_2px_0_0_#000] rounded-none h-9"
            />
          </div>

          <Button
            onClick={onGoToCalendar}
            className="neo-brutal-button bg-success text-white hover:bg-success/90 h-9 text-xs font-black uppercase shrink-0"
          >
            <Plus className="h-4 w-4 mr-1" strokeWidth={3} />
            Nova Reserva
          </Button>
        </div>
      </div>

      {/* Lista de Reservas */}
      {displayedList.length === 0 ? (
        <div className="border-4 border-dashed border-black/30 dark:border-white/30 bg-card p-10 text-center shadow-[6px_6px_0_0_#000]">
          <Calendar className="h-10 w-10 mx-auto text-muted-foreground/60 mb-2" />
          <h3 className="font-black text-base uppercase text-foreground">
            {activeTab === 'upcoming' 
              ? (searchQuery ? "Nenhuma reserva futura corresponde à busca" : "Você não tem reservas futuras agendadas")
              : (searchQuery ? "Nenhuma reserva passada encontrada" : "Nenhum histórico anterior registrado")}
          </h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto font-medium">
            {activeTab === 'upcoming' 
              ? "Para marcar uma aula com Chromebooks ou reservar uma sala de informática, abra a grade semanal."
              : "As aulas realizadas anteriormente serão listadas aqui com o histórico de devoluções e retiradas."}
          </p>
          {activeTab === 'upcoming' && (
            <Button
              onClick={onGoToCalendar}
              className="neo-brutal-button mt-4 bg-primary text-primary-foreground text-xs font-black uppercase"
            >
              Ir para Grade de Horários
              <ArrowRight className="h-4 w-4 ml-1.5" />
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {displayedList.map(res => {
            const dt = parseISO(res.date);
            const formattedDate = format(dt, "EEEE, dd 'de' MMMM", { locale: ptBR });
            const shortDate = format(dt, "dd/MM/yyyy");
            const requested = res.quantity_requested || 0;
            const loansCount = res.associated_loans?.length || 0;
            const returnedCount = res.associated_loans?.filter(l => l.returned).length || 0;

            const [h, m] = (res.time_slot || '00h00').split('h');
            const slotStart = new Date(`${res.date}T${(h || '0').padStart(2, '0')}:${(m || '0').padStart(2, '0')}:00`);
            const slotEnd = new Date(slotStart.getTime() + 50 * 60 * 1000);
            const isExpired = now >= slotEnd;
            const isMissed = isExpired && requested > 0 && loansCount === 0;

            const isCancelingThis = cancelingId === res.id;
            const isConfirmingThis = confirmCancelId === res.id;

            return (
              <motion.div
                key={res.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={cn(
                  "border-4 border-black dark:border-white bg-card shadow-[5px_5px_0_0_#000] flex flex-col justify-between transition-all",
                  isMissed && "border-amber-600 dark:border-amber-500",
                  activeTab === 'upcoming' && "hover:-translate-y-1 hover:shadow-[7px_7px_0_0_#000]"
                )}
              >
                {/* Header do Card */}
                <div className={cn(
                  "p-3 border-b-2 border-black flex items-center justify-between",
                  isMissed 
                    ? "bg-amber-400 text-black" 
                    : res.is_minecraft 
                      ? "bg-[#2d5a27] text-white" 
                      : "bg-primary text-primary-foreground"
                )}>
                  <div className="flex items-center gap-2 min-w-0">
                    <Clock className="h-4 w-4 shrink-0 stroke-[2.5]" />
                    <span className="font-black text-sm tracking-tight uppercase">
                      {res.time_slot}
                    </span>
                    <span className="text-[10px] font-bold opacity-80 uppercase tracking-widest">
                      · {shortDate}
                    </span>
                  </div>

                  {activeTab === 'upcoming' ? (
                    getDayBadge(res.date)
                  ) : isMissed ? (
                    <span className="inline-flex items-center gap-1 bg-black text-amber-400 font-black text-[9px] uppercase px-2 py-0.5 border border-black shadow-[1px_1px_0_0_#000]">
                      <AlertTriangle className="h-3 w-3 stroke-[3]" />
                      Não Retirada
                    </span>
                  ) : loansCount >= requested ? (
                    <span className="inline-flex items-center gap-1 bg-emerald-600 text-white font-black text-[9px] uppercase px-2 py-0.5 border border-black shadow-[1px_1px_0_0_#000]">
                      <CheckCircle2 className="h-3 w-3 stroke-[3]" />
                      Atendida
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 bg-blue-600 text-white font-black text-[9px] uppercase px-2 py-0.5 border border-black shadow-[1px_1px_0_0_#000]">
                      Parcial
                    </span>
                  )}
                </div>

                {/* Conteúdo Central */}
                <div className="p-3.5 space-y-2.5 flex-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <MapPin className="h-4 w-4 text-primary shrink-0" />
                      <span className="font-black text-sm uppercase truncate">
                        {res.classroom || "Espaço / Sala"}
                      </span>
                    </div>

                    {res.is_minecraft && (
                      <span className="bg-[#3c8527] text-white border-2 border-black text-[8px] font-black px-1.5 py-0.5 shadow-[1px_1px_0_0_#000] uppercase tracking-widest shrink-0">
                        Minecraft
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
                    <Laptop className="h-4 w-4 text-foreground shrink-0" />
                    <span>
                      {requested > 0 ? (
                        <>Requisitados: <strong className="text-foreground">{requested} Chromebooks</strong></>
                      ) : (
                        <strong className="text-foreground">Apenas uso do Espaço</strong>
                      )}
                    </span>
                  </div>

                  {/* Justificativa */}
                  {res.justification && (
                    <p className="text-xs font-medium italic text-muted-foreground/90 border-l-2 border-primary/50 pl-2 line-clamp-2">
                      "{res.justification}"
                    </p>
                  )}

                  {/* Alerta de Não Retirada em reservas passadas */}
                  {isMissed && (
                    <div className="bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-500/80 p-2 text-xs font-bold text-amber-900 dark:text-amber-300 flex items-start gap-1.5">
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" />
                      <span>O horário expirou sem retirada dos equipamentos.</span>
                    </div>
                  )}

                  {/* Status de Devoluções em reservas passadas */}
                  {!isMissed && loansCount > 0 && (
                    <div className="bg-muted/40 border border-black/15 p-2 text-[11px] font-bold space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Retirados: {loansCount}</span>
                        {returnedCount === loansCount ? (
                          <span className="text-emerald-600 dark:text-emerald-400 font-black">✓ Todos devolvidos</span>
                        ) : (
                          <span className="text-amber-600 dark:text-amber-400 font-black">⚠️ {loansCount - returnedCount} pendente(s)</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer com Ações */}
                <div className="p-3 bg-muted/20 border-t-2 border-black/10 dark:border-white/10 flex items-center justify-between gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedReservation(res);
                      setIsDetailsOpen(true);
                    }}
                    className="text-xs font-black uppercase border-2 border-black dark:border-white shadow-[2px_2px_0_0_#000] hover:bg-accent"
                  >
                    Ver Detalhes
                  </Button>

                  {/* Cancelamento Rápido (Apenas para Próximas Reservas) */}
                  {activeTab === 'upcoming' && (
                    isConfirmingThis ? (
                      <div className="flex items-center gap-1.5 animate-in fade-in">
                        <Button
                          type="button"
                          size="sm"
                          disabled={isCancelingThis}
                          onClick={() => handleCancelReservation(res)}
                          className="bg-red-600 hover:bg-red-700 text-white text-xs font-black uppercase border-2 border-black shadow-[2px_2px_0_0_#000]"
                        >
                          {isCancelingThis ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Confirmar?"}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          disabled={isCancelingThis}
                          onClick={() => setConfirmCancelId(null)}
                          className="text-xs font-bold px-2"
                        >
                          Não
                        </Button>
                      </div>
                    ) : (
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => setConfirmCancelId(res.id)}
                        className="bg-red-100 hover:bg-red-600 text-red-700 hover:text-white border-2 border-red-600 dark:border-red-500 shadow-[2px_2px_0_0_#000] text-xs font-black uppercase flex items-center gap-1 transition-all"
                        title="Cancelar esta reserva"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Cancelar
                      </Button>
                    )
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Diálogo de Detalhes da Reserva */}
      {selectedReservation && (
        <ReservationDetailsDialog
          open={isDetailsOpen}
          onOpenChange={setIsDetailsOpen}
          reservation={selectedReservation}
          date={parseISO(selectedReservation.date)}
          isAdmin={Boolean(isAdmin)}
          isResponsible={Boolean(isResponsible)}
          isOwner={true}
          onCancel={() => {
            deleteReservation(selectedReservation.id).then((success: boolean) => {
              if (success) {
                toast({ title: "Reserva cancelada", variant: "success" });
                onReservationSuccess();
                refetch();
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

