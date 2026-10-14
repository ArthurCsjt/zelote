import { useQuery } from '@tanstack/react-query';
import { getReservationsForWeek, getSpaces } from '@/services/reservationService';

export const reservationKeys = {
  all: ['reservations'] as const,
  range: (startDate: string, endDate: string) => [...reservationKeys.all, 'range', startDate, endDate] as const,
  spaces: () => ['spaces'] as const,
};

export function useReservationsQuery(startDate: string, endDate: string, enabled = true) {
  return useQuery({
    queryKey: reservationKeys.range(startDate, endDate),
    queryFn: () => getReservationsForWeek(startDate, endDate),
    enabled: enabled && !!startDate && !!endDate,
    staleTime: 1000 * 60 * 2,
  });
}

export function useSpacesQuery() {
  return useQuery({
    queryKey: reservationKeys.spaces(),
    queryFn: getSpaces,
    staleTime: 1000 * 60 * 10,
  });
}
