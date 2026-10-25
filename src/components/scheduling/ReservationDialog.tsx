// @ts-nocheck
import React, { useState, ReactNode, useEffect, useRef, useMemo, useLayoutEffect, useCallback } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { motion, AnimatePresence, useDragControls, useReducedMotion } from 'framer-motion';
import { Loader2, X as CloseIcon, Plus, Minus, Search, Check, Tv, Volume2, Mic, User, Users, MapPin, CalendarDays, ChevronLeft, ChevronRight, ArrowRight, AlertTriangle, ChevronDown } from 'lucide-react';
import { format, isSaturday, isSunday, isSameDay, startOfDay, addDays, addWeeks, isBefore, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useQuery } from '@tanstack/react-query';
import { useDatabase, Reservation, Space } from '@/hooks/useDatabase';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useProfileRole } from '@/hooks/use-profile-role';
import { Calendar as CalendarUI } from '@/components/ui/calendar';
import { isChromebookSpace as checkChromebookSpace, timeSlots as ALL_SLOTS } from '@/utils/scheduling';
import { useSchedulingResponsible } from '@/hooks/useSchedulingResponsible';
import { soundEffects } from '@/utils/audioFeedback';
import { INITIAL_DEFAULT_SPACES, ACTIVE_CLASSROOM_MAP, getReservationsForSlots } from '@/services/reservationService';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import './reservation-dialog.css';

interface ExtendedSpace extends Space { isVirtual?: boolean; }

interface ReservationDialogProps {
  children: ReactNode;
  date: Date;
  timeSlot: string;
  totalAvailableChromebooks: number;
  currentReservations: Reservation[];
  onReservationSuccess: () => void;
  maxQuantity: number;
  professores?: { id: string; nome_completo: string }[];
}

