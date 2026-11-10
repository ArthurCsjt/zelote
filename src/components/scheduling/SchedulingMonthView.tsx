import React, { useEffect, useMemo, useState, useRef } from 'react';
import {
  addDays,
  differenceInMinutes,
  endOfMonth,
  format,
  getDay,
  isSameDay,
  isSameMonth,
  isWeekend,
  parseISO,
  startOfDay,
  startOfMonth,
  subMonths,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { BarChart3, CalendarDays, Download, ArrowRight, Plus, Search, Clock } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAuth } from '@/contexts/AuthContext';
import { useProfileRole } from '@/hooks/use-profile-role';
import { useSchedulingResponsible } from '@/hooks/useSchedulingResponsible';
import { useDatabase } from '@/hooks/useDatabase';
import { getReservationsForWeek, type Reservation } from '@/services/reservationService';
import { ReservationDetailsDialog } from './ReservationDetailsDialog';
import { useCancelReservation } from '@/hooks/useCancelReservation';
import {
  byDay,
  collected,
  heatLevel,
  interval,
  makeCsv,
  metrics,
  normalize,
  owned,
  peak,
  quantity,
  ranking,
  rate,
  status,
  statusLabels,
} from './history/historyData';
import { formatChromebookTag } from '@/utils/scheduling';
import { cn } from '@/lib/utils';
import './scheduling-history.css';

type HistoryStyle = React.CSSProperties & { [key: `--hx-${string}`]: string };

interface SchedulingMonthViewProps {
  currentDate: Date;
  reservations: Reservation[];
  totalAvailableChromebooks: number;
  isLoading: boolean;
  onReservationSuccess?: () => void;
  onNewReservation?: (date: Date) => void;
}

type Filter = 'all' | 'mine' | 'pending' | 'served' | 'minecraft';

const filters: { value: Filter; label: string }[] = [
  { value: 'all', label: 'Todas' },
  { value: 'mine', label: 'Minhas' },
  { value: 'pending', label: 'Pendentes' },
  { value: 'served', label: 'Atendidas' },
  { value: 'minecraft', label: 'Minecraft' },
];

const percent = (value: number) => `${Math.round(value)}%`;
const number = (value: number) => value.toLocaleString('pt-BR');
const maintenance = (res: Reservation) =>
  res.prof_role === 'manutencao' ||
  [
    'paulo.geremias@colegiosaojudas.com.br',
    'ivo@colegiosaojudas.com.br',
    'manutencao.teste@colegiosaojudas.com.br',
  ].includes(res.prof_email);

function Variation({
  current,
  previous,
  badIncrease = false,
}: {
  current: number;
  previous: number;
  badIncrease?: boolean;
}) {
  if (previous === 0 && current !== 0) return null;
  const change = previous ? ((current - previous) / previous) * 100 : 0;
  const rounded = Math.round(change);
  const tone = rounded === 0 ? '' : (change > 0) !== badIncrease ? 'good' : 'bad';
  return (
    <span className={`hx-variation ${tone}`}>
      {rounded > 0 ? '▲ +' : rounded < 0 ? '▼ ' : ''}
      {rounded}% vs mês ant.
    </span>
  );
}

