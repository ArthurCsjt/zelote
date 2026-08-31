import { format, parseISO, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/**
 * Faz o parsing de datas de forma segura no fuso local.
 * Se a string for no formato 'YYYY-MM-DD', evita a conversão para UTC meia-noite
 * que causaria o recuo de 1 dia em fusos negativos (como Brasil UTC-3).
 */
export function parseLocalDate(dateInput: string | Date | null | undefined): Date | null {
  if (!dateInput) return null;

  if (dateInput instanceof Date) {
    return isValid(dateInput) ? dateInput : null;
  }

  const str = String(dateInput).trim();

  // Caso seja formato de data simples 'YYYY-MM-DD'
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    const [year, month, day] = str.split('-').map(Number);
    const localDate = new Date(year, month - 1, day, 12, 0, 0); // Meio-dia local para evitar qualquer desvio
    return isValid(localDate) ? localDate : null;
  }

  // Para ISO timestamps completos
  try {
    const parsed = parseISO(str);
    return isValid(parsed) ? parsed : new Date(str);
  } catch {
    const fallback = new Date(str);
    return isValid(fallback) ? fallback : null;
  }
}

/**
 * Formata datas de forma segura sem risco de regressão de 1 dia no fuso horário.
 */
export function formatLocalDate(
  dateInput: string | Date | null | undefined,
  formatPattern: string = 'dd/MM/yyyy'
): string {
  const parsed = parseLocalDate(dateInput);
  if (!parsed || !isValid(parsed)) return 'Data não informada';

  return format(parsed, formatPattern, { locale: ptBR });
}

/**
 * Formata um timestamp completo para envio ao banco preservando o fuso horário local.
 */
export function formatISOLocal(date: Date | null | undefined): string | undefined {
  if (!date || !isValid(date)) return undefined;

  try {
    return format(date, "yyyy-MM-dd'T'HH:mm:ssXXX");
  } catch {
    return date.toISOString();
  }
}
