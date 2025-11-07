import { startOfWeek, endOfWeek, eachDayOfInterval, format, addWeeks, subWeeks, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/**
 * Retorna o início da semana (Segunda-feira) para uma data dada.
 * @param date A data de referência.
 * @returns A data da Segunda-feira.
 */
export const getStartOfWeek = (date: Date): Date => {
  // startOfWeek com weekStartsOn: 1 (Segunda-feira)
  return startOfWeek(date, { weekStartsOn: 1 });
};

/**
 * Retorna o fim da semana (Sexta-feira) para uma data dada.
 * @param date A data de referência.
 * @returns A data da Sexta-feira.
 */
export const getEndOfWeek = (date: Date): Date => {
  const start = getStartOfWeek(date);
  // O intervalo de trabalho é de Segunda a Sexta (4 dias após a Segunda)
  return addDays(start, 4);
};

/**
 * Retorna um array de objetos Date para os dias úteis (Segunda a Sexta) da semana.
 * @param date A data de referência.
 * @returns Array de objetos Date.
 */
export const getWeekDays = (date: Date): Date[] => {
  const start = getStartOfWeek(date);
  const end = getEndOfWeek(date);
  return eachDayOfInterval({ start, end });
};

/**
 * Formata o intervalo de datas da semana para exibição no cabeçalho.
 * @param date A data de referência.
 * @returns String formatada (Ex: "Semana de 15 a 19 de Setembro").
 */
export const formatWeekRange = (date: Date): string => {
  const days = getWeekDays(date);
  if (days.length === 0) return 'Nenhuma semana selecionada';
  
  const startDay = format(days[0], 'dd', { locale: ptBR });
  const endDay = format(days[days.length - 1], 'dd', { locale: ptBR });
  const month = format(days[0], 'MMMM', { locale: ptBR });
  
  return `Semana de ${startDay} a ${endDay} de ${month.charAt(0).toUpperCase() + month.slice(1)}`;
};

/**
 * Avança ou retrocede uma semana.
 */
export const changeWeek = (currentDate: Date, direction: 'next' | 'prev'): Date => {
  return direction === 'next' ? addWeeks(currentDate, 1) : subWeeks(currentDate, 1);
};

/**
 * Slots de horário fixos baseados no mockup.
 */
export const timeSlots = [
  "07h10", "08h00", "08h50", "10h00", "10h50", "11h40", 
  "12h30", "13h10", "14h00", "14h50", "16h00", "16h50", "17h40"
];

// Função auxiliar para adicionar dias (necessária para getEndOfWeek)
const addDays = (date: Date, days: number): Date => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
};