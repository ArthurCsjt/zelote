import React, { useState, useMemo, useEffect } from 'react';
import { format, parseISO, isToday, isTomorrow, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useQuery } from '@tanstack/react-query';
import type { User as AuthUser } from '@supabase/supabase-js';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Trash2, 
  AlertTriangle, 
  CheckCircle2, 
  Plus, 
  Search, 
  Loader2, 
  ArrowRight,
  Sparkles,
  CalendarDays
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { getUserReservations, deleteReservation, type Reservation } from '@/services/reservationService';
import { formatChromebookTag } from '@/utils/scheduling';
import { ReservationDetailsDialog } from './ReservationDetailsDialog';
import { useProfileRole } from '@/hooks/use-profile-role';
import { useSchedulingResponsible } from '@/hooks/useSchedulingResponsible';
import { status, statusLabels, interval, quantity, collected, normalize } from './history/historyData';
import './scheduling-history.css';

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
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30000);
    return () => window.clearInterval(timer);
  }, []);

  const { data: userReservations = [], isLoading, refetch } = useQuery({
    queryKey: ['userReservations', currentUser?.id],
    queryFn: () => getUserReservations(currentUser?.id || ''),
    enabled: !!currentUser?.id,
  });

  const { upcoming, past, missedCount, servedCount, totalChromebooks } = useMemo(() => {
    const up: Reservation[] = [];
    const pa: Reservation[] = [];
    let missed = 0;
    let served = 0;
    let totalCbs = 0;

    userReservations.forEach(res => {
      const { end } = interval(res);
      const req = quantity(res);
      totalCbs += req;
      const resState = status(res, now);

      if (end >= now) {
        up.push(res);
      } else {
        pa.push(res);
        if (resState === 'missed') missed++;
        if (resState === 'served') served++;
      }
    });

    up.sort((a, b) => `${a.date} ${a.time_slot}`.localeCompare(`${b.date} ${b.time_slot}`));
    pa.sort((a, b) => `${b.date} ${b.time_slot}`.localeCompare(`${a.date} ${a.time_slot}`));

    return { 
      upcoming: up, 
      past: pa, 
      missedCount: missed, 
      servedCount: served,
      totalChromebooks: totalCbs 
    };
  }, [userReservations, now]);

  const displayedList = useMemo(() => {
    const list = activeTab === 'upcoming' ? upcoming : past;
    if (!searchQuery.trim()) return list;
    const q = normalize(searchQuery.trim());
    return list.filter(res => 
      normalize(`${res.classroom || ''} ${res.justification || ''} ${res.date} ${res.time_slot}`).includes(q)
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
      return (
        <span className="hx-pill hx-live">
          <span className="hx-live-dot" />
          Hoje
        </span>
      );
    }
    if (isTomorrow(dt)) {
      return (
        <span className="hx-pill hx-pending">
          Amanhã
        </span>
      );
    }
    const diff = differenceInDays(dt, now);
    if (diff > 1 && diff <= 7) {
      return (
        <span className="hx-pill">
          Em {diff} dias
        </span>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className="hx-root">
        <div className="hx-card flex flex-col items-center justify-center min-h-[300px] text-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--hx-blue)] mb-3" />
          <p className="hx-heading mb-1">Carregando suas reservas...</p>
          <p className="hx-caption">Buscando seus agendamentos no sistema</p>
        </div>
      </div>
    );
  }

  return (
    <div className="hx-root space-y-6">
      {/* ── Indicadores / KPIs Pessoais (Estilo Visão Geral) ── */}
      <div className="hx-kpis" aria-label="Resumo das minhas reservas">
        <div className="hx-kpi">
          <span className="hx-kpi-label">Total Reservado</span>
          <strong className="hx-kpi-value">{userReservations.length}</strong>
          <span className="hx-kpi-note">{totalChromebooks} Chromebooks no total</span>
        </div>
        <div className="hx-kpi">
          <span className="hx-kpi-label">Próximas Aulas</span>
          <strong className="hx-kpi-value text-[var(--hx-blue)]">{upcoming.length}</strong>
          <span className="hx-kpi-note">{upcoming.length === 1 ? '1 agendamento futuro' : `${upcoming.length} agendamentos futuros`}</span>
        </div>
        <div className="hx-kpi">
          <span className="hx-kpi-label">Atendidas</span>
          <strong className="hx-kpi-value text-[var(--hx-ok)]">{servedCount}</strong>
          <span className="hx-kpi-note">Equipamentos retirados</span>
        </div>
        <div className="hx-kpi">
          <span className="hx-kpi-label">Não Retiradas</span>
          <strong className={cn("hx-kpi-value", missedCount > 0 ? "text-[var(--hx-error)]" : "text-[var(--hx-muted)]")}>
            {missedCount}
          </strong>
          <span className="hx-kpi-note">
            {missedCount > 0 ? "Horário expirou sem retirada" : "Nenhuma pendência"}
          </span>
        </div>
      </div>

      {/* ── Barra de Navegação & Ações ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Tabs Modernas */}
        <div className="hx-tabs my-0" role="tablist">
          <Button
            className="hx-control hx-tab"
            role="tab"
            aria-selected={activeTab === 'upcoming'}
            onClick={() => { setActiveTab('upcoming'); setConfirmCancelId(null); }}
          >
            <Clock size={16} />
            <span>Próximas Reservas</span>
            <span className={cn(
              "ml-1.5 px-2 py-0.5 rounded-full text-xs font-bold",
              activeTab === 'upcoming' 
                ? "bg-[var(--hx-soft)] text-[var(--hx-blue)]" 
                : "bg-black/5 dark:bg-white/10 text-[var(--hx-muted)]"
            )}>
              {upcoming.length}
            </span>
          </Button>

          <Button
            className="hx-control hx-tab"
            role="tab"
            aria-selected={activeTab === 'past'}
            onClick={() => { setActiveTab('past'); setConfirmCancelId(null); }}
          >
            <CalendarDays size={16} />
            <span>Passadas</span>
            <span className={cn(
              "ml-1.5 px-2 py-0.5 rounded-full text-xs font-bold",
              activeTab === 'past' 
                ? "bg-[var(--hx-soft)] text-[var(--hx-blue)]" 
                : "bg-black/5 dark:bg-white/10 text-[var(--hx-muted)]"
            )}>
              {past.length}
            </span>
          </Button>
        </div>

        {/* Busca e Botão Nova Reserva */}
        <div className="flex items-center gap-3">
          <div className="hx-search flex-1 sm:w-72 my-0">
            <Search size={16} />
            <input
              type="search"
              aria-label="Buscar por sala, data ou observação"
              placeholder="Buscar sala, data ou motivo..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>

          <Button
            onClick={onGoToCalendar}
            className="hx-control hx-new shrink-0"
            title="Abrir grade semanal para reservar"
          >
            <Plus size={16} />
            <span>Nova Reserva</span>
          </Button>
        </div>
      </div>

      {/* ── Lista de Reservas (Cards Modernos) ── */}
      {displayedList.length === 0 ? (
        <section className="hx-card text-center py-12 px-6">
          <Calendar className="h-12 w-12 mx-auto text-[var(--hx-muted)] opacity-50 mb-3" />
          <h3 className="hx-heading mb-1">
            {activeTab === 'upcoming' 
              ? (searchQuery ? "Nenhuma reserva futura corresponde à busca" : "Você não tem reservas futuras agendadas")
              : (searchQuery ? "Nenhuma reserva passada encontrada" : "Nenhum histórico anterior registrado")}
          </h3>
          <p className="hx-caption max-w-md mx-auto">
            {activeTab === 'upcoming' 
              ? "Para marcar uma aula com Chromebooks ou reservar uma sala de informática, abra a grade de horários."
              : "As aulas realizadas anteriormente aparecem aqui com o status de retirada e devolução dos equipamentos."}
          </p>
          {activeTab === 'upcoming' && (
            <Button
              onClick={onGoToCalendar}
              className="hx-control hx-new mt-6 inline-flex"
            >
              Ir para Grade de Horários
              <ArrowRight size={16} className="ml-1.5" />
            </Button>
          )}
        </section>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence mode="popLayout">
            {displayedList.map((res, index) => {
              const dt = parseISO(res.date);
              const formattedDate = format(dt, "EEEE, dd 'de' MMMM", { locale: ptBR });
              const shortDate = format(dt, "dd/MM/yyyy");
              const requested = quantity(res);
              const loansCount = collected(res);
              const returnedLoans = res.associated_loans?.filter(l => l.returned).length || 0;
              const pendingLoans = loansCount - returnedLoans;

              const resState = status(res, now);
              const isMissed = resState === 'missed';
              const { start, end } = interval(res);
              const isCancelingThis = cancelingId === res.id;
              const isConfirmingThis = confirmCancelId === res.id;

              const classroomName = res.classroom || "Sala / Espaço";
              const avatarLetter = classroomName.replace(/[^a-zA-Z0-9]/g, '').charAt(0).toUpperCase() || 'R';

              return (
                <motion.article
                  key={res.id}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.25, delay: Math.min(index * 0.03, 0.3) }}
                  className={cn(
                    "hx-card p-5 flex flex-col justify-between transition-all duration-200 hover:-translate-y-0.5",
                    res.is_minecraft && "border-[var(--hx-minecraft)] bg-[color-mix(in_srgb,var(--hx-minecraft)_6%,var(--hx-card))]",
                    isMissed && "border-amber-500/40 bg-[color-mix(in_srgb,var(--hx-error)_4%,var(--hx-card))]"
                  )}
                >
                  <div>
                    {/* Header do Card */}
                    <div className="hx-res-top">
                      <span className={cn(
                        "hx-avatar",
                        res.is_minecraft && "bg-[color-mix(in_srgb,var(--hx-minecraft)_15%,transparent)] text-[var(--hx-minecraft)]",
                        isMissed && "bg-amber-500/10 text-amber-600"
                      )} aria-hidden="true">
                        {avatarLetter}
                      </span>

                      <div className="hx-person">
                        <strong className="text-sm font-bold text-[var(--hx-text)] flex items-center gap-1.5">
                          <MapPin size={14} className="text-[var(--hx-blue)] shrink-0" />
                          <span className="truncate">{classroomName}</span>
                        </strong>

                        <div className="text-xs text-[var(--hx-muted)] font-medium mt-0.5 flex items-center gap-1">
                          <Clock size={12} className="shrink-0" />
                          <span className="font-semibold text-[var(--hx-text)]">{res.time_slot}</span>
                          <span>· {shortDate}</span>
                        </div>

                        {/* Pills de Status */}
                        <div className="hx-pills mt-2">
                          {activeTab === 'upcoming' && getDayBadge(res.date)}
                          {res.is_minecraft && <span className="hx-pill hx-mc">MINECRAFT</span>}
                          <span className={`hx-pill hx-${resState}`}>
                            {statusLabels[resState]}
                          </span>
                        </div>
                      </div>

                      {/* Quantidade de Chromebooks */}
                      <div className="hx-quantity text-right shrink-0 !max-w-none">
                        <strong>{requested}</strong>
                        <small className="whitespace-nowrap">{requested === 1 ? 'Chromebook' : 'Chromebooks'}</small>
                      </div>
                    </div>

                    {/* Justificativa / Observação */}
                    {res.justification && (
                      <p className="hx-quote line-clamp-2">
                        “{res.justification}”
                      </p>
                    )}

                    {/* Alerta Elegante de Não Retirada */}
                    {isMissed && (
                      <div className="mt-3.5 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs font-medium flex items-center gap-2">
                        <AlertTriangle size={15} className="shrink-0 text-amber-600 dark:text-amber-400" />
                        <span>O horário passou sem retirada dos equipamentos.</span>
                      </div>
                    )}

                    {/* Chips de Chromebooks Retirados / Devolvidos */}
                    {loansCount > 0 && (
                      <div className="hx-withdrawn mt-3 pt-2.5">
                        <span className="hx-caption text-[11px] font-semibold text-[var(--hx-muted)] flex items-center justify-between">
                          <span>Equipamentos retirados ({loansCount})</span>
                          {returnedLoans === loansCount ? (
                            <span className="text-[var(--hx-ok)] font-bold">✓ Todos devolvidos</span>
                          ) : (
                            <span className="text-[var(--hx-warning)] font-bold">
                              · {returnedLoans} devolvido{returnedLoans === 1 ? '' : 's'} · {pendingLoans} pendente{pendingLoans === 1 ? '' : 's'}
                            </span>
                          )}
                        </span>
                        <div className="hx-ids">
                          {res.associated_loans?.map((loan, i) => {
                            const tag = formatChromebookTag(loan.chromebook_id);
                            return (
                              <span
                                key={`${loan.chromebook_id}-${i}`}
                                className={`hx-id ${loan.returned ? 'hx-id--returned' : 'hx-id--pending'}`}
                                title={loan.returned ? `${tag} - Devolvido` : `${tag} - Pendente de devolução`}
                              >
                                {loan.returned ? `✓ ${tag}` : `⚠️ ${tag}`}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ── Footer com Ações ── */}
                  <div className="mt-4 pt-3.5 border-t border-[var(--hx-border)] flex items-center justify-between gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedReservation(res);
                        setIsDetailsOpen(true);
                      }}
                      className="hx-control text-xs font-medium px-3.5 py-1.5 rounded-xl border border-[var(--hx-border)] bg-[var(--hx-soft)] text-[var(--hx-text)] hover:bg-[var(--hx-card)]"
                    >
                      Ver Detalhes
                    </Button>

                    {/* Cancelamento Rápido (Apenas nas Próximas) */}
                    {activeTab === 'upcoming' && (
                      isConfirmingThis ? (
                        <div className="flex items-center gap-1.5 animate-in fade-in">
                          <Button
                            type="button"
                            size="sm"
                            disabled={isCancelingThis}
                            onClick={() => handleCancelReservation(res)}
                            className="hx-control text-xs font-semibold px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white"
                          >
                            {isCancelingThis ? <Loader2 className="h-3 w-3 animate-spin" /> : "Confirmar?"}
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            disabled={isCancelingThis}
                            onClick={() => setConfirmCancelId(null)}
                            className="text-xs px-2 text-[var(--hx-muted)] hover:text-[var(--hx-text)]"
                          >
                            Não
                          </Button>
                        </div>
                      ) : (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setConfirmCancelId(res.id)}
                          className="hx-control text-xs font-medium px-3 py-1.5 rounded-xl text-red-600 hover:bg-red-500/10 hover:text-red-700 flex items-center gap-1.5 transition-colors"
                          title="Cancelar esta reserva"
                        >
                          <Trash2 size={13} />
                          <span>Cancelar</span>
                        </Button>
                      )
                    )}
                  </div>
                </motion.article>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* ── Diálogo de Detalhes da Reserva ── */}
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
                toast({ title: "Reserva cancelada com sucesso", variant: "success" });
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
