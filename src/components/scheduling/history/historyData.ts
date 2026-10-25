import { addMinutes, parseISO } from 'date-fns';
import type { Reservation } from '@/services/reservationService';

export type HistoryStatus = 'pending' | 'progress-status' | 'served' | 'partial' | 'missed';
export const statusLabels: Record<HistoryStatus, string> = {
  pending: 'Pendente', 'progress-status': 'Em curso', served: 'Atendida', partial: 'Parcial', missed: 'Não retirada',
};
export const quantity = (reservation: Reservation) => Math.max(0, reservation.quantity_requested || 0);
export const collected = (reservation: Reservation) => reservation.associated_loans?.length || 0;
export const owned = (reservation: Reservation, userId?: string) => Boolean(userId && (reservation.professor_id === userId || reservation.created_by === userId));
export const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
export function interval(reservation: Reservation) {
  const parts = reservation.time_slot.replace('h', ':').split(':');
  const start = parseISO(`${reservation.date}T${parts[0]}:${parts[1]}:00`);
  return { start, end: addMinutes(start, 50) };
}
export function status(reservation: Reservation, now: Date): HistoryStatus {
  const requested = quantity(reservation);
  const loans = collected(reservation);
  const { start, end } = interval(reservation);
  if ((requested > 0 && loans >= requested) || (requested === 0 && now >= end)) return 'served';
  if (now < start) return 'pending';
  if (now < end) return 'progress-status';
  return loans > 0 ? 'partial' : 'missed';
}
export function peak(reservations: Reservation[]) {
  const slots = new Map<string, number>();
  reservations.forEach(res => slots.set(res.time_slot, (slots.get(res.time_slot) || 0) + quantity(res)));
  return Math.max(0, ...slots.values());
}
export function byDay(reservations: Reservation[]) {
  const days = new Map<string, Reservation[]>();
  reservations.forEach(res => days.set(res.date, [...(days.get(res.date) || []), res]));
  return days;
}
export const rate = (usage: number, total: number) => total > 0 ? usage / total * 100 : 0;
export const heatLevel = (value: number) => value <= 0 ? 0 : value < 30 ? 1 : value < 75 ? 2 : value < 100 ? 3 : 4;
export function metrics(reservations: Reservation[], total: number, now: Date) {
  const peaks = [...byDay(reservations)].map(([date, rows]) => ({ date, value: peak(rows) }));
  const max = peaks.reduce((best, entry) => entry.value > best.value ? entry : best, { date: '', value: 0 });
  const past = reservations.filter(res => quantity(res) > 0 && interval(res).end <= now);
  const served = past.filter(res => status(res, now) === 'served').length;
  const partial = past.filter(res => status(res, now) === 'partial').length;
  const missed = past.filter(res => status(res, now) === 'missed').length;
  return {
    count: reservations.length, quantity: reservations.reduce((sum, res) => sum + quantity(res), 0),
    average: peaks.length ? peaks.reduce((sum, entry) => sum + rate(entry.value, total), 0) / peaks.length : 0,
    max, past: past.length, served, partial, missed,
    attendance: past.length ? served / past.length * 100 : 0,
    minecraft: reservations.filter(res => res.is_minecraft).length,
  };
}
export function ranking(reservations: Reservation[], key: (res: Reservation) => string) {
  const counts = new Map<string, number>();
  reservations.forEach(res => { const name = key(res) || 'Não informado'; counts.set(name, (counts.get(name) || 0) + 1); });
  return [...counts].sort((a, b) => b[1] - a[1]).slice(0, 5);
}
export function csvCell(value: unknown) {
  let text = String(value ?? '');
  if (/^[\s]*[=+@-]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}
export function makeCsv(reservations: Reservation[], now: Date) {
  const header = ['data', 'horário', 'professor', 'e-mail', 'sala', 'chromebooks', 'retirados', 'status', 'minecraft', 'justificativa'];
  const rows = reservations.map(res => [res.date, res.time_slot, res.prof_name, res.prof_email, res.classroom || '', quantity(res), collected(res), statusLabels[status(res, now)], res.is_minecraft ? 'Sim' : 'Não', res.justification]);
  return '\uFEFF' + [header, ...rows].map(row => row.map(csvCell).join(';')).join('\r\n');
}