const SEC_DELAYS = [0.12, 0.17, 0.22, 0.27, 0.32, 0.37, 0.42, 0.47];
const norm = (s: string) => (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const eqRoom = (a?: string, b?: string) => (a || '').trim().toLowerCase() === (b || '').trim().toLowerCase();
const joinPt = (arr: string[]) => arr.length <= 1 ? arr.join('') : `${arr.slice(0, -1).join(', ')} e ${arr[arr.length - 1]}`;
const shortRoom = (n: string) => (n || '').split(' - ')[0];
const roomGroup = (name: string) => {
  const n = name.trim().toUpperCase();
  if (n.startsWith('SALA') && !n.includes('GOOGLE') && !n.includes('MAKER')) return 0;
  if (['GOOGLE', 'MAKER', 'BIBLIOTECA', 'AUDITÓRIO', 'LABORATÓRIO', 'QUADRA'].some(k => n.includes(k))) return 1;
  return 2;
};

const Highlight: React.FC<{ text: string; q: string }> = ({ text, q }) => {
  const nq = norm(q.trim());
  if (!nq) return <>{text}</>;
  const nt = Array.from(text).map(c => norm(c)).join('');
  const i = nt.indexOf(nq);
  if (i < 0) return <>{text}</>;
  return <>{text.slice(0, i)}<mark>{text.slice(i, i + nq.length)}</mark>{text.slice(i + nq.length)}</>;
};

const Creeper = () => (
  <svg width="32" height="32" viewBox="0 0 8 8" shapeRendering="crispEdges" aria-hidden="true" style={{ border: '2px solid #15110c', flexShrink: 0 }}>
    <rect width="8" height="8" fill="#5bb83a" />
    <rect x="1" y="2" width="2" height="2" fill="#000" /><rect x="5" y="2" width="2" height="2" fill="#000" />
    <rect x="3" y="4" width="2" height="1" fill="#000" /><rect x="2" y="5" width="4" height="2" fill="#000" />
    <rect x="2" y="7" width="1" height="1" fill="#000" /><rect x="5" y="7" width="1" height="1" fill="#000" />
  </svg>
);

const Sheet: React.FC<{ onClose: () => void; label: string; children: ReactNode }> = ({ onClose, label, children }) => {
  const controls = useDragControls();
  return (
    <>
      <motion.div className="ag-sheet-back" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
      <motion.div
        className="ag-sheet" role="dialog" aria-label={label}
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%', transition: { duration: 0.2 } }}
        transition={{ duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }}
        drag="y" dragControls={controls} dragListener={false} dragConstraints={{ top: 0, bottom: 0 }} dragElastic={{ top: 0, bottom: 1 }}
        onDragEnd={(_, info) => { if (info.offset.y > 110) onClose(); }}
      >
        <div className="ag-grip" onPointerDown={e => controls.start(e)} aria-hidden="true"><span /></div>
        {children}
      </motion.div>
    </>
  );
};

const Section = ({ n, title, done: ok, optional, innerRef, children: c, className = '' }: any) => {
    return (
      <section className={`ag-sec ag-rise ${className}`} style={{ animationDelay: `${SEC_DELAYS[Math.min(n - 1, 7)]}s` }} ref={innerRef}>
        <div className="ag-sec-h">
          <span className={`ag-num ${ok ? 'done' : ''}`} aria-hidden="true">{ok ? <Check size={16} strokeWidth={3} /> : n}</span>
          <h3 className="ag-sec-t">{title}</h3>
          {optional && <span className="ag-opt">Opcional</span>}
        </div>
        {c}
      </section>
    );
  };


export const ReservationDialog: React.FC<ReservationDialogProps> = ({
  children, date, timeSlot, totalAvailableChromebooks, currentReservations, onReservationSuccess, maxQuantity, professores = [],
}) => {
  const reduce = useReducedMotion();
  useEffect(() => {
    if (document.getElementById('ag-fonts')) return;
    const l = document.createElement('link');
    l.id = 'ag-fonts'; l.rel = 'stylesheet';
    l.href = 'https://fonts.googleapis.com/css2?family=Lexend:wght@400;600;800&family=Silkscreen&display=swap';
    document.head.appendChild(l);
  }, []);

  const [open, setOpen] = useState(false);
  const { createReservation, bulkCreateReservations, loading: isSaving, getSpaces } = useDatabase();
  const { subscribeToPush } = usePushNotifications();
  const { user } = useAuth();
  const { role, isAdmin } = useProfileRole();
  const isManutencao = role === 'manutencao';
  const { isResponsible } = useSchedulingResponsible();
  const canBookForOther = (isAdmin || isResponsible) && professores && professores.length > 0;

  const [selectedProfessorId, setSelectedProfessorId] = useState('');
  const [isBookingForOther, setIsBookingForOther] = useState(false);
  const [justification, setJustification] = useState('');
  const [quantity, setQuantity] = useState(0);
  const [qtyText, setQtyText] = useState('0');
  const [needsTv, setNeedsTv] = useState(false);
  const [needsSound, setNeedsSound] = useState(false);
  const [needsMic, setNeedsMic] = useState(false);
  const [micQuantity, setMicQuantity] = useState(1);
  const [isMinecraft, setIsMinecraft] = useState(false);
  const [classroom, setClassroom] = useState('');
  const [hasInteractedQuantity, setHasInteractedQuantity] = useState(false);
  const [extraDates, setExtraDates] = useState<Date[]>([]);
  const [isMultiMode, setIsMultiMode] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [lessons, setLessons] = useState(1);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [sheet, setSheet] = useState<null | 'room' | 'prof'>(null);
  const [query, setQuery] = useState('');
  const [done, setDone] = useState<null | { rows: [string, string][] }>(null);
  const [submitError, setSubmitError] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const submittingRef = useRef(false);
  const lastFocusRef = useRef<HTMLElement | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const refs = { prof: useRef<HTMLDivElement>(null), room: useRef<HTMLButtonElement>(null), roomAlert: useRef<HTMLDivElement>(null), qty: useRef<HTMLDivElement>(null), dates: useRef<HTMLDivElement>(null) };

  const isChromebookSpace = useMemo(() => checkChromebookSpace(classroom), [classroom]);

  // Salas recentes
  const RECENT_SPACES_KEY = 'zelote_recent_classrooms';
  const [recentClassrooms, setRecentClassrooms] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(RECENT_SPACES_KEY);
      if (!stored) return [];
      const parsed: string[] = JSON.parse(stored);
      const migrated = parsed.map(item => {
        const match = item.trim().toUpperCase().match(/^SALA\s*0?(\d+)$/);
        if (match) { const key = `SALA ${parseInt(match[1], 10)}`; return ACTIVE_CLASSROOM_MAP[key] || item; }
        return item;
      });
      try { localStorage.setItem(RECENT_SPACES_KEY, JSON.stringify(migrated)); } catch {}
      return migrated;
    } catch { return []; }
  });
  const saveRecentClassroom = (roomName: string) => {
    if (!roomName || !roomName.trim()) return;
    const clean = roomName.trim();
    setRecentClassrooms(prev => {
      const updated = [clean, ...prev.filter(r => r.toLowerCase() !== clean.toLowerCase())].slice(0, 5);
      try { localStorage.setItem(RECENT_SPACES_KEY, JSON.stringify(updated)); } catch {}
      return updated;
    });
  };

  const combinedSpaces = useMemo<ExtendedSpace[]>(() => {
    const mapped: ExtendedSpace[] = spaces.map(s => {
      const match = s.name.trim().toUpperCase().match(/^SALA\s*0?(\d+)$/);
      if (match) { const key = `SALA ${parseInt(match[1], 10)}`; if (ACTIVE_CLASSROOM_MAP[key]) return { ...s, name: ACTIVE_CLASSROOM_MAP[key] }; }
      return s;
    });
    const names = new Set(mapped.map(s => s.name.toLowerCase()));
    const virtual: ExtendedSpace[] = INITIAL_DEFAULT_SPACES.filter(n => !names.has(n.toLowerCase())).map((name, i) => ({
      id: `virtual-${i}`, name, color: name.includes('GOOGLE') ? '#3C8527' : name.includes('MAKER') ? '#8B5CF6' : '#3B82F6', isVirtual: true,
    }));
    return [...mapped, ...virtual].sort((a, b) => {
      const ga = roomGroup(a.name), gb = roomGroup(b.name);
      if (ga !== gb) return ga - gb;
      if (ga === 0) return (parseInt(a.name.replace(/\D/g, ''), 10) || 0) - (parseInt(b.name.replace(/\D/g, ''), 10) || 0);
      return a.name.trim().toUpperCase().localeCompare(b.name.trim().toUpperCase());
    });
  }, [spaces]);

  // Aulas seguidas
  const slotIdx = Math.max(0, ALL_SLOTS.indexOf(timeSlot));
  const maxLessons = Math.max(1, Math.min(4, ALL_SLOTS.length - slotIdx));
  const slots = useMemo(() => ALL_SLOTS.indexOf(timeSlot) < 0 ? [timeSlot] : ALL_SLOTS.slice(slotIdx, slotIdx + lessons), [timeSlot, slotIdx, lessons]);
  const mainDateStr = format(date, 'yyyy-MM-dd');
  const allDateStrs = useMemo(() => [mainDateStr, ...extraDates.map(d => format(d, 'yyyy-MM-dd'))], [mainDateStr, extraDates]);
  const needsFetch = open && (slots.length > 1 || extraDates.length > 0);
  const { data: fetched = [] } = useQuery({
    queryKey: ['reservations', 'slots', allDateStrs, slots],
    queryFn: () => getReservationsForSlots(allDateStrs, slots),
    enabled: needsFetch,
    staleTime: 30000,
  });
  const resFor = useCallback((d: string, s: string): Reservation[] => {
    if (d === mainDateStr && s === timeSlot) return currentReservations;
    return (fetched as any[]).filter(r => !r.deleted_at && r.date === d && r.time_slot === s);
  }, [mainDateStr, timeSlot, currentReservations, fetched]);

  const busySlotFor = useCallback((name: string, d = mainDateStr) => {
    if (!name.trim()) return null;
    return slots.find(s => resFor(d, s).some(r => eqRoom(r.classroom, name))) || null;
  }, [slots, resFor, mainDateStr]);

  const roomBusySlot = classroom ? busySlotFor(classroom) : null;
  const dateConflicts = useMemo(() => !classroom ? [] : extraDates.map(d => ({ d, slot: busySlotFor(classroom, format(d, 'yyyy-MM-dd')) })).filter(x => x.slot), [extraDates, classroom, busySlotFor]);

  const effectiveMax = useMemo(() => {
    let m = maxQuantity;
    for (const d of allDateStrs) for (const s of slots) {
      if (d === mainDateStr && s === timeSlot) continue;
      const used = resFor(d, s).reduce((a, r) => a + (r.quantity_requested || 0), 0);
      m = Math.min(m, totalAvailableChromebooks - used);
    }
    return Math.max(0, m);
  }, [maxQuantity, allDateStrs, slots, resFor, mainDateStr, timeSlot, totalAvailableChromebooks]);
  const qtyLimit = isMinecraft ? 40 : effectiveMax;
  const totalReserved = currentReservations.reduce((s, r) => s + (r.quantity_requested || 0), 0);

  const targetProfessorId = (isBookingForOther && selectedProfessorId) ? selectedProfessorId : user?.id;
  const profBusySlot = targetProfessorId ? slots.find(s => resFor(mainDateStr, s).some(r => r.professor_id === targetProfessorId)) : null;
  const selectedProf = professores.find(p => p.id === selectedProfessorId);

  const resetForm = () => {
    setJustification(''); setQuantity(0); setQtyText('0'); setHasInteractedQuantity(false);
    setNeedsTv(false); setNeedsSound(false); setNeedsMic(false); setMicQuantity(1); setIsMinecraft(false);
    setClassroom(''); setExtraDates([]); setIsMultiMode(false); setShowCalendar(false); setLessons(1);
    setSelectedProfessorId(user?.id || ''); setIsBookingForOther(false); setSheet(null); setQuery('');
    setDone(null); setSubmitError(''); submittingRef.current = false;
  };

  useEffect(() => {
    if (open) { resetForm(); getSpaces().then(data => setSpaces(data)); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, getSpaces, user?.id]);

  useEffect(() => { if (isMinecraft) { if (quantity === 0) setQuantity(1); if (quantity > 40) setQuantity(40); } }, [isMinecraft, quantity]);
  useEffect(() => { if (!isMinecraft && quantity > effectiveMax) setQuantity(effectiveMax); }, [effectiveMax, isMinecraft, quantity]);
  useEffect(() => { setQtyText(String(quantity)); }, [quantity]);
  useEffect(() => {
    if (!isChromebookSpace) { setNeedsTv(false); setNeedsSound(false); setNeedsMic(false); setMicQuantity(1); setIsMinecraft(false); }
  }, [isChromebookSpace]);

  const isExpired = date < new Date(new Date().setHours(0, 0, 0, 0));

  const isDateDisabledForRecurrence = (d: Date): boolean => {
    if (isSaturday(d) || isSunday(d)) return true;
    if (isBefore(d, startOfDay(new Date()))) return true;
    if (isSameDay(d, new Date())) {
      const [h, m] = timeSlot.split('h');
      const t = new Date(); t.setHours(parseInt(h, 10), parseInt(m, 10), 0, 0);
      if (new Date() >= t) return true;
    }
    if (format(d, 'yyyy-MM-dd') === mainDateStr) return true;
    return false;
  };
  const mergeDates = (newDates: Date[]) => setExtraDates(prev => {
    const ex = new Set(prev.map(d => format(d, 'yyyy-MM-dd')));
    return [...prev, ...newDates.filter(d => !ex.has(format(d, 'yyyy-MM-dd')))];
  });
  const handleAddSameWeekday = () => {
    const out: Date[] = []; let c = addWeeks(date, 1);
    const total = c > endOfMonth(date) ? 4 : 5;
    for (let i = 0; i < total; i++) { if (!isDateDisabledForRecurrence(c)) out.push(new Date(c)); c = addWeeks(c, 1); }
    mergeDates(out);
  };
  const handleAddNextSchoolDays = () => {
    const out: Date[] = []; let c = addDays(date, 1); let n = 0;
    while (out.length < 3 && n < 14) { if (!isDateDisabledForRecurrence(c)) out.push(new Date(c)); c = addDays(c, 1); n++; }
    mergeDates(out);
  };

  // Motivo de bloqueio
  const blockReason = (() => {
    if (isBookingForOther && !selectedProfessorId) return 'Escolha o professor para continuar';
    if (!classroom.trim()) return 'Escolha a sala para continuar';
    if (roomBusySlot) return 'Sala ocupada neste horário';
    if (!isManutencao && !hasInteractedQuantity) return 'Defina os Chromebooks para continuar';
    if (dateConflicts.length) return `Resolva ${dateConflicts.length} conflito${dateConflicts.length > 1 ? 's' : ''}`;
    return '';
  })();

  const guideKey = (() => {
    if (sheet || done) return null;
    if (isBookingForOther && !selectedProfessorId) return 'prof';
    if (!classroom.trim()) return 'room';
    if (roomBusySlot) return 'roomAlert';
    if (!isManutencao && !hasInteractedQuantity) return 'qty';
    if (dateConflicts.length) return 'dates';
    return null;
  })();
  const guideLabels = { prof: 'Escolha o professor', room: 'Escolha a sala', roomAlert: 'Troque a sala', qty: 'Defina os Chromebooks', dates: 'Resolva os conflitos' };
  const [guide, setGuide] = useState<{ top: number; visible: boolean } | null>(null);
  const calcGuide = useCallback(() => {
    const sc = scrollRef.current; const el = guideKey ? refs[guideKey]?.current : null;
    if (!sc || !el) { setGuide(g => g === null ? g : null); return; }
    const sr = sc.getBoundingClientRect(); const er = el.getBoundingClientRect();
    const top = er.top - sr.top + sc.scrollTop + Math.min(er.height, 64) / 2 - 14;
    const visible = er.top + 20 >= sr.top && er.top + 20 <= sr.bottom;
    setGuide(g => (g && Math.abs(g.top - top) < 1 && g.visible === visible) ? g : { top, visible });
  }, [guideKey]);
  useLayoutEffect(() => { calcGuide(); });
  useEffect(() => {
    if (!open) return;
    const fn = () => calcGuide();
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, [open, calcGuide]);
  const goToGuide = () => {
    const el = guideKey ? refs[guideKey]?.current : null;
    if (!el) return;
    el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
    const f = el.matches('button,input') ? el : el.querySelector('button,input');
    setTimeout(() => f?.focus({ preventScroll: true }), 300);
  };

  const openSheet = (k: 'room' | 'prof') => { lastFocusRef.current = document.activeElement as HTMLElement; setQuery(''); setSheet(k); };
  const closeSheet = () => { setSheet(null); setTimeout(() => lastFocusRef.current?.focus(), 50); };
  const pickRoom = (name: string) => { setClassroom(name); saveRecentClassroom(name); closeSheet(); };

  const commitQty = (v: number) => { setHasInteractedQuantity(true); setQuantity(Math.max(isMinecraft ? 1 : 0, Math.min(qtyLimit, v))); };

  const prettyDate = (() => { const s = format(date, 'EEE, dd MMM', { locale: ptBR }); return s.charAt(0).toUpperCase() + s.slice(1); })();
  const lessonsDesc = slots.length > 1 ? `${slots.length} aulas` : '';
  const qtyDesc = quantity === 0 ? 'Somente a sala' : `${quantity} Chromebooks`;
  const totalDays = 1 + extraDates.length;
  const summaryLine = [shortRoom(classroom), isBookingForOther && selectedProf ? selectedProf.nome_completo.split(' ')[0] : null,
    !isManutencao && hasInteractedQuantity ? (quantity === 0 ? 'Só a sala' : `${quantity} Chromebooks`) : null,
    lessonsDesc || null, totalDays > 1 ? `${totalDays} dias` : null].filter(Boolean).join(' · ');

  const handleSubmit = async () => {
    if (submittingRef.current || blockReason) return;
    if (quantity < 0 || quantity > (isMinecraft ? 40 : Math.max(maxQuantity, 0))) {
      setSubmitError('Quantidade de Chromebooks acima do disponível.'); return;
    }
    submittingRef.current = true; setSubmitError('');
    const matchedSpace = spaces.find(s => s.name.toLowerCase() === classroom.trim().toLowerCase());
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      subscribeToPush(true).catch(() => {});
    }
    const baseData = {
      time_slot: timeSlot, justification: justification.trim(), quantity_requested: quantity,
      needs_tv: needsTv, needs_sound: needsSound, needs_mic: needsMic, mic_quantity: needsMic ? micQuantity : 0,
      is_minecraft: isMinecraft, classroom: classroom.trim(), space_id: matchedSpace ? matchedSpace.id : null,
      professor_id: targetProfessorId,
      block_id: slots.length > 1 ? (crypto?.randomUUID ? crypto.randomUUID() : null) : null,
      time_slots: slots,
    };
    let ok = false;
    try {
      if (allDateStrs.length > 1 || slots.length > 1) {
        const { time_slots, ...rest } = baseData;
        const r = await bulkCreateReservations(allDateStrs, rest, slots);
        ok = r.success;
      } else {
        const { time_slots, block_id, ...rest } = baseData;
        const r = await createReservation({ ...rest, date: mainDateStr });
        ok = !!r;
      }
    } catch { ok = false; }
    submittingRef.current = false;
    if (!ok) { setSubmitError('Não foi possível salvar a reserva. Tente novamente.'); return; }
    saveRecentClassroom(classroom.trim());
    soundEffects.triggerSuccessFeedback();
    toast({
      title: totalDays > 1 || slots.length > 1 ? 'Agendamentos Confirmados!' : 'Agendamento Confirmado!',
      description: `${classroom.trim()} • ${quantity === 0 ? 'Apenas Sala' : `${quantity} Chromebooks`}${isMinecraft ? ' (Minecraft)' : ''}${extraDates.length ? ` (+${extraDates.length} datas extras)` : ''}`,
    });
    onReservationSuccess();
    const res = [needsTv && 'TV', needsSound && 'Som', needsMic && `Mic (${micQuantity})`].filter(Boolean).join(', ');
    const rows: [string, string][] = [['Sala', classroom.trim()]];
    if (isBookingForOther && selectedProf) rows.push(['Professor', selectedProf.nome_completo]);
    rows.push([slots.length > 1 ? 'Aulas' : 'Horário', joinPt(slots)]);
    if (!isManutencao) rows.push(['Chromebooks', quantity === 0 ? 'Somente a sala' : String(quantity)]);
    if (isMinecraft) rows.push(['Minecraft', 'Sim']);
    if (res) rows.push(['Recursos', res]);
    rows.push(['Datas', [date, ...extraDates].map(d => format(d, 'dd/MM')).join(', ')]);
    setDone({ rows });
  };

  // Seções
  let secN = 0;
  const filteredRooms = combinedSpaces.filter(s => !query.trim() || norm(s.name).includes(norm(query.trim())));
  const roomGroups = [['Salas de aula', 0], ['Espaços Especiais', 1], ['Outros', 2]].map(([t, g]) => ({ t, items: filteredRooms.filter(s => roomGroup(s.name) === g) })).filter(g => g.items.length);
  const filteredProfs = [...professores].sort((a, b) => a.nome_completo.localeCompare(b.nome_completo)).filter(p => !query.trim() || norm(p.nome_completo).includes(norm(query.trim())));
  const profGroups = Object.entries(filteredProfs.reduce((acc, p) => { const k = norm(p.nome_completo).charAt(0).toUpperCase() || '#'; (acc[k] = acc[k] || []).push(p); return acc; }, {} as Record<string, any[]>));
  const firstResult = sheet === 'room' ? filteredRooms[0] : filteredProfs[0];

  const inertProps = sheet ? { inert: '' } : {};

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <div onClick={() => !isExpired && setOpen(true)} className={`cursor-pointer h-full flex flex-col ${isExpired ? 'opacity-50 cursor-not-allowed grayscale' : ''}`}>
        {children}
      </div>
      <AnimatePresence>
        {open && (
          <DialogPrimitive.Portal forceMount>
            <DialogPrimitive.Overlay asChild forceMount>
              <motion.div className="ag-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { duration: reduce ? 0 : 0.28 } }} exit={{ opacity: 0, transition: { duration: reduce ? 0 : 0.2 } }} />
            </DialogPrimitive.Overlay>
            <DialogPrimitive.Content asChild forceMount aria-describedby={undefined}
              onEscapeKeyDown={e => { if (sheet) { e.preventDefault(); closeSheet(); } }}>
              <div className="ag-modal ag-wrap">
                <motion.div className="ag-card"
                  initial={reduce ? { opacity: 0 } : { opacity: 0, y: 40, scale: 0.94 }}
                  animate={{ opacity: 1, y: 0, scale: 1, transition: { duration: reduce ? 0 : 0.55, ease: [0.34, 1.4, 0.64, 1] } }}
                  exit={{ opacity: 0, y: reduce ? 0 : 20, scale: reduce ? 1 : 0.97, transition: { duration: reduce ? 0 : 0.2, ease: 'easeIn' } }}>
                  <header className={`ag-head ag-rise ${scrolled ? 'is-scrolled' : ''}`} style={{ animationDuration: '.4s', animationDelay: '.05s' }} {...inertProps}>
                    <div style={{ minWidth: 0 }}>
                      <DialogPrimitive.Title className="ag-title">Agendamento</DialogPrimitive.Title>
                      <span className="ag-pill">{prettyDate} · {timeSlot}{lessonsDesc ? ` · ${lessonsDesc}` : ''}</span>
                    </div>
                    <DialogPrimitive.Close className="ag-close" aria-label="Fechar"><CloseIcon size={20} strokeWidth={2.5} /></DialogPrimitive.Close>
                  </header>

                  {done ? (
                    <div className="ag-scroll" style={{ textAlign: 'center' }}>
                      <svg className="ag-ok-ico" viewBox="0 0 84 84" fill="none" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <circle cx="42" cy="42" r="36" /><path d="M26 43l11 11 21-23" />
                      </svg>
                      <h3 className="ag-sec-t ag-rise" style={{ fontSize: 20 }}>Reserva confirmada!</h3>
                      <p className="ag-muted ag-rise" style={{ margin: 0 }} aria-live="polite">Sua reserva já aparece na grade.</p>
                      <ul className="ag-list ag-rise" style={{ textAlign: 'left', animationDelay: '.12s' }}>
                        {done.rows.map(([k, v]) => <li key={k}><span>{k}</span><span>{v}</span></li>)}
                      </ul>
                    </div>
                  ) : (
                    <div className="ag-scroll" ref={scrollRef} onScroll={e => { setScrolled(e.currentTarget.scrollTop > 0); calcGuide(); }} {...inertProps}>
                      {guide && guide.visible && <div className="ag-guide" style={{ top: guide.top }} aria-hidden="true"><ArrowRight size={16} strokeWidth={3} /></div>}

                      {canBookForOther && (
                        <Section n={++secN} title="Reservar para" done={!isBookingForOther || !!selectedProfessorId} innerRef={refs.prof}>
                          <div className="ag-chips" role="group" aria-label="Reservar para">
                            <button type="button" className="ag-chip" aria-pressed={!isBookingForOther} onClick={() => { setIsBookingForOther(false); setSelectedProfessorId(user?.id || ''); }}><User size={16} />Para mim</button>
                            <button type="button" className="ag-chip" aria-pressed={isBookingForOther} onClick={() => { setIsBookingForOther(true); setSelectedProfessorId(''); openSheet('prof'); }}><Users size={16} />Outro professor</button>
                          </div>
                          {isBookingForOther && (
                            <button type="button" className={`ag-field ${selectedProf ? 'ok' : ''}`} style={{ marginTop: 10 }} onClick={() => openSheet('prof')}>
                              <span className="ag-av">{selectedProf ? selectedProf.nome_completo.charAt(0).toUpperCase() : <Search size={16} />}</span>
                              <span style={{ flex: 1, fontWeight: 700 }}>{selectedProf ? selectedProf.nome_completo : 'Buscar professor'}</span>
                              <span className="ag-link" as="span">{selectedProf ? 'Trocar' : <ChevronDown size={18} />}</span>
                            </button>
                          )}
                          {profBusySlot && (isBookingForOther ? !!selectedProf : true) && (
                            <div className="ag-alert warn" role="status"><AlertTriangle size={18} />{isBookingForOther && selectedProf ? selectedProf.nome_completo.split(' ')[0] : 'Você'} já tem aula às {profBusySlot}.</div>
                          )}
                        </Section>
                      )}

                      {ALL_SLOTS.includes(timeSlot) && maxLessons > 1 && (
                        <Section n={++secN} title="Aulas seguidas" done={true}>
                          <div className="ag-chips" role="group" aria-label="Quantidade de aulas seguidas">
                            {Array.from({ length: maxLessons }, (_, i) => i + 1).map(n => (
                              <button key={n} type="button" className="ag-chip" aria-pressed={lessons === n} onClick={() => setLessons(n)}>{n} {n === 1 ? 'aula' : 'aulas'}</button>
                            ))}
                          </div>
                          <p className="ag-muted" style={{ margin: '10px 0 0' }}>{slots.length > 1 ? `Aulas das ${joinPt(slots)}, seguidas.` : `Somente a aula das ${timeSlot}.`}</p>
                          {!canBookForOther && profBusySlot && <div className="ag-alert warn" role="status"><AlertTriangle size={18} />Você já tem aula às {profBusySlot}.</div>}
                        </Section>
                      )}

                      <Section n={++secN} title={isManutencao ? 'Espaço físico' : 'Sala ou turma'} done={!!classroom && !roomBusySlot}>
                        <button type="button" ref={refs.room} className={`ag-field ${classroom ? (roomBusySlot ? 'bad' : 'ok') : ''}`} onClick={() => openSheet('room')}>
                          <span className="ag-ico">{classroom && !roomBusySlot ? <Check size={20} strokeWidth={3} /> : <MapPin size={20} />}</span>
                          <span style={{ flex: 1, minWidth: 0 }}>
                            {classroom ? (<>
                              <span style={{ display: 'block', fontWeight: 800 }}>{shortRoom(classroom)}</span>
                              {classroom.includes(' - ') && <span className="ag-muted" style={{ display: 'block' }}>{classroom.split(' - ').slice(1).join(' - ')}</span>}
                              <span style={{ display: 'block', fontSize: 12, fontWeight: 700, color: roomBusySlot ? 'var(--ag-err)' : 'var(--ag-ok)' }}>
                                {roomBusySlot ? `Ocupada às ${roomBusySlot}` : slots.length > 1 ? `Livre nas ${slots.length} aulas` : `Livre às ${timeSlot}`}
                              </span>
                            </>) : (<>
                              <span style={{ display: 'block', fontWeight: 800 }}>Buscar sala ou turma</span>
                              <span className="ag-muted" style={{ display: 'block' }}>Digite o nome ou escolha na lista</span>
                            </>)}
                          </span>
                          {classroom && <span className="ag-link">Trocar</span>}
                        </button>
                        {roomBusySlot && (
                          <div className="ag-alert err" ref={refs.roomAlert} role="alert"><AlertTriangle size={18} />Sala ocupada às {roomBusySlot}.<button type="button" className="ag-btn-s" onClick={() => openSheet('room')}>Trocar sala</button></div>
                        )}
                        {recentClassrooms.length > 0 && (
                          <div style={{ marginTop: 12 }}>
                            <p className="ag-muted" style={{ margin: '0 0 8px', fontWeight: 700 }}>Recentes</p>
                            <div className="ag-chips" role="group" aria-label="Salas recentes">
                              {recentClassrooms.slice(0, 4).map(r => {
                                const busy = !!busySlotFor(r);
                                return <button key={r} type="button" className="ag-chip" aria-pressed={eqRoom(classroom, r)} onClick={() => { setClassroom(r); saveRecentClassroom(r); }}><span className={`ag-dot ${busy ? 'busy' : ''}`} aria-label={busy ? 'Ocupada' : 'Livre'} />{shortRoom(r)}</button>;
                              })}
                            </div>
                          </div>
                        )}
                      </Section>

                      {!isManutencao && (
                        <Section n={++secN} title="Chromebooks" done={hasInteractedQuantity} innerRef={refs.qty}>
                          <p className="ag-muted" style={{ margin: '0 0 10px' }}>
                            <b style={{ color: 'var(--ag-text)' }}>{effectiveMax}</b> livres {slots.length > 1 ? `nas ${slots.length} aulas` : `às ${timeSlot}`} · {totalReserved} reservados
                          </p>
                          <div className="ag-step">
                            <button type="button" aria-label="Diminuir" disabled={quantity <= (isMinecraft ? 1 : 0)} onClick={() => commitQty(quantity - 1)}><Minus size={22} strokeWidth={3} /></button>
                            <input type="number" inputMode="numeric" aria-label="Quantidade de Chromebooks" value={qtyText} min={isMinecraft ? 1 : 0} max={qtyLimit}
                              onChange={e => setQtyText(e.target.value)}
                              onBlur={() => { const v = parseInt(qtyText, 10); commitQty(isNaN(v) ? quantity : v); setQtyText(String(Math.max(isMinecraft ? 1 : 0, Math.min(qtyLimit, isNaN(v) ? quantity : v)))); }}
                              onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }} />
                            <button type="button" aria-label="Aumentar" disabled={quantity >= qtyLimit} onClick={() => commitQty(quantity + 1)}><Plus size={22} strokeWidth={3} /></button>
                          </div>
                          <div className="ag-chips" role="group" aria-label="Atalhos de quantidade" style={{ marginTop: 10 }}>
                            {!isMinecraft && <button type="button" className="ag-chip" aria-pressed={hasInteractedQuantity && quantity === 0} onClick={() => commitQty(0)}>Só a sala</button>}
                            {qtyLimit >= 15 && <button type="button" className="ag-chip" aria-pressed={hasInteractedQuantity && quantity === 15} onClick={() => commitQty(15)}>15</button>}
                            {qtyLimit >= 30 && <button type="button" className="ag-chip" aria-pressed={hasInteractedQuantity && quantity === 30} onClick={() => commitQty(30)}>30</button>}
                          </div>
                          <div className={`ag-sum ${hasInteractedQuantity && quantity > 0 ? 'purple' : ''}`} aria-live="polite">
                            {!hasInteractedQuantity ? 'Escolha a quantidade ou toque em “Só a sala”' : quantity > 0 ? `Sala + ${quantity} Chromebooks` : 'Somente a sala, sem Chromebooks'}
                          </div>
                        </Section>
                      )}

                      {!isManutencao && isChromebookSpace && (
                        <section className="ag-mc ag-pop" style={{ animationDelay: `${SEC_DELAYS[Math.min(secN++, 7)]}s` }}>
                          <div className="ag-mc-h"><Creeper /><h3>AULA COM MINECRAFT</h3></div>
                          <div className="ag-mc-b">
                            Habilite para utilizar o <b>Minecraft Education</b>. Exclusivo <b>Sala Google</b> (exige preparo prévio) · limite de <b>40 Chromebooks</b>.
                            <div className="ag-mc-btns" role="group" aria-label="Aula com Minecraft">
                              <button type="button" className="ag-mc-btn no" aria-pressed={!isMinecraft} onClick={() => setIsMinecraft(false)}>Não</button>
                              <button type="button" className="ag-mc-btn yes" aria-pressed={isMinecraft} onClick={() => { setIsMinecraft(true); setHasInteractedQuantity(true); }}>Sim</button>
                            </div>
                          </div>
                        </section>
                      )}

                      {!isManutencao && isChromebookSpace && (
                        <Section n={++secN} title="Recursos extras da sala" optional done={needsTv || needsSound || needsMic}>
                          <div className="ag-chips" role="group" aria-label="Recursos extras">
                            <button type="button" className="ag-chip" aria-pressed={needsTv} onClick={() => setNeedsTv(!needsTv)}><Tv size={16} />TV</button>
                            <button type="button" className="ag-chip" aria-pressed={needsSound} onClick={() => setNeedsSound(!needsSound)}><Volume2 size={16} />Som</button>
                            <button type="button" className="ag-chip" aria-pressed={needsMic} onClick={() => setNeedsMic(!needsMic)}><Mic size={16} />Mic</button>
                          </div>
                          {needsMic && (
                            <div className="ag-chips" role="group" aria-label="Quantidade de microfones" style={{ marginTop: 10, alignItems: 'center' }}>
                              <span className="ag-muted" style={{ fontWeight: 700 }}>Microfones:</span>
                              {[1, 2].map(n => <button key={n} type="button" className="ag-chip" aria-pressed={micQuantity === n} onClick={() => setMicQuantity(n)}>{n}</button>)}
                            </div>
                          )}
                        </Section>
                      )}

                      {!isManutencao && (
                        <Section n={++secN} title="Repetir em outros dias" optional done={extraDates.length > 0 && !dateConflicts.length} innerRef={refs.dates}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: -4 }}>
                            <span className="ag-muted" style={{ flex: 1 }}>Repetir esta reserva em mais datas</span>
                            <button type="button" role="switch" aria-checked={isMultiMode} aria-label="Repetir em outros dias" className="ag-switch"
                              onClick={() => { const v = !isMultiMode; setIsMultiMode(v); if (!v) { setExtraDates([]); setShowCalendar(false); } }} />
                          </div>
                          {isMultiMode && (
                            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                              <div className="ag-chips">
                                <button type="button" className="ag-chip" onClick={handleAddSameWeekday}>+ Toda {format(date, 'EEEE', { locale: ptBR })}</button>
                                <button type="button" className="ag-chip" onClick={handleAddNextSchoolDays}>+ Próximos 3 dias de aula</button>
                              </div>
                              <div className="ag-chips" aria-live="polite">
                                <span className="ag-chip" aria-pressed="true" style={{ cursor: 'default' }}>{format(date, 'dd/MM')}</span>
                                {[...extraDates].sort((a, b) => a.getTime() - b.getTime()).map(d => {
                                  const c = dateConflicts.find(x => isSameDay(x.d, d));
                                  return (
                                    <span key={d.toISOString()} className="ag-chip" style={c ? { borderColor: 'var(--ag-err)', color: 'var(--ag-err)', cursor: 'default' } : { cursor: 'default' }}>
                                      {format(d, 'dd/MM')}{c ? ` · ocupada ${c.slot}` : ''}
                                      <button type="button" aria-label={`Remover ${format(d, 'dd/MM')}`} onClick={() => setExtraDates(p => p.filter(x => !isSameDay(x, d)))} style={{ border: 0, background: 'none', color: 'inherit', cursor: 'pointer', minWidth: 28, minHeight: 28 }}>×</button>
                                    </span>
                                  );
                                })}
                              </div>
                              {dateConflicts.length > 0 && (
                                <div className="ag-alert err" role="alert"><AlertTriangle size={18} />{dateConflicts.length} data{dateConflicts.length > 1 ? 's' : ''} com a sala ocupada.
                                  <button type="button" className="ag-link" style={{ marginLeft: 'auto', color: 'inherit' }} onClick={() => setExtraDates(p => p.filter(d => !dateConflicts.some(x => isSameDay(x.d, d))))}>Remover</button></div>
                              )}
                              {!showCalendar ? (
                                <button type="button" className="ag-btn-s" onClick={() => setShowCalendar(true)} style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}><CalendarDays size={16} />Escolher no calendário</button>
                              ) : (
                                <div className="ag-cal" style={{ background: 'var(--ag-ctrl)', borderRadius: 16, border: '2px solid var(--ag-border)', padding: 8 }}>
                                  <CalendarUI
                                    mode="multiple" locale={ptBR} defaultMonth={date}
                                    selected={extraDates}
                                    onSelect={(ds: Date[] | undefined) => setExtraDates((ds || []).filter(d => !isDateDisabledForRecurrence(d)))}
                                    disabled={isDateDisabledForRecurrence}
                                    modifiers={{ main: date, busy: dateConflicts.map(x => x.d), off: (d: Date) => isSaturday(d) || isSunday(d) || isBefore(d, startOfDay(new Date())) }}
                                    modifiersClassNames={{ main: 'ag-d-main', busy: 'ag-d-busy', off: 'ag-d-off' }}
                                    classNames={{ nav_button: 'ag-cal-btn inline-flex items-center justify-center', day: 'ag-d', head_cell: 'ag-muted w-9 font-semibold text-[0.8rem]' }}
                                    components={{ IconLeft: () => <ChevronLeft size={18} />, IconRight: () => <ChevronRight size={18} /> }}
                                  />
                                  <div className="ag-chips" style={{ fontSize: 12, padding: '4px 6px', gap: 12 }}>
                                    <span><span className="ag-dot" style={{ display: 'inline-block', background: 'var(--ag-blue)' }} /> Dia principal</span>
                                    <span><span className="ag-dot" style={{ display: 'inline-block', background: 'var(--ag-sel-bg)' }} /> Extras</span>
                                    <span><span className="ag-dot busy" style={{ display: 'inline-block' }} /> Ocupado</span>
                                  </div>
                                  <button type="button" className="ag-primary" style={{ width: '100%', marginTop: 8 }} onClick={() => setShowCalendar(false)}>Concluir · {totalDays} datas</button>
                                </div>
                              )}
                            </div>
                          )}
                        </Section>
                      )}

                      <Section n={++secN} title="Conteúdo da aula" optional done={!!justification.trim()}>
                        <textarea className="ag-tx" maxLength={200} value={justification} onChange={e => setJustification(e.target.value)} placeholder="Ex.: Pesquisa sobre o sistema solar" aria-label="Conteúdo da aula" />
                        <div className="ag-muted" style={{ textAlign: 'right', fontSize: 12 }}>{justification.length}/200</div>
                      </Section>
                    </div>
                  )}

                  <footer className="ag-foot ag-rise" style={{ animationDuration: '.4s', animationDelay: '.52s' }} {...inertProps}>
                    {done ? (<>
                      <button type="button" className="ag-primary" onClick={() => resetForm()}>Nova reserva</button>
                      <DialogPrimitive.Close className="ag-secondary">Fechar</DialogPrimitive.Close>
                    </>) : (<>
                      {guideKey && guide && !guide.visible && (
                        <button type="button" className="ag-guide-fab" style={{ bottom: 'calc(100% + 10px)' }} onClick={goToGuide}>↓ {guideLabels[guideKey]}</button>
                      )}
                      {summaryLine && <div className="ag-muted" style={{ textAlign: 'center', fontWeight: 600 }} aria-live="polite">{summaryLine}</div>}
                      {submitError && <div className="ag-err-msg" role="alert">{submitError}</div>}
                      <button type="button" className="ag-primary" disabled={!!blockReason || isSaving} onClick={handleSubmit}>
                        {isSaving ? (<><Loader2 size={18} className="ag-spin" />Confirmando…</>) : blockReason || (totalDays > 1 ? `Confirmar reserva (${totalDays} dias)` : 'Confirmar reserva')}
                      </button>
                      <DialogPrimitive.Close className="ag-secondary">Cancelar</DialogPrimitive.Close>
                    </>)}
                  </footer>

                  <AnimatePresence>
                    {sheet && (
                      <Sheet key={sheet} onClose={closeSheet} label={sheet === 'room' ? 'Escolher sala' : 'Escolher professor'}>
                        <div className="ag-sh-top">
                          <div className="ag-search">
                            <Search size={18} style={{ color: 'var(--ag-text2)' }} />
                            <input autoFocus enterKeyHint="go" value={query} onChange={e => setQuery(e.target.value)}
                              placeholder={sheet === 'room' ? 'Buscar sala ou turma (ex.: Sala 37)' : 'Buscar professor'}
                              aria-label={sheet === 'room' ? 'Buscar sala ou turma' : 'Buscar professor'}
                              onKeyDown={e => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  if (sheet === 'room') pickRoom(firstResult ? firstResult.name : query.trim());
                                  else if (firstResult) { setSelectedProfessorId(firstResult.id); closeSheet(); }
                                }
                              }} />
                            {query && <button type="button" aria-label="Limpar busca" onClick={() => setQuery('')} style={{ border: 0, background: 'none', color: 'var(--ag-text2)', width: 36, height: 36, cursor: 'pointer' }}><CloseIcon size={16} /></button>}
                          </div>
                          {sheet === 'room' && recentClassrooms.length > 0 && !query && (
                            <div className="ag-chips" role="group" aria-label="Salas recentes">
                              {recentClassrooms.slice(0, 4).map(r => <button key={r} type="button" className="ag-chip" onClick={() => pickRoom(r)}><span className={`ag-dot ${busySlotFor(r) ? 'busy' : ''}`} />{shortRoom(r)}</button>)}
                            </div>
                          )}
                          <div className="ag-muted" aria-live="polite" style={{ fontSize: 12 }}>
                            {sheet === 'room' ? filteredRooms.length : filteredProfs.length} resultado{(sheet === 'room' ? filteredRooms.length : filteredProfs.length) === 1 ? '' : 's'}
                          </div>
                        </div>
                        <div className="ag-sh-list">
                          {sheet === 'room' ? (
                            roomGroups.length ? roomGroups.map(g => (
                              <div key={g.t} role="group" aria-label={g.t}>
                                <div className="ag-grp"><span>{g.t}</span><span>{g.items.length}</span></div>
                                {g.items.map(s => {
                                  const busy = busySlotFor(s.name);
                                  return (
                                    <button key={s.id} type="button" className="ag-item" onClick={() => pickRoom(s.name)}>
                                      <span className="ag-ico" style={{ width: 34, height: 34 }}><MapPin size={16} /></span>
                                      <span style={{ minWidth: 0 }}><Highlight text={s.name} q={query} /></span>
                                      <span className={`ag-tag ${busy ? 'busy' : ''}`}>{busy ? 'Ocupada' : 'Livre'}</span>
                                    </button>
                                  );
                                })}
                              </div>
                            )) : (
                              <div style={{ textAlign: 'center', padding: 24 }}>
                                <p className="ag-muted">Nenhuma sala encontrada.</p>
                                {query.trim() && <button type="button" className="ag-btn-s" onClick={() => pickRoom(query.trim())}>Usar “{query.trim()}”</button>}
                              </div>
                            )
                          ) : (
                            profGroups.length ? profGroups.map(([letter, list]) => (
                              <div key={letter} role="group" aria-label={letter}>
                                <div className="ag-grp"><span>{letter}</span><span>{list.length}</span></div>
                                {list.map(p => (
                                  <button key={p.id} type="button" className="ag-item" aria-pressed={selectedProfessorId === p.id} onClick={() => { setSelectedProfessorId(p.id); closeSheet(); }}>
                                    <span className="ag-av">{p.nome_completo.charAt(0).toUpperCase()}</span>
                                    <span><Highlight text={p.nome_completo} q={query} /></span>
                                    {selectedProfessorId === p.id && <Check size={18} style={{ marginLeft: 'auto', color: 'var(--ag-ok)' }} />}
                                  </button>
                                ))}
                              </div>
                            )) : <p className="ag-muted" style={{ textAlign: 'center', padding: 24 }}>Nenhum professor encontrado.</p>
                          )}
                        </div>
                      </Sheet>
                    )}
                  </AnimatePresence>
                </motion.div>
              </div>
            </DialogPrimitive.Content>
          </DialogPrimitive.Portal>
        )}
      </AnimatePresence>
    </DialogPrimitive.Root>
  );
};

export default ReservationDialog;
