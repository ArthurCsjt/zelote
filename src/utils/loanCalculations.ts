import { differenceInDays, differenceInHours, differenceInMinutes } from 'date-fns';

/**
 * Calcula a duração do empréstimo em dias
 * @param loanDate Data do empréstimo
 * @param returnDate Data de devolução (opcional, usa data atual se não fornecida)
 * @returns Número de dias do empréstimo
 */
export function calculateLoanDuration(loanDate: Date | string, returnDate?: Date | string): number {
    const loan = typeof loanDate === 'string' ? new Date(loanDate) : loanDate;
    const returnOrNow = returnDate
        ? (typeof returnDate === 'string' ? new Date(returnDate) : returnDate)
        : new Date();

    return differenceInDays(returnOrNow, loan);
}

/**
 * Verifica se o empréstimo está atrasado
 * @param expectedReturnDate Data esperada de devolução
 * @returns true se estiver atrasado, false caso contrário
 */
export function isOverdue(expectedReturnDate?: Date | string | null): boolean {
    if (!expectedReturnDate) return false;

    const expected = typeof expectedReturnDate === 'string'
        ? new Date(expectedReturnDate)
        : expectedReturnDate;

    return new Date() > expected;
}

/**
 * Calcula quantos dias de atraso
 * @param expectedReturnDate Data esperada de devolução
 * @returns Número de dias de atraso (0 se não estiver atrasado)
 */
export function calculateOverdueDays(expectedReturnDate: Date | string): number {
    const expected = typeof expectedReturnDate === 'string'
        ? new Date(expectedReturnDate)
        : expectedReturnDate;

    const now = new Date();

    if (now <= expected) return 0;

    return differenceInDays(now, expected);
}

/**
 * Formata a duração de forma legível
 * @param days Número de dias
 * @returns String formatada (ex: "3 dias", "1 dia", "menos de 1 dia")
 */
export function formatDuration(days: number): string {
    if (days === 0) return 'menos de 1 dia';
    if (days === 1) return '1 dia';
    return `${days} dias`;
}

/**
 * Formata a duração com mais detalhes para períodos curtos
 * @param loanDate Data do empréstimo
 * @param returnDate Data de devolução (opcional)
 * @returns String formatada com horas/minutos se for menos de 1 dia
 */
export function formatDetailedDuration(loanDate: Date | string, returnDate?: Date | string): string {
    const loan = typeof loanDate === 'string' ? new Date(loanDate) : loanDate;
    const returnOrNow = returnDate
        ? (typeof returnDate === 'string' ? new Date(returnDate) : returnDate)
        : new Date();

    const days = differenceInDays(returnOrNow, loan);

    if (days >= 1) {
        return formatDuration(days);
    }

    const hours = differenceInHours(returnOrNow, loan);
    if (hours >= 1) {
        return hours === 1 ? '1 hora' : `${hours} horas`;
    }

    const minutes = differenceInMinutes(returnOrNow, loan);
    if (minutes < 1) return 'agora mesmo';
    return minutes === 1 ? '1 minuto' : `${minutes} minutos`;
}

/**
 * Retorna a cor do badge baseado no status de atraso
 * @param expectedReturnDate Data esperada de devolução
 * @param daysUntilDue Dias até o vencimento para considerar "próximo"
 * @returns Variante do badge: 'success' | 'warning' | 'destructive' | 'default'
 */
export function getOverdueStatusVariant(
    expectedReturnDate?: Date | string | null,
    daysUntilDue: number = 2
): 'success' | 'warning' | 'destructive' | 'default' {
    if (!expectedReturnDate) return 'default';

    const expected = typeof expectedReturnDate === 'string'
        ? new Date(expectedReturnDate)
        : expectedReturnDate;

    const now = new Date();
    const daysRemaining = differenceInDays(expected, now);

    if (daysRemaining < 0) return 'destructive'; // Atrasado
    if (daysRemaining <= daysUntilDue) return 'warning'; // Próximo do vencimento
    return 'success'; // No prazo
}

/**
 * Retorna mensagem de status do empréstimo
 * @param expectedReturnDate Data esperada de devolução
 * @returns Mensagem descritiva do status
 */
export function getOverdueStatusMessage(expectedReturnDate?: Date | string | null): string {
    if (!expectedReturnDate) return 'Sem prazo definido';

    const expected = typeof expectedReturnDate === 'string'
        ? new Date(expectedReturnDate)
        : expectedReturnDate;

    const now = new Date();
    const daysRemaining = differenceInDays(expected, now);

    if (daysRemaining < 0) {
        const overdueDays = Math.abs(daysRemaining);
        return `Atrasado ${overdueDays} ${overdueDays === 1 ? 'dia' : 'dias'}`;
    }

    if (daysRemaining === 0) return 'Vence hoje';
    if (daysRemaining === 1) return 'Vence amanhã';
    if (daysRemaining <= 2) return `Vence em ${daysRemaining} dias`;

    return 'No prazo';
}
