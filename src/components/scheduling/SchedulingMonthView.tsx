import React, { useEffect, useMemo, useState } from 'react';
import { addDays, differenceInMinutes, endOfMonth, format, getDay, isSameDay, isSameMonth, isWeekend, parseISO, startOfDay, startOfMonth, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { BarChart3, CalendarDays, Download, ArrowRight, Plus, Search, Clock } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useProfileRole } from '@/hooks/use-profile-role';
import { useSchedulingResponsible } from '@/hooks/useSchedulingResponsible';
import { useDatabase } from '@/hooks/useDatabase';
import { getReservationsForWeek, type Reservation } from '@/services/reservationService';
import { ReservationDetailsDialog } from './ReservationDetailsDialog';
import { byDay, collected, heatLevel, interval, makeCsv, metrics, normalize, owned, peak, quantity, ranking, rate, status, statusLabels } from './history/historyData';
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
  { value: 'all', label: 'Todas' }, { value: 'mine', label: 'Minhas' },
  { value: 'pending', label: 'Pendentes' }, { value: 'served', label: 'Atendidas' }, { value: 'minecraft', label: 'Minecraft' },
];
const percent = (value: number) => `${Math.round(value)}%`;
const number = (value: number) => value.toLocaleString('pt-BR');
const maintenance = (res: Reservation) => res.prof_role === 'manutencao' || ['paulo.geremias@colegiosaojudas.com.br', 'ivo@colegiosaojudas.com.br', 'manutencao.teste@colegiosaojudas.com.br'].includes(res.prof_email);

function Variation({ current, previous, badIncrease = false }: { current: number; previous: number; badIncrease?: boolean }) {
  if (previous === 0 && current !== 0) return null;
  const change = previous ? (current - previous) / previous * 100 : 0;
  const rounded = Math.round(change);
  const tone = rounded === 0 ? '' : (change > 0) !== badIncrease ? 'good' : 'bad';
  return <span className={`hx-variation ${tone}`}>{rounded > 0 ? '▲ +' : rounded < 0 ? '▼ ' : ''}{rounded}% vs mês ant.</span>;
}

