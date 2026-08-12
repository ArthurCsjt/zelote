/**
 * Utilitário de validação de domínios de email
 * Centraliza as regras de validação de email por tipo de usuário
 */

export const EMAIL_DOMAINS = {
  ALUNO: ['@sj.g12.br'],
  PROFESSOR: ['@sj.pro.br', '@colegiosaojudas.com.br'],
  FUNCIONARIO: ['@colegiosaojudas.com.br', '@sj.pro.br'],
} as const;

// Domínios institucionais gerais permitidos no sistema
export const INSTITUTIONAL_DOMAINS = ['@colegiosaojudas.com.br', '@sj.pro.br', '@sj.g12.br'];

export type UserType = 'aluno' | 'professor' | 'funcionario';

export interface EmailValidationResult {
  valid: boolean;
  message?: string;
}

/**
 * Valida se um email termina com um dos domínios permitidos para o tipo de usuário
 */
export function validateEmailDomain(
  email: string,
  userType: UserType
): EmailValidationResult {
  if (!email || typeof email !== 'string') {
    return {
      valid: false,
      message: 'Email é obrigatório',
    };
  }

  const normalizedEmail = email.trim().toLowerCase();
  const domains = EMAIL_DOMAINS[userType.toUpperCase() as keyof typeof EMAIL_DOMAINS];

  const isValid = domains.some(domain => normalizedEmail.endsWith(domain.toLowerCase()));

  if (!isValid) {
    const userTypeLabel = {
      aluno: 'aluno',
      professor: 'professor',
      funcionario: 'funcionário',
    }[userType];

    return {
      valid: false,
      message: `Email de ${userTypeLabel} deve terminar com ${domains.join(' ou ')}`,
    };
  }

  return { valid: true };
}

/**
 * Retorna o domínio de email principal esperado para um tipo de usuário
 */
export function getEmailDomain(userType: UserType): string {
  return EMAIL_DOMAINS[userType.toUpperCase() as keyof typeof EMAIL_DOMAINS][0];
}

/**
 * Extrai o tipo de usuário baseado no domínio do email
 */
export function getUserTypeFromEmail(email: string): UserType | null {
  const normalizedEmail = email.trim().toLowerCase();

  if (EMAIL_DOMAINS.ALUNO.some(d => normalizedEmail.endsWith(d.toLowerCase()))) {
    return 'aluno';
  }
  if (EMAIL_DOMAINS.PROFESSOR.some(d => normalizedEmail.endsWith(d.toLowerCase()))) {
    return 'professor';
  }
  if (EMAIL_DOMAINS.FUNCIONARIO.some(d => normalizedEmail.endsWith(d.toLowerCase()))) {
    return 'funcionario';
  }

  return null;
}

/**
 * Valida formato básico de email
 */
export function isValidEmailFormat(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Validação completa de email (formato + domínio)
 */
export function validateEmail(
  email: string,
  userType: UserType
): EmailValidationResult {
  if (!isValidEmailFormat(email)) {
    return {
      valid: false,
      message: 'Formato de email inválido',
    };
  }

  return validateEmailDomain(email, userType);
}

/**
 * Valida se o email pertence a qualquer domínio institucional permitido
 */
export function isInstitutionalEmail(email: string): boolean {
  const normalizedEmail = email.trim().toLowerCase();
  return INSTITUTIONAL_DOMAINS.some(d => normalizedEmail.endsWith(d.toLowerCase()));
}
