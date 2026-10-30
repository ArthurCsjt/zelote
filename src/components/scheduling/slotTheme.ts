import type { Reservation } from '@/hooks/useDatabase';

export type SlotTheme = 'minecraft' | 'maker' | 'arts';

const normalize = (value?: string | null) =>
  (value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

export const getSlotTheme = (res: Pick<Reservation, 'classroom' | 'is_minecraft'>): SlotTheme | null => {
  if (res.is_minecraft) return 'minecraft';
  const room = normalize(res.classroom);
  if (room.includes('maker')) return 'maker';
  if (room.includes('artes')) return 'arts';
  return null;
};