const ReservationList = React.memo(function ReservationList({ rows, allRows, filter, query, now, userId, isManutencao, isResponsible, onOpen, onStart }: {
  rows: Reservation[]; allRows: Reservation[]; filter: Filter; query: string; now: Date; userId?: string;
  isManutencao: boolean; isResponsible: boolean; onOpen: (res: Reservation) => void; onStart: (res: Reservation) => void;
}) {
  const filtered = useMemo(() => rows.filter(res => {
    const state = status(res, now);
    if (filter === 'mine' && !owned(res, userId)) return false;
    if (filter === 'pending' && state !== 'pending' && state !== 'progress-status') return false;
    if (filter === 'served' && state !== 'served') return false;
    if (filter === 'minecraft' && !res.is_minecraft) return false;
    return normalize(`${res.prof_name} ${res.classroom || ''} ${res.justification || ''}`).includes(normalize(query.trim()));
  }), [rows, filter, userId, query, now]);
  const groups = useMemo(() => {
    const result = new Map<string, Reservation[]>();
    filtered.forEach(res => result.set(res.time_slot, [...(result.get(res.time_slot) || []), res]));
    return [...result].sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);
  let itemIndex = 0;
  return <div className="hx-list" aria-live="polite" aria-relevant="additions text">
    {filtered.length === 0 && <p className="hx-empty">Nada com esses filtros</p>}
    {groups.map(([slot, group]) => <section key={slot} aria-label={`Reservas das ${slot}`}>
      <div className="hx-slot"><time>{slot}</time>{!isManutencao && <span>{number(allRows.filter(res => res.time_slot === slot).reduce((sum, res) => sum + quantity(res), 0))} CBs</span>}</div>
      {group.map(res => {
        const state = status(res, now);
        const requested = quantity(res);
        const loans = collected(res);
        const { start, end } = interval(res);
        const displayName = (res.prof_name || 'Usuário').split('@')[0];
        const isMaintenanceReservation = maintenance(res);
        const fulfilled = (res.associated_loans?.length ?? 0) >= requested;
        const startingIn = differenceInMinutes(start, now);
        const showProgress = !isManutencao && !isMaintenanceReservation && requested > 0 && now >= start;
        const delay = `${Math.min(itemIndex++, 7) * 35}ms`;
        return <article key={res.id} className={`hx-reservation ${res.is_minecraft ? 'minecraft' : ''}`} style={{ '--hx-delay': delay } as HistoryStyle}>
          <button type="button" className="hx-open" onClick={() => onOpen(res)} aria-label={`Ver reserva de ${displayName}, ${res.classroom || 'sem sala'}, ${slot}`}>
            <div className="hx-res-top">
              <span className="hx-avatar" aria-hidden="true">{displayName.charAt(0).toUpperCase()}</span>
              <div className="hx-person"><strong>{displayName}</strong>{owned(res, userId) && <span className="hx-you">você</span>}
                <div className="hx-pills">
                  {res.classroom && <span className="hx-pill hx-room">{res.classroom}</span>}
                  {res.is_minecraft && <span className="hx-pill hx-mc">MINECRAFT</span>}
                  <span className={`hx-pill hx-${state}`}>{statusLabels[state]}</span>
                  {isSameDay(parseISO(res.date), now) && startingIn > 0 && startingIn <= 60 && <span className="hx-pill hx-pending"><Clock size={11} />Inicia em {startingIn}m</span>}
                  {isSameDay(parseISO(res.date), now) && state === 'progress-status' && <span className="hx-pill hx-progress-status"><Clock size={11} />{Math.max(1, differenceInMinutes(end, now))}m restantes</span>}
                </div>
              </div>
              {isMaintenanceReservation ? <span className="hx-maintenance">MANUTENÇÃO</span> : !isManutencao && <div className="hx-quantity"><strong>{number(requested)}</strong><small>CBs</small></div>}
            </div>
            {res.justification && <p className="hx-quote">“{res.justification}”</p>}
            {showProgress && <div><div className="hx-progress-label">{loans} de {requested} retirados</div><div className="hx-progress" role="progressbar" aria-label="Chromebooks retirados" aria-valuemin={0} aria-valuemax={requested} aria-valuenow={Math.min(requested, loans)}><div className="hx-progress-fill" style={{ '--hx-fill': `${Math.min(100, loans / requested * 100)}%` } as HistoryStyle} /></div></div>}
          </button>
          {!isManutencao && loans > 0 && <div className="hx-withdrawn"><span className="hx-caption">RETIRADOS · {loans}</span><div className="hx-ids">{res.associated_loans?.map((loan, i) => <span className="hx-id" key={`${loan.chromebook_id}-${i}`}>{loan.chromebook_id}</span>)}</div></div>}
          {isResponsible && !fulfilled && <div className="hx-action-row"><Button className="hx-control hx-start" onClick={() => onStart(res)}><ArrowRight size={15} />Iniciar</Button></div>}
        </article>;
      })}
    </section>)}
  </div>;
});

function Ranking({ title, entries }: { title: string; entries: [string, number][] }) {
  const max = entries[0]?.[1] || 1;
  return <section className="hx-card"><h3 className="hx-heading">{title}</h3>{entries.length === 0 ? <p className="hx-caption">Sem dados neste mês</p> : entries.map(([name, value]) => <div className="hx-rank" key={name}><div className="hx-rank-label"><span>{name}</span><strong>{value}</strong></div><div className="hx-rank-track"><div className="hx-rank-fill" style={{ '--hx-fill': `${value / max * 100}%` } as HistoryStyle} /></div></div>)}</section>;
}

export const SchedulingMonthView: React.FC<SchedulingMonthViewProps> = ({ currentDate, reservations, totalAvailableChromebooks, isLoading, onReservationSuccess, onNewReservation }) => {
  const navigate = useNavigate();
  const handleNewReservation = () => {
    if (onNewReservation) {
      onNewReservation(selectedDate);
    } else {
      navigate('/agendamento');
    }
  };
  const { user } = useAuth();
  const { role, isAdmin } = useProfileRole();
  const { isResponsible } = useSchedulingResponsible();
  const { deleteReservation } = useDatabase();
  const coordination = isAdmin || isResponsible;
  const isManutencao = role === 'manutencao';
  const [tab, setTab] = useState<'calendar' | 'analytics'>('calendar');
  const [selectedDate, setSelectedDate] = useState(startOfMonth(currentDate));
  const [filter, setFilter] = useState<Filter | null>(null);
  const [query, setQuery] = useState('');
  const [now, setNow] = useState(new Date());
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const monthKey = format(currentDate, 'yyyy-MM');
  const monthRows = useMemo(() => reservations.filter(res => res.date.startsWith(monthKey)), [reservations, monthKey]);
  const monthDays = useMemo(() => byDay(monthRows), [monthRows]);
  const scopedRows = useMemo(() => coordination ? monthRows : monthRows.filter(res => owned(res, user?.id)), [monthRows, coordination, user?.id]);
  const stats = useMemo(() => metrics(scopedRows, totalAvailableChromebooks, now), [scopedRows, totalAvailableChromebooks, now]);
  const previousMonth = subMonths(currentDate, 1);
  const previousStart = format(startOfMonth(previousMonth), 'yyyy-MM-dd');
  const previousEnd = format(endOfMonth(previousMonth), 'yyyy-MM-dd');
  const previousQuery = useQuery({ queryKey: ['reservations', 'prev-month', previousStart, previousEnd], queryFn: () => getReservationsForWeek(previousStart, previousEnd), staleTime: 5 * 60 * 1000, enabled: Boolean(user?.id) });
  const previousStats = useMemo(() => previousQuery.isSuccess && previousQuery.data ? metrics(coordination ? previousQuery.data : previousQuery.data.filter(res => owned(res, user?.id)), totalAvailableChromebooks, now) : null, [previousQuery.isSuccess, previousQuery.data, coordination, user?.id, totalAvailableChromebooks, now]);

  useEffect(() => {
    if (!document.getElementById('ag-fonts')) {
      const link = document.createElement('link');
      link.id = 'ag-fonts'; link.rel = 'stylesheet';
      link.href = 'https://fonts.googleapis.com/css2?family=Lexend:wght@400;600;800&family=Silkscreen&display=swap';
      document.head.appendChild(link);
    }
    const timer = window.setInterval(() => setNow(new Date()), 30000);
    return () => window.clearInterval(timer);
  }, []);
  // Wait for the new month's rows, without moving a date the user selected later.
  const initializedMonth = React.useRef('');
  useEffect(() => {
    if (isLoading || initializedMonth.current === monthKey) return;
    initializedMonth.current = monthKey;
    const today = new Date();
    const firstReserved = [...monthDays.keys()].sort()[0];
    setSelectedDate(isSameMonth(today, currentDate) ? startOfDay(today) : firstReserved ? parseISO(firstReserved) : startOfMonth(currentDate));
    setQuery('');
  }, [monthKey, monthDays, currentDate, isLoading]);

  const dateKey = format(selectedDate, 'yyyy-MM-dd');
  const dayRows = useMemo(() => monthDays.get(dateKey) || [], [monthDays, dateKey]);
  const dayPeak = useMemo(() => peak(dayRows), [dayRows]);
  const dayPast = startOfDay(selectedDate) < startOfDay(now);
  const today = isSameDay(selectedDate, now);
  const activeFilter = filter ?? (coordination ? 'all' : 'mine');
  const weekdays = useMemo(() => {
    const days = byDay(scopedRows);
    return [1, 2, 3, 4, 5].map(day => {
      const samples = [...days].filter(([date]) => getDay(parseISO(date)) === day).map(([, rows]) => rate(peak(rows), totalAvailableChromebooks));
      return samples.length ? samples.reduce((sum, value) => sum + value, 0) / samples.length : 0;
    });
  }, [scopedRows, totalAvailableChromebooks]);
  const rooms = useMemo(() => ranking(scopedRows, res => res.classroom || 'Não informado'), [scopedRows]);
  const professors = useMemo(() => ranking(scopedRows, res => res.prof_name), [scopedRows]);
  const start = startOfMonth(currentDate);
  const offset = getDay(start);
  const calendarDays = Array.from({ length: endOfMonth(currentDate).getDate() }, (_, i) => addDays(start, i));
  const kpis = [
    { label: coordination ? 'Reservas' : 'Minhas reservas', value: number(stats.count), previous: previousStats?.count, current: stats.count },
    ...(!isManutencao ? [{ label: 'Chromebooks-aula', value: number(stats.quantity), previous: previousStats?.quantity, current: stats.quantity }] : []),
    ...(coordination && !isManutencao ? [
      { label: 'Ocupação média', value: percent(stats.average) },
      { label: 'Pico do mês', value: number(stats.max.value), note: stats.max.date ? `dia ${parseISO(stats.max.date).getDate()}` : 'Sem reservas' },
    ] : []),
    ...(!isManutencao ? [{ label: 'Atendimento', value: percent(stats.attendance) }, { label: 'Não retiradas', value: number(stats.missed) }] : []),
    { label: 'Com Minecraft', value: number(stats.minecraft) },
  ];
  const openReservation = React.useCallback((res: Reservation) => { setSelectedReservation(res); setIsDetailsOpen(true); }, []);
  const startReservation = React.useCallback((res: Reservation) => navigate('/', { state: { fromScheduling: true, reservationData: { ...res, date: res.date, time_slot: res.time_slot } } }), [navigate]);
  const exportCsv = () => {
    const blob = new Blob([makeCsv(scopedRows, now)], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url; anchor.download = `historico-agendamentos-${monthKey}.csv`;
    document.body.appendChild(anchor); anchor.click(); anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return <div className="hx-root">
    <div className="hx-tabs" role="tablist" aria-label="Visões do histórico">
      <Button id="hx-calendar-tab" className="hx-control hx-tab" role="tab" aria-selected={tab === 'calendar'} aria-controls="hx-calendar-panel" tabIndex={tab === 'calendar' ? 0 : -1} onClick={() => setTab('calendar')} onKeyDown={event => { if (event.key === 'ArrowRight' || event.key === 'ArrowLeft' || event.key === 'End') { event.preventDefault(); setTab('analytics'); document.getElementById('hx-analytics-tab')?.focus(); } }}><CalendarDays size={17} />Calendário</Button>
      <Button id="hx-analytics-tab" className="hx-control hx-tab" role="tab" aria-selected={tab === 'analytics'} aria-controls="hx-analytics-panel" tabIndex={tab === 'analytics' ? 0 : -1} onClick={() => setTab('analytics')} onKeyDown={event => { if (event.key === 'ArrowRight' || event.key === 'ArrowLeft' || event.key === 'Home') { event.preventDefault(); setTab('calendar'); document.getElementById('hx-calendar-tab')?.focus(); } }}><BarChart3 size={17} />Análises</Button>
    </div>
    {tab === 'calendar' ? <div id="hx-calendar-panel" role="tabpanel" aria-labelledby="hx-calendar-tab" aria-busy={isLoading}>
      <div className="hx-kpis" aria-label="Indicadores do mês">{kpis.map(kpi => <div className="hx-kpi" key={kpi.label}><span className="hx-kpi-label">{kpi.label}</span><strong className="hx-kpi-value">{isLoading ? '—' : kpi.value}</strong>{'note' in kpi && <span className="hx-kpi-note">{kpi.note}</span>}{!isLoading && 'previous' in kpi && kpi.previous !== undefined && <Variation current={kpi.current} previous={kpi.previous} />}</div>)}</div>
      <div className="hx-layout">
        <section className="hx-card" aria-label="Calendário de ocupação"><h3 className="hx-heading">Ocupação por dia</h3>
          <div className="hx-calendar">{['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'].map(label => <span className="hx-weekday" key={label}>{label}</span>)}
            {Array.from({ length: offset }, (_, i) => <span key={`blank-${i}`} aria-hidden="true" />)}
            {calendarDays.map(day => {
              const key = format(day, 'yyyy-MM-dd');
              const rows = monthDays.get(key) || [];
              const dayRate = rate(peak(rows), totalAvailableChromebooks);
              const level = isManutencao ? 0 : heatLevel(dayRate);
              return <Button key={key} className={`hx-day ${isWeekend(day) ? 'weekend' : ''} ${isSameDay(day, now) ? 'today' : ''}`} data-level={level} aria-pressed={isSameDay(day, selectedDate)} aria-label={`${format(day, "d 'de' MMMM", { locale: ptBR })}, ${rows.length} reservas${isManutencao ? '' : `, pico de ${percent(dayRate)}`}`} onClick={() => setSelectedDate(day)}><span>{day.getDate()}</span><span className="hx-heat-track">{level > 0 && <span className="hx-heat" data-level={level} style={{ '--hx-fill': `${Math.max(18, Math.min(100, dayRate))}%` } as HistoryStyle} />}</span></Button>;
            })}
          </div>
          {!isManutencao && <><div className="hx-legend">{['até 29%', '30–74%', '75–99%', '100%'].map((label, i) => <span key={label}><i className="hx-swatch" data-level={i + 1} />{label}</span>)}</div><p className="hx-caption">Pico de uso do dia</p></>}
        </section>
        <section className="hx-card" aria-label="Reservas do dia">
          <div className="hx-day-header"><div><h3 className="hx-heading">{(() => { const label = format(selectedDate, "EEEE, d 'de' MMMM", { locale: ptBR }); return label.charAt(0).toUpperCase() + label.slice(1); })()}</h3><span className={`hx-pill ${today ? 'hx-live' : ''}`}>{today && <span className="hx-live-dot" />}{today ? 'Tempo real' : dayPast ? 'Dados históricos' : 'Agendado'}</span></div>{!dayPast && !isWeekend(selectedDate) && <Button className="hx-control hx-new" onClick={handleNewReservation}><Plus size={16} />Nova reserva</Button>}</div>
          {coordination && !isManutencao && <div className="hx-stats"><div className="hx-stat"><span>Total</span><strong>{number(totalAvailableChromebooks)}</strong></div><div className="hx-stat"><span>Pico de uso</span><strong>{number(dayPeak)}</strong></div><div className="hx-stat"><span>Saldo mín.</span><strong className={totalAvailableChromebooks - dayPeak <= 0 && dayPeak > 0 ? 'hx-danger' : ''}>{number(Math.max(0, totalAvailableChromebooks - dayPeak))}</strong></div></div>}
          <div className="hx-chips" role="group" aria-label="Filtrar reservas">{filters.map(item => <Button key={item.value} className="hx-control hx-chip" aria-pressed={activeFilter === item.value} onClick={() => setFilter(item.value)}>{item.label}</Button>)}</div>
          <div className="hx-search"><Search size={16} /><input type="search" aria-label="Buscar professor, sala ou conteúdo" placeholder="Buscar professor, sala ou conteúdo" value={query} onChange={event => setQuery(event.target.value)} /></div>
          {isLoading ? <p className="hx-empty" role="status">Carregando reservas…</p> : dayRows.length === 0 ? <div className="hx-empty" role="status">{isWeekend(selectedDate) ? 'Sem aulas aos fins de semana' : 'Nenhuma reserva neste dia'}</div> : <ReservationList rows={dayRows} allRows={dayRows} filter={activeFilter} query={query} now={now} userId={user?.id} isManutencao={isManutencao} isResponsible={isResponsible} onOpen={openReservation} onStart={startReservation} />}
        </section>
      </div>
    </div> : <div id="hx-analytics-panel" role="tabpanel" aria-labelledby="hx-analytics-tab" aria-busy={isLoading}>
      <div className="hx-analysis-header"><Button className="hx-control hx-export" disabled={isLoading} onClick={exportCsv}><Download size={16} />Exportar CSV</Button></div>
      {isLoading ? <p className="hx-empty" role="status">Carregando análises…</p> : <div className="hx-analysis-grid">
        {!isManutencao && <section className="hx-card"><h3 className="hx-heading">Ocupação média por dia da semana</h3><div className="hx-chart" role="img" aria-label={weekdays.map((value, i) => `${['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'][i]}: ${percent(value)}`).join(', ')}>{weekdays.map((value, i) => <div className="hx-bar-column" key={i}><strong>{percent(value)}</strong><div className="hx-bar-track"><div className="hx-bar" style={{ '--hx-fill': `${Math.min(100, value)}%` } as HistoryStyle} /></div><span>{['SEG', 'TER', 'QUA', 'QUI', 'SEX'][i]}</span></div>)}</div></section>}
        {!isManutencao && <section className="hx-card"><h3 className="hx-heading">Retirada dos Chromebooks</h3><div className="hx-donut-row"><div className={`hx-donut ${stats.past === 0 ? 'empty' : ''}`} role="img" aria-label={`${stats.served} atendidas, ${stats.partial} parciais, ${stats.missed} não retiradas`} style={{ '--hx-served-stop': `${stats.past ? stats.served / stats.past * 100 : 0}%`, '--hx-partial-stop': `${stats.past ? (stats.served + stats.partial) / stats.past * 100 : 0}%` } as HistoryStyle}><div className="hx-donut-center"><strong>{percent(stats.attendance)}</strong><span>de atendimento</span></div></div><div className="hx-donut-legend"><span><i className="hx-dot" />Atendidas <strong>{stats.served}</strong></span><span><i className="hx-dot partial" />Parciais <strong>{stats.partial}</strong></span><span><i className="hx-dot missed" />Não retiradas <strong>{stats.missed}</strong></span></div></div>{stats.past === 0 && <p className="hx-caption">Nenhuma reserva encerrada com Chromebooks</p>}</section>}
        <Ranking title="Salas mais usadas" entries={rooms} />
        {coordination && <Ranking title="Professores que mais reservam" entries={professors} />}
      </div>}
    </div>}
    {selectedReservation && <ReservationDetailsDialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen} reservation={selectedReservation} date={parseISO(selectedReservation.date)} isAdmin={Boolean(isAdmin)} isResponsible={Boolean(isResponsible)} isOwner={owned(selectedReservation, user?.id)} onCancel={() => { deleteReservation(selectedReservation.id).then((success: boolean) => { if (success) { onReservationSuccess?.(); setIsDetailsOpen(false); setSelectedReservation(null); } }); }} />}
  </div>;
};
