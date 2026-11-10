import React, { useState, useMemo, useEffect } from 'react';
import { 
  format, 
  parseISO, 
  isToday, 
  isTomorrow, 
  differenceInDays, 
  isSameDay, 
  isSameWeek, 
  isSameMonth 
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useQuery } from '@tanstack/react-query';
import type { User as AuthUser } from '@supabase/supabase-js';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Trash2, 
  AlertTriangle, 
  Plus, 
  Search, 
  Loader2, 
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { getUserReservations, deleteReservation, type Reservation } from '@/services/reservationService';
import { formatChromebookTag } from '@/utils/scheduling';
import { ReservationDetailsDialog } from './ReservationDetailsDialog';
import { useCancelReservation } from '@/hooks/useCancelReservation';
import { useProfileRole } from '@/hooks/use-profile-role';
import { useSchedulingResponsible } from '@/hooks/useSchedulingResponsible';
import { status, statusLabels, interval, quantity, collected, normalize } from './history/historyData';
import './scheduling-history.css';

interface MyReservationsViewProps {
  currentUser: AuthUser | null;
  onReservationSuccess: () => void;
  onGoToCalendar: () => void;
}

type PeriodFilter = 'today' | 'week' | 'month' | 'all' | 'past';

export const MyReservationsView: React.FC<MyReservationsViewProps> = ({
  currentUser,
  onReservationSuccess,
  onGoToCalendar,
}) => {
  const { isAdmin } = useProfileRole();
  const { isResponsible } = useSchedulingResponsible();
  const { cancel: cancelReservation, isCanceling } = useCancelReservation(deleteReservation);

  const [activeFilter, setActiveFilter] = useState<PeriodFilter>('week');
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

  // Contagens por período para exibir diretamente nos chips
  const counts = useMemo(() => {
    let today = 0;
    let week = 0;
    let month = 0;
    let all = 0;
    let past = 0;

    userReservations.forEach(res => {
      const dt = parseISO(res.date);
      const { end } = interval(res);
      const isPast = end < now;

      if (isSameDay(dt, now)) today++;
      if (isSameWeek(dt, now, { weekStartsOn: 1 })) week++;
      if (isSameMonth(dt, now)) month++;
      if (!isPast) all++;
      if (isPast) past++;
    });

    return { today, week, month, all, past };
  }, [userReservations, now]);

  // Se a semana atual estiver vazia mas houver reservas futuras, ajusta inteligentemente o filtro inicial
  useEffect(() => {
    if (!isLoading && userReservations.length > 0) {
      if (counts.week === 0 && counts.all > 0 && activeFilter === 'week') {
        setActiveFilter('all');
      }
    }
  }, [isLoading, userReservations.length, counts.week, counts.all]);

  // Lista filtrada pelo período ativo + busca por texto
  const displayedList = useMemo(() => {
    let list = userReservations.filter(res => {
      const dt = parseISO(res.date);
      const { end } = interval(res);
      const isPast = end < now;

      switch (activeFilter) {
        case 'today':
          return isSameDay(dt, now);
        case 'week':
          return isSameWeek(dt, now, { weekStartsOn: 1 });
        case 'month':
          return isSameMonth(dt, now);
        case 'past':
          return isPast;
        case 'all':
        default:
          return !isPast;
      }
    });

    // Ordenação: futuras em ordem crescente (mais próximas primeiro); passadas em ordem decrescente (mais recentes primeiro)
    if (activeFilter === 'past') {
      list.sort((a, b) => `${b.date} ${b.time_slot}`.localeCompare(`${a.date} ${a.time_slot}`));
    } else {
      list.sort((a, b) => `${a.date} ${a.time_slot}`.localeCompare(`${b.date} ${b.time_slot}`));
    }

    if (!searchQuery.trim()) return list;
    const q = normalize(searchQuery.trim());
    return list.filter(res => 
      normalize(`${res.classroom || ''} ${res.justification || ''} ${res.date} ${res.time_slot}`).includes(q)
    );
  }, [userReservations, activeFilter, searchQuery, now]);

  const handleCancelReservation = async (reservation: Reservation) => {
    setCancelingId(reservation.id);
    await cancelReservation(reservation.id, {
      description: `Horário ${reservation.time_slot} do dia ${format(parseISO(reservation.date), "dd/MM/yyyy")} foi liberado.`,
      onSuccess: async () => {
        setConfirmCancelId(null);
        await refetch();
        onReservationSuccess();
      },
    });
    setCancelingId(null);
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

  const getFilterEmptyDescription = () => {
    switch (activeFilter) {
      case 'today':
        return "Você não tem nenhum agendamento para hoje.";
      case 'week':
        return "Nenhuma reserva encontrada para esta semana.";
      case 'month':
        return "Nenhuma reserva encontrada para este mês.";
      case 'past':
        return "Nenhum histórico de agendamentos anteriores encontrado.";
      case 'all':
      default:
        return "Você não tem próximas reservas agendadas.";
    }
  };

  if (isLoading) {
    return (
      <div className="hx-root space-y-6" aria-busy="true">
        <span className="sr-only">Carregando</span>
        {/* Painel de Controle em Skeleton */}
        <section className="hx-card space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="space-y-2">
              <Skeleton className="h-6 w-44 rounded-lg bg-[var(--hx-soft)]" />
              <Skeleton className="h-4 w-72 rounded-md bg-[var(--hx-soft)]" />
            </div>
            <Skeleton className="h-11 w-36 rounded-xl bg-[var(--hx-soft)]" />
          </div>

          <div className="flex gap-2 flex-wrap">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-10 w-24 rounded-full bg-[var(--hx-soft)]" />
            ))}
          </div>

          <Skeleton className="h-12 w-full rounded-2xl bg-[var(--hx-soft)]" />
        </section>

        {/* 3 Cartões em Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="hx-card p-5 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 flex-1">
                  <Skeleton className="h-11 w-11 rounded-full bg-[var(--hx-soft)] shrink-0" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-28 rounded-md bg-[var(--hx-soft)]" />
                    <Skeleton className="h-3 w-40 rounded-md bg-[var(--hx-soft)]" />
                  </div>
                </div>
                <Skeleton className="h-12 w-16 rounded-xl bg-[var(--hx-soft)] shrink-0" />
              </div>

              <div className="space-y-2 pt-2">
                <Skeleton className="h-3 w-full rounded-md bg-[var(--hx-soft)]" />
                <Skeleton className="h-3 w-3/4 rounded-md bg-[var(--hx-soft)]" />
              </div>

              <div className="flex justify-between items-center pt-2">
                <Skeleton className="h-9 w-28 rounded-xl bg-[var(--hx-soft)]" />
                <Skeleton className="h-9 w-20 rounded-xl bg-[var(--hx-soft)]" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="hx-root space-y-6">
      {/* ── Painel de Controle e Filtros (Estilo Visão Geral) ── */}
      <section className="hx-card">
        {/* Linha Superior: Título + Botão Nova Reserva */}
        <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
          <div>
            <h2 className="hx-heading mb-1 text-lg">Minhas Reservas</h2>
            <p className="hx-caption mt-0">
              Gerencie seus agendamentos e acompanhe a retirada de equipamentos
            </p>
          </div>

          <Button
            onClick={onGoToCalendar}
            className="hx-control hx-new shrink-0"
            title="Abrir grade semanal para agendar"
          >
            <Plus size={16} />
            <span>Nova Reserva</span>
          </Button>
        </div>

        {/* Linha de Chips de Filtro (Hoje, Semanal, Mensal, Todas, Passadas) */}
        <div className="hx-chips mb-4" role="group" aria-label="Filtrar por período">
          <Button
            className="hx-control hx-chip"
            aria-pressed={activeFilter === 'today'}
            onClick={() => { setActiveFilter('today'); setConfirmCancelId(null); }}
          >
            <span>Hoje</span>
            <span className="ml-1.5 opacity-80 font-bold text-[11px]">({counts.today})</span>
          </Button>

          <Button
            className="hx-control hx-chip"
            aria-pressed={activeFilter === 'week'}
            onClick={() => { setActiveFilter('week'); setConfirmCancelId(null); }}
          >
            <span>Esta semana</span>
            <span className="ml-1.5 opacity-80 font-bold text-[11px]">({counts.week})</span>
          </Button>

          <Button
            className="hx-control hx-chip"
            aria-pressed={activeFilter === 'month'}
            onClick={() => { setActiveFilter('month'); setConfirmCancelId(null); }}
          >
            <span>Este mês</span>
            <span className="ml-1.5 opacity-80 font-bold text-[11px]">({counts.month})</span>
          </Button>

          <Button
            className="hx-control hx-chip"
            aria-pressed={activeFilter === 'all'}
            onClick={() => { setActiveFilter('all'); setConfirmCancelId(null); }}
          >
            <span>Próximas</span>
            <span className="ml-1.5 opacity-80 font-bold text-[11px]">({counts.all})</span>
          </Button>

          <Button
            className="hx-control hx-chip"
            aria-pressed={activeFilter === 'past'}
            onClick={() => { setActiveFilter('past'); setConfirmCancelId(null); }}
          >
            <span>Passadas</span>
            <span className="ml-1.5 opacity-80 font-bold text-[11px]">({counts.past})</span>
          </Button>
        </div>

        {/* Campo de Busca */}
        <div className="hx-search my-0">
          <Search size={16} />
          <input
            type="search"
            aria-label="Buscar por sala, data ou observação"
            placeholder="Buscar por sala, data ou observação..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
      </section>

      {/* ── Lista de Reservas (Cards Modernos) ── */}
      {displayedList.length === 0 ? (
        searchQuery.trim() ? (
          <EmptyState
            variant="soft"
            icon={Search}
            title="Nenhuma reserva corresponde à busca"
            description={`Não encontramos agendamentos com o termo "${searchQuery}". Tente buscar por outra sala, data ou observação.`}
            action={{
              label: "Limpar busca",
              onClick: () => setSearchQuery(''),
            }}
          />
        ) : (
          <EmptyState
            variant="soft"
            icon={Calendar}
            title={getFilterEmptyDescription()}
            description={
              activeFilter === 'past'
                ? "As aulas já concluídas aparecem aqui com o registro de devolução."
                : "Abra a grade semanal para agendar uma sala ou reservar Chromebooks para suas turmas."
            }
            action={
              activeFilter !== 'past'
                ? {
                    label: "Ir para Grade de Horários",
                    onClick: onGoToCalendar,
                  }
                : undefined
            }
          />
        )
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
              const isFutureOrActive = end >= now;
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
                          {isFutureOrActive && getDayBadge(res.date)}
                          {res.is_minecraft && <span className="hx-pill hx-mc">MINECRAFT</span>}
                          <span className={`hx-pill hx-${resState}`}>
                            {statusLabels[resState]}
                          </span>
                        </div>
                      </div>

                      {/* Quantidade de Chromebooks (singular para 0 e 1) */}
                      <div className="hx-quantity text-right shrink-0 !max-w-none">
                        <strong>{requested}</strong>
                        <small className="whitespace-nowrap">{requested <= 1 ? 'Chromebook' : 'Chromebooks'}</small>
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

                    {/* Cancelamento Rápido (Apenas para Reservas Futuras / Em andamento) */}
                    {isFutureOrActive && (
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
          isCanceling={isCanceling}
          onCancel={() => {
            cancelReservation(selectedReservation.id, {
              onSuccess: async () => {
                onReservationSuccess();
                await refetch();
                setIsDetailsOpen(false);
                setSelectedReservation(null);
              },
            });
          }}
        />
      )}
    </div>
  );
};