const ReservationList = React.memo(function ReservationList({
  rows,
  allRows,
  filter,
  query,
  now,
  userId,
  isManutencao,
  isResponsible,
  onOpen,
  onStart,
}: {
  rows: Reservation[];
  allRows: Reservation[];
  filter: Filter;
  query: string;
  now: Date;
  userId?: string;
  isManutencao: boolean;
  isResponsible: boolean;
  onOpen: (res: Reservation) => void;
  onStart: (res: Reservation) => void;
}) {
  const filtered = useMemo(() => {
    return rows.filter((res) => {
      const state = status(res, now);
      if (filter === 'mine' && !owned(res, userId)) return false;
      if (filter === 'pending' && state !== 'pending' && state !== 'progress-status') return false;
      if (filter === 'served' && state !== 'served') return false;
      if (filter === 'minecraft' && !res.is_minecraft) return false;
      return normalize(
        `${res.prof_name} ${res.classroom || ''} ${res.justification || ''}`
      ).includes(normalize(query.trim()));
    });
  }, [rows, filter, userId, query, now]);

  const groups = useMemo(() => {
    const result = new Map<string, Reservation[]>();
    filtered.forEach((res) =>
      result.set(res.time_slot, [...(result.get(res.time_slot) || []), res])
    );
    return [...result].sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  let itemIndex = 0;

  return (
    <div className="hx-list" aria-live="polite" aria-relevant="additions text">
      {filtered.length === 0 && <p className="hx-empty">Nada com esses filtros</p>}
      {groups.map(([slot, group]) => (
        <section key={slot} aria-label={`Reservas das ${slot}`}>
          <div className="hx-slot">
            <time>{slot}</time>
            {!isManutencao && (
              <span>
                {number(
                  allRows
                    .filter((res) => res.time_slot === slot)
                    .reduce((sum, res) => sum + quantity(res), 0)
                )}{' '}
                Chromebooks
              </span>
            )}
          </div>
          {group.map((res) => {
            const state = status(res, now);
            const requested = quantity(res);
            const loans = collected(res);
            const { start, end } = interval(res);
            const displayName = (res.prof_name || 'Usuário').split('@')[0];
            const isMaintenanceReservation = maintenance(res);
            const fulfilled = (res.associated_loans?.length ?? 0) >= requested;
            const startingIn = differenceInMinutes(start, now);
            const showProgress =
              !isManutencao && !isMaintenanceReservation && requested > 0 && now >= start;
            const delay = `${Math.min(itemIndex++, 7) * 35}ms`;
            const returnedLoans =
              res.associated_loans?.filter((l) => l.returned).length || 0;
            const pendingLoans = loans - returnedLoans;

            return (
              <article
                key={res.id}
                className={`hx-reservation ${res.is_minecraft ? 'minecraft' : ''}`}
                style={{ '--hx-delay': delay } as HistoryStyle}
              >
                <button
                  type="button"
                  className="hx-open"
                  onClick={() => onOpen(res)}
                  aria-label={`Ver reserva de ${displayName}, ${
                    res.classroom || 'sem sala'
                  }, ${slot}`}
                >
                  <div className="hx-res-top">
                    <span className="hx-avatar" aria-hidden="true">
                      {displayName.charAt(0).toUpperCase()}
                    </span>
                    <div className="hx-person">
                      <strong>{displayName}</strong>
                      {owned(res, userId) && <span className="hx-you">você</span>}
                      <div className="hx-pills">
                        {res.classroom && (
                          <span className="hx-pill hx-room">{res.classroom}</span>
                        )}
                        {res.is_minecraft && <span className="hx-pill hx-mc">MINECRAFT</span>}
                        <span className={`hx-pill hx-${state}`}>
                          {statusLabels[state]}
                        </span>
                        {isSameDay(parseISO(res.date), now) &&
                          startingIn > 0 &&
                          startingIn <= 60 && (
                            <span className="hx-pill hx-pending">
                              <Clock size={12} />
                              Inicia em {startingIn}m
                            </span>
                          )}
                        {isSameDay(parseISO(res.date), now) &&
                          state === 'progress-status' && (
                            <span className="hx-pill hx-progress-status">
                              <Clock size={12} />
                              {Math.max(1, differenceInMinutes(end, now))}m restantes
                            </span>
                          )}
                      </div>
                    </div>
                    {isMaintenanceReservation ? (
                      <span className="hx-maintenance">MANUTENÇÃO</span>
                    ) : (
                      !isManutencao && (
                        <div className="hx-quantity text-right shrink-0 !max-w-none">
                          <strong>{number(requested)}</strong>
                          <small className="whitespace-nowrap">
                            {requested <= 1 ? 'Chromebook' : 'Chromebooks'}
                          </small>
                        </div>
                      )
                    )}
                  </div>
                  {res.justification && <p className="hx-quote">“{res.justification}”</p>}
                  {showProgress && (
                    <div>
                      <div className="hx-progress-label">
                        {loans} de {requested} retirados
                      </div>
                      <div
                        className="hx-progress"
                        role="progressbar"
                        aria-label="Chromebooks retirados"
                        aria-valuemin={0}
                        aria-valuemax={requested}
                        aria-valuenow={Math.min(requested, loans)}
                      >
                        <div
                          className="hx-progress-fill"
                          style={
                            {
                              '--hx-fill': `${Math.min(
                                100,
                                (loans / requested) * 100
                              )}%`,
                            } as HistoryStyle
                          }
                        />
                      </div>
                    </div>
                  )}
                </button>
                {!isManutencao && loans > 0 && (
                  <div className="hx-withdrawn">
                    <span className="hx-caption">
                      RETIRADOS · {loans}
                      {returnedLoans === loans ? (
                        <span style={{ color: '#059669', fontWeight: 800, marginLeft: 6 }}>
                          ✓ Todos devolvidos
                        </span>
                      ) : (
                        <span style={{ color: '#d97706', fontWeight: 800, marginLeft: 6 }}>
                          · {returnedLoans} devolvido{returnedLoans === 1 ? '' : 's'} ·{' '}
                          {pendingLoans} pendente{pendingLoans === 1 ? '' : 's'}
                        </span>
                      )}
                    </span>
                    <div className="hx-ids">
                      {res.associated_loans?.map((loan, i) => {
                        const tag = formatChromebookTag(loan.chromebook_id);
                        return (
                          <span
                            className={`hx-id ${
                              loan.returned ? 'hx-id--returned' : 'hx-id--pending'
                            }`}
                            key={`${loan.chromebook_id}-${i}`}
                            title={
                              loan.returned
                                ? `${tag} - Devolvido`
                                : `${tag} - Pendente de devolução`
                            }
                          >
                            {loan.returned ? `✓ ${tag}` : `⚠️ ${tag}`}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
                {isResponsible && !fulfilled && (
                  <div className="hx-action-row">
                    <Button
                      className="hx-control hx-start"
                      onClick={() => onStart(res)}
                    >
                      <ArrowRight size={15} />
                      Iniciar
                    </Button>
                  </div>
                )}
              </article>
            );
          })}
        </section>
      ))}
    </div>
  );
});

function Ranking({ title, entries }: { title: string; entries: [string, number][] }) {
  const max = entries[0]?.[1] || 1;
  return (
    <section className="hx-card">
      <h3 className="hx-heading">{title}</h3>
      {entries.length === 0 ? (
        <p className="hx-caption">Sem dados neste mês</p>
      ) : (
        entries.map(([name, value]) => (
          <div className="hx-rank" key={name}>
            <div className="hx-rank-label">
              <span>{name}</span>
              <strong>{value}</strong>
            </div>
            <div className="hx-rank-track">
              <div
                className="hx-rank-fill"
                style={{ '--hx-fill': `${(value / max) * 100}%` } as HistoryStyle}
              />
            </div>
          </div>
        ))
      )}
    </section>
  );
}

// Auxiliar para garantir que a data inicial caia de segunda a sexta
function adjustIfWeekend(d: Date, refMonth: Date): Date {
  if (!isWeekend(d)) return d;
  const nextMon = addDays(d, getDay(d) === 6 ? 2 : 1);
  if (isSameMonth(nextMon, refMonth)) return nextMon;
  return addDays(d, getDay(d) === 0 ? -2 : -1);
}

export const SchedulingMonthView: React.FC<SchedulingMonthViewProps> = ({
  currentDate,
  reservations,
  totalAvailableChromebooks,
  isLoading,
  onReservationSuccess,
  onNewReservation,
}) => {
  const navigate = useNavigate();
  const daySectionRef = useRef<HTMLElement>(null);
  const [highlightDayHeader, setHighlightDayHeader] = useState(false);

  const { user } = useAuth();
  const { role, isAdmin } = useProfileRole();
  const { isResponsible } = useSchedulingResponsible();
  const { deleteReservation } = useDatabase();
  const { cancel: cancelReservation, isCanceling } = useCancelReservation(deleteReservation);
  const coordination = isAdmin || isResponsible;
  const isManutencao = role === 'manutencao';

  const [tab, setTab] = useState<'calendar' | 'analytics'>('calendar');
  const [selectedDate, setSelectedDate] = useState(() =>
    adjustIfWeekend(startOfMonth(currentDate), currentDate)
  );
  const [filter, setFilter] = useState<Filter | null>(null);
  const [query, setQuery] = useState('');
  const [now, setNow] = useState(new Date());
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const monthKey = format(currentDate, 'yyyy-MM');
  const monthRows = useMemo(
    () => reservations.filter((res) => res.date.startsWith(monthKey)),
    [reservations, monthKey]
  );
  const monthDays = useMemo(() => byDay(monthRows), [monthRows]);
  const scopedRows = useMemo(
    () => (coordination ? monthRows : monthRows.filter((res) => owned(res, user?.id))),
    [monthRows, coordination, user?.id]
  );
  const stats = useMemo(
    () => metrics(scopedRows, totalAvailableChromebooks, now),
    [scopedRows, totalAvailableChromebooks, now]
  );

  const previousMonth = subMonths(currentDate, 1);
  const previousStart = format(startOfMonth(previousMonth), 'yyyy-MM-dd');
  const previousEnd = format(endOfMonth(previousMonth), 'yyyy-MM-dd');
  const previousQuery = useQuery({
    queryKey: ['reservations', 'prev-month', previousStart, previousEnd],
    queryFn: () => getReservationsForWeek(previousStart, previousEnd),
    staleTime: 5 * 60 * 1000,
    enabled: Boolean(user?.id),
  });

  const previousStats = useMemo(
    () =>
      previousQuery.isSuccess && previousQuery.data
        ? metrics(
            coordination
              ? previousQuery.data
              : previousQuery.data.filter((res) => owned(res, user?.id)),
            totalAvailableChromebooks,
            now
          )
        : null,
    [previousQuery.isSuccess, previousQuery.data, coordination, user?.id, totalAvailableChromebooks, now]
  );

  const comparison = useMemo(() => {
    if (!previousStats || !previousQuery.data) return null;
    const sameMonthNow = isSameMonth(now, currentDate);
    const limit = sameMonthNow ? now.getDate() : 31;
    const currentRows = sameMonthNow
      ? scopedRows.filter((res) => parseISO(res.date).getDate() <= limit)
      : scopedRows;
    const previousAll = coordination
      ? previousQuery.data
      : previousQuery.data.filter((res) => owned(res, user?.id));
    const previousRows = previousAll.filter((res) => parseISO(res.date).getDate() <= limit);
    return {
      current: metrics(currentRows, totalAvailableChromebooks, now),
      previous: metrics(previousRows, totalAvailableChromebooks, now),
    };
  }, [previousStats, previousQuery.data, scopedRows, coordination, user?.id, totalAvailableChromebooks, now, currentDate]);

  useEffect(() => {
    if (!document.getElementById('ag-fonts')) {
      const link = document.createElement('link');
      link.id = 'ag-fonts';
      link.rel = 'stylesheet';
      link.href =
        'https://fonts.googleapis.com/css2?family=Lexend:wght@400;600;800&family=Silkscreen&display=swap';
      document.head.appendChild(link);
    }
    const timer = window.setInterval(() => setNow(new Date()), 30000);
    return () => window.clearInterval(timer);
  }, []);

  const initializedMonth = useRef('');
  const pickedDate = useRef(false);
  const autoPicked = useRef('');

  useEffect(() => {
    if (isLoading || initializedMonth.current === monthKey) return;
    initializedMonth.current = monthKey;
    pickedDate.current = false;
    const today = new Date();
    const firstReserved = [...monthDays.keys()].sort()[0];
    const initialTarget = isSameMonth(today, currentDate)
      ? startOfDay(today)
      : firstReserved
      ? parseISO(firstReserved)
      : startOfMonth(currentDate);

    setSelectedDate(adjustIfWeekend(initialTarget, currentDate));
    setQuery('');
  }, [monthKey, monthDays, currentDate, isLoading]);

  useEffect(() => {
    if (
      isLoading ||
      pickedDate.current ||
      autoPicked.current === monthKey ||
      isSameMonth(new Date(), currentDate) ||
      monthDays.size === 0
    )
      return;
    autoPicked.current = monthKey;
    const firstKey = [...monthDays.keys()].sort()[0];
    if (firstKey) {
      setSelectedDate(adjustIfWeekend(parseISO(firstKey), currentDate));
    }
  }, [monthKey, monthDays, currentDate, isLoading]);

  const dateKey = format(selectedDate, 'yyyy-MM-dd');
  const dayRows = useMemo(() => monthDays.get(dateKey) || [], [monthDays, dateKey]);
  const dayPeak = useMemo(() => peak(dayRows), [dayRows]);
  const dayPast = startOfDay(selectedDate) < startOfDay(now);
  const today = isSameDay(selectedDate, now);
  const activeFilter = filter ?? (coordination ? 'all' : 'mine');

  const weekdays = useMemo(() => {
    const days = byDay(scopedRows);
    return [1, 2, 3, 4, 5].map((day) => {
      const samples = [...days]
        .filter(([date]) => getDay(parseISO(date)) === day)
        .map(([, rows]) => rate(peak(rows), totalAvailableChromebooks));
      return samples.length
        ? samples.reduce((sum, value) => sum + value, 0) / samples.length
        : 0;
    });
  }, [scopedRows, totalAvailableChromebooks]);

  const rooms = useMemo(
    () => ranking(scopedRows, (res) => res.classroom || 'Não informado'),
    [scopedRows]
  );
  const professors = useMemo(
    () => ranking(scopedRows, (res) => (res.prof_name || 'Usuário').split('@')[0]),
    [scopedRows]
  );

  // ── Dias Úteis (Segunda a Sexta) ──
  const start = startOfMonth(currentDate);
  const allMonthDays = useMemo(
    () => Array.from({ length: endOfMonth(currentDate).getDate() }, (_, i) => addDays(start, i)),
    [currentDate, start]
  );
  const calendarDays = useMemo(() => allMonthDays.filter((d) => !isWeekend(d)), [allMonthDays]);
  const firstWorkDay = calendarDays[0];
  // getDay: Dom 0, Seg 1, Ter 2, Qua 3, Qui 4, Sex 5, Sáb 6 -> Seg = 0, ..., Sex = 4
  const offset = firstWorkDay ? (getDay(firstWorkDay) + 6) % 7 : 0;

  const kpis = [
    {
      label: coordination ? 'Reservas' : 'Minhas reservas',
      value: number(stats.count),
      previous: comparison?.previous.count,
      current: comparison?.current.count ?? stats.count,
    },
    ...(!isManutencao
      ? [
          {
            label: 'Chromebooks-aula',
            value: number(stats.quantity),
            previous: comparison?.previous.quantity,
            current: comparison?.current.quantity ?? stats.quantity,
          },
        ]
      : []),
    ...(coordination && !isManutencao
      ? [
          { label: 'Ocupação média', value: percent(stats.average) },
          {
            label: 'Pico do mês',
            value: number(stats.max.value),
            note: stats.max.date
              ? `dia ${parseISO(stats.max.date).getDate()}`
              : 'Sem reservas',
          },
        ]
      : []),
    ...(!isManutencao
      ? [
          { label: 'Atendimento', value: percent(stats.attendance) },
          { label: 'Não retiradas', value: number(stats.missed) },
        ]
      : []),
    { label: 'Com Minecraft', value: number(stats.minecraft) },
  ];

  // ── KPIs Scroll & Fade Mask ──
  const kpisRef = useRef<HTMLDivElement>(null);
  const [kpiScrollState, setKpiScrollState] = useState({
    canScrollLeft: false,
    canScrollRight: false,
  });
  const [activeKpiIndex, setActiveKpiIndex] = useState(0);

  const handleKpiScroll = () => {
    if (!kpisRef.current) return;
    requestAnimationFrame(() => {
      const el = kpisRef.current;
      if (!el) return;
      const canLeft = el.scrollLeft > 4;
      const canRight = el.scrollLeft < el.scrollWidth - el.clientWidth - 4;
      setKpiScrollState({ canScrollLeft: canLeft, canScrollRight: canRight });

      const itemWidth = el.firstElementChild
        ? (el.firstElementChild as HTMLElement).offsetWidth + 12
        : 160;
      const index = Math.round(el.scrollLeft / itemWidth);
      setActiveKpiIndex(Math.min(kpis.length - 1, Math.max(0, index)));
    });
  };

  useEffect(() => {
    handleKpiScroll();
  }, [kpis.length, isLoading]);

  const kpiMaskStyle = useMemo(() => {
    if (kpiScrollState.canScrollLeft && kpiScrollState.canScrollRight) {
      return {
        maskImage:
          'linear-gradient(to right, transparent, black 24px, black calc(100% - 24px), transparent)',
        WebkitMaskImage:
          'linear-gradient(to right, transparent, black 24px, black calc(100% - 24px), transparent)',
      };
    }
    if (kpiScrollState.canScrollRight) {
      return {
        maskImage: 'linear-gradient(to right, black calc(100% - 24px), transparent)',
        WebkitMaskImage: 'linear-gradient(to right, black calc(100% - 24px), transparent)',
      };
    }
    if (kpiScrollState.canScrollLeft) {
      return {
        maskImage: 'linear-gradient(to right, transparent, black 24px)',
        WebkitMaskImage: 'linear-gradient(to right, transparent, black 24px)',
      };
    }
    return undefined;
  }, [kpiScrollState]);

  const handleNewReservation = () => {
    if (onNewReservation) {
      onNewReservation(selectedDate);
    } else {
      navigate('/agendamento');
    }
  };

  const openReservation = React.useCallback((res: Reservation) => {
    setSelectedReservation(res);
    setIsDetailsOpen(true);
  }, []);

  const startReservation = React.useCallback(
    (res: Reservation) =>
      navigate('/', {
        state: {
          fromScheduling: true,
          reservationData: { ...res, date: res.date, time_slot: res.time_slot },
        },
      }),
    [navigate]
  );

  const exportCsv = () => {
    const blob = new Blob([makeCsv(scopedRows, now)], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `historico-agendamentos-${monthKey}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <div className="hx-root" aria-busy={isLoading}>
      {isLoading && <span className="sr-only">Carregando</span>}

      {/* ── Sub-abas: Calendário e Análises ── */}
      <div className="hx-tabs" role="tablist" aria-label="Visões do histórico">
        <Button
          id="hx-calendar-tab"
          className="hx-control hx-tab"
          role="tab"
          aria-selected={tab === 'calendar'}
          aria-controls="hx-calendar-panel"
          tabIndex={tab === 'calendar' ? 0 : -1}
          onClick={() => setTab('calendar')}
          onKeyDown={(event) => {
            if (event.key === 'ArrowRight' || event.key === 'ArrowLeft' || event.key === 'End') {
              event.preventDefault();
              setTab('analytics');
              document.getElementById('hx-analytics-tab')?.focus();
            }
          }}
        >
          <CalendarDays size={17} />
          Calendário
        </Button>
        <Button
          id="hx-analytics-tab"
          className="hx-control hx-tab"
          role="tab"
          aria-selected={tab === 'analytics'}
          aria-controls="hx-analytics-panel"
          tabIndex={tab === 'analytics' ? 0 : -1}
          onClick={() => setTab('analytics')}
          onKeyDown={(event) => {
            if (event.key === 'ArrowRight' || event.key === 'ArrowLeft' || event.key === 'Home') {
              event.preventDefault();
              setTab('calendar');
              document.getElementById('hx-calendar-tab')?.focus();
            }
          }}
        >
          <BarChart3 size={17} />
          Análises
        </Button>
      </div>

      {tab === 'calendar' ? (
        <div
          id="hx-calendar-panel"
          role="tabpanel"
          aria-labelledby="hx-calendar-tab"
          aria-busy={isLoading}
        >
          {/* ── KPIs com Peek, Fade e Dots no Mobile ── */}
          <div
            className="hx-kpis"
            aria-label="Indicadores do mês"
            ref={kpisRef}
            onScroll={handleKpiScroll}
            style={kpiMaskStyle}
          >
            {isLoading
              ? [1, 2, 3, 4, 5].map((i) => (
                  <div className="hx-kpi space-y-2" key={i}>
                    <Skeleton className="h-4 w-20 rounded bg-[var(--hx-soft)]" />
                    <Skeleton className="h-8 w-14 rounded-lg bg-[var(--hx-soft)]" />
                  </div>
                ))
              : kpis.map((kpi) => (
                  <div className="hx-kpi" key={kpi.label}>
                    <span className="hx-kpi-label">{kpi.label}</span>
                    <strong className="hx-kpi-value">{kpi.value}</strong>
                    {'note' in kpi && <span className="hx-kpi-note">{kpi.note}</span>}
                    {'previous' in kpi && kpi.previous !== undefined && (
                      <Variation current={kpi.current} previous={kpi.previous} />
                    )}
                  </div>
                ))}
          </div>

          {/* Indicadores de página dos KPIs (Mobile) */}
          <div className="flex justify-center items-center gap-1.5 mt-0.5 mb-4 sm:hidden" aria-hidden="true">
            {kpis.map((_, i) => (
              <span
                key={i}
                className={cn(
                  'h-1.5 rounded-full transition-all duration-200',
                  i === activeKpiIndex ? 'w-4 bg-[var(--hx-blue)]' : 'w-1.5 bg-[var(--hx-border)]'
                )}
              />
            ))}
          </div>

          <div className="hx-layout">
            {/* ── Calendário de Ocupação (Segunda a Sexta) ── */}
            <section className="hx-card" aria-label="Calendário de ocupação">
              <h3 className="hx-heading">Ocupação por dia</h3>

              {isLoading ? (
                <div className="hx-calendar">
                  {['SEG', 'TER', 'QUA', 'QUI', 'SEX'].map((label) => (
                    <span className="hx-weekday" key={label}>
                      {label}
                    </span>
                  ))}
                  {Array.from({ length: 20 }, (_, i) => (
                    <Skeleton key={i} className="h-14 rounded-xl bg-[var(--hx-soft)]" />
                  ))}
                </div>
              ) : (
                <div className="hx-calendar">
                  {['SEG', 'TER', 'QUA', 'QUI', 'SEX'].map((label) => (
                    <span className="hx-weekday" key={label}>
                      {label}
                    </span>
                  ))}
                  {Array.from({ length: offset }, (_, i) => (
                    <span key={`blank-${i}`} aria-hidden="true" />
                  ))}
                  {calendarDays.map((day) => {
                    const key = format(day, 'yyyy-MM-dd');
                    const rows = monthDays.get(key) || [];
                    const dayRate = rate(peak(rows), totalAvailableChromebooks);
                    const level = isManutencao ? 0 : heatLevel(dayRate);
                    return (
                      <Button
                        key={key}
                        className={cn(
                          'hx-day',
                          isSameDay(day, now) && 'today'
                        )}
                        data-level={level}
                        aria-pressed={isSameDay(day, selectedDate)}
                        aria-label={`${format(day, "d 'de' MMMM", {
                          locale: ptBR,
                        })}, ${rows.length} reservas${
                          isManutencao ? '' : `, pico de ${percent(dayRate)}`
                        }`}
                        onClick={() => {
                          pickedDate.current = true;
                          setSelectedDate(day);
                          if (typeof window !== 'undefined' && window.innerWidth < 860) {
                            daySectionRef.current?.scrollIntoView({
                              behavior: window.matchMedia('(prefers-reduced-motion: reduce)')
                                .matches
                                ? 'auto'
                                : 'smooth',
                              block: 'start',
                            });
                            setHighlightDayHeader(true);
                            setTimeout(() => setHighlightDayHeader(false), 800);
                          }
                        }}
                      >
                        <span>{day.getDate()}</span>
                        <span className="hx-heat-track">
                          {level > 0 && (
                            <span
                              className="hx-heat"
                              data-level={level}
                              style={
                                {
                                  '--hx-fill': `${Math.max(
                                    18,
                                    Math.min(100, dayRate)
                                  )}%`,
                                } as HistoryStyle
                              }
                            />
                          )}
                        </span>
                      </Button>
                    );
                  })}
                </div>
              )}

              {!isManutencao && !isLoading && (
                <>
                  <div className="hx-legend">
                    {['até 29%', '30–74%', '75–99%', '100%'].map((label, i) => (
                      <span key={label}>
                        <i className="hx-swatch" data-level={i + 1} />
                        {label}
                      </span>
                    ))}
                  </div>
                  <p className="hx-caption">Pico de uso do dia</p>
                </>
              )}
            </section>

            {/* ── Reservas do Dia ── */}
            <section
              ref={daySectionRef}
              className={cn(
                'hx-card hx-day-section transition-shadow duration-300',
                highlightDayHeader &&
                  'ring-2 ring-[var(--hx-blue)] ring-offset-2 ring-offset-[var(--hx-card)]'
              )}
              aria-label="Reservas do dia"
            >
              <div className="hx-day-header">
                <div>
                  <h3 className="hx-heading">
                    {(() => {
                      const label = format(selectedDate, "EEEE, d 'de' MMMM", {
                        locale: ptBR,
                      });
                      return label.charAt(0).toUpperCase() + label.slice(1);
                    })()}
                    {' · '}
                    <span className="text-sm font-semibold text-[var(--hx-muted)]">
                      {dayRows.length} {dayRows.length === 1 ? 'reserva' : 'reservas'}
                    </span>
                  </h3>
                  <span className={`hx-pill ${today ? 'hx-live' : ''}`}>
                    {today && <span className="hx-live-dot" />}
                    {today ? 'Tempo real' : dayPast ? 'Dados históricos' : 'Agendado'}
                  </span>
                </div>
                {!dayPast && !isWeekend(selectedDate) && (
                  <Button className="hx-control hx-new" onClick={handleNewReservation}>
                    <Plus size={16} />
                    Nova reserva
                  </Button>
                )}
              </div>

              {coordination && !isManutencao && (
                <div className="hx-stats">
                  <div className="hx-stat">
                    <span>Total</span>
                    <strong>{number(totalAvailableChromebooks)}</strong>
                  </div>
                  <div className="hx-stat">
                    <span>Pico de uso</span>
                    <strong>{number(dayPeak)}</strong>
                  </div>
                  <div className="hx-stat">
                    <span>Saldo mín.</span>
                    <strong
                      className={
                        totalAvailableChromebooks - dayPeak <= 0 && dayPeak > 0
                          ? 'hx-danger'
                          : ''
                      }
                    >
                      {number(Math.max(0, totalAvailableChromebooks - dayPeak))}
                    </strong>
                  </div>
                </div>
              )}

              <div className="hx-chips" role="group" aria-label="Filtrar reservas">
                {filters.map((item) => (
                  <Button
                    key={item.value}
                    className="hx-control hx-chip"
                    aria-pressed={activeFilter === item.value}
                    onClick={() => setFilter(item.value)}
                  >
                    {item.label}
                  </Button>
                ))}
              </div>

              <div className="hx-search">
                <Search size={16} />
                <input
                  type="search"
                  aria-label="Buscar professor, sala ou conteúdo"
                  placeholder="Buscar professor, sala ou conteúdo"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
              </div>

              {isLoading ? (
                <div className="space-y-3 pt-2">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="p-3.5 rounded-2xl border border-[var(--hx-border)] bg-[var(--hx-card)] flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <Skeleton className="h-9 w-9 rounded-full bg-[var(--hx-soft)]" />
                        <div className="space-y-1.5 flex-1">
                          <Skeleton className="h-4 w-28 rounded bg-[var(--hx-soft)]" />
                          <Skeleton className="h-3 w-40 rounded bg-[var(--hx-soft)]" />
                        </div>
                      </div>
                      <Skeleton className="h-8 w-16 rounded-xl bg-[var(--hx-soft)]" />
                    </div>
                  ))}
                </div>
              ) : dayRows.length === 0 ? (
                <EmptyState
                  variant="soft"
                  icon={CalendarDays}
                  title={
                    isWeekend(selectedDate)
                      ? 'Sem aulas aos fins de semana'
                      : 'Nenhuma reserva neste dia'
                  }
                  description={
                    isWeekend(selectedDate)
                      ? 'O colégio não possui aulas regulares aos sábados e domingos.'
                      : 'Não há reservas de salas ou equipamentos para esta data.'
                  }
                  action={
                    !dayPast && !isWeekend(selectedDate)
                      ? { label: 'Nova reserva', onClick: handleNewReservation }
                      : undefined
                  }
                />
              ) : (
                <ReservationList
                  rows={dayRows}
                  allRows={dayRows}
                  filter={activeFilter}
                  query={query}
                  now={now}
                  userId={user?.id}
                  isManutencao={isManutencao}
                  isResponsible={isResponsible}
                  onOpen={openReservation}
                  onStart={startReservation}
                />
              )}
            </section>
          </div>
        </div>
      ) : (
        /* ── Aba de Análises ── */
        <div
          id="hx-analytics-panel"
          role="tabpanel"
          aria-labelledby="hx-analytics-tab"
          aria-busy={isLoading}
        >
          <div className="hx-analysis-header">
            <Button
              className="hx-control hx-export"
              disabled={isLoading || scopedRows.length === 0}
              onClick={exportCsv}
            >
              <Download size={16} />
              Exportar CSV
            </Button>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="hx-card p-5 space-y-4">
                  <Skeleton className="h-5 w-40 rounded bg-[var(--hx-soft)]" />
                  <Skeleton className="h-40 w-full rounded-xl bg-[var(--hx-soft)]" />
                </div>
              ))}
            </div>
          ) : scopedRows.length === 0 ? (
            <EmptyState
              variant="soft"
              icon={BarChart3}
              title="Sem dados neste mês"
              description="Nenhuma reserva registrada para gerar estatísticas neste período."
            />
          ) : (
            <div className="hx-analysis-grid">
              {!isManutencao && (
                <section className="hx-card">
                  <h3 className="hx-heading">Ocupação média por dia da semana</h3>
                  <div
                    className="hx-chart"
                    role="img"
                    aria-label={weekdays
                      .map(
                        (value, i) =>
                          `${['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'][i]}: ${percent(
                            value
                          )}`
                      )
                      .join(', ')}
                  >
                    {weekdays.map((value, i) => (
                      <div className="hx-bar-column" key={i}>
                        <strong>{percent(value)}</strong>
                        <div className="hx-bar-track">
                          <div
                            className="hx-bar"
                            style={
                              {
                                '--hx-fill': `${Math.min(100, value)}%`,
                              } as HistoryStyle
                            }
                          />
                        </div>
                        <span>{['SEG', 'TER', 'QUA', 'QUI', 'SEX'][i]}</span>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {!isManutencao && (
                <section className="hx-card">
                  <h3 className="hx-heading">Retirada dos Chromebooks</h3>
                  <div className="hx-donut-row">
                    <div
                      className={`hx-donut ${stats.past === 0 ? 'empty' : ''}`}
                      role="img"
                      aria-label={`${stats.served} atendidas, ${stats.partial} parciais, ${stats.missed} não retiradas`}
                      style={
                        {
                          '--hx-served-stop': `${
                            stats.past ? (stats.served / stats.past) * 100 : 0
                          }%`,
                          '--hx-partial-stop': `${
                            stats.past
                              ? ((stats.served + stats.partial) / stats.past) * 100
                              : 0
                          }%`,
                        } as HistoryStyle
                      }
                    >
                      <div className="hx-donut-center">
                        <strong>{percent(stats.attendance)}</strong>
                        <span>de atendimento</span>
                      </div>
                    </div>
                    <div className="hx-donut-legend">
                      <span>
                        <i className="hx-dot" />
                        Atendidas <strong>{stats.served}</strong>
                      </span>
                      <span>
                        <i className="hx-dot partial" />
                        Parciais <strong>{stats.partial}</strong>
                      </span>
                      <span>
                        <i className="hx-dot missed" />
                        Não retiradas <strong>{stats.missed}</strong>
                      </span>
                    </div>
                  </div>
                  {stats.past === 0 && (
                    <p className="hx-caption">Nenhuma reserva encerrada com Chromebooks</p>
                  )}
                </section>
              )}

              <Ranking title="Salas mais usadas" entries={rooms} />
              {coordination && (
                <Ranking title="Professores que mais reservam" entries={professors} />
              )}
            </div>
          )}
        </div>
      )}

      {selectedReservation && (
        <ReservationDetailsDialog
          open={isDetailsOpen}
          onOpenChange={setIsDetailsOpen}
          reservation={selectedReservation}
          date={parseISO(selectedReservation.date)}
          isAdmin={Boolean(isAdmin)}
          isResponsible={Boolean(isResponsible)}
          isOwner={owned(selectedReservation, user?.id)}
          isCanceling={isCanceling}
          onCancel={() => {
            cancelReservation(selectedReservation.id, {
              onSuccess: () => {
                onReservationSuccess?.();
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
