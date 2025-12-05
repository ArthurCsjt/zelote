/**
 * Utilitário de validação de domínios de email
 * Centraliza as regras de validação de email por tipo de usuário
 */

export const EMAIL_DOMAINS = {
  ALUNO: '@sj.g12.br',
  PROFESSOR: '@sj.pro.br',
  FUNCIONARIO: '@colegiosaojudas.com.br',
} as const;

export type UserType = 'aluno' | 'professor' | 'funcionario';

export interface EmailValidationResult {
  valid: boolean;
  message?: string;
}

/**
 * Valida se um email termina com o domínio correto para o tipo de usuário
 * 
 * @param email - Email a ser validado
 * @param userType - Tipo de usuário (aluno, professor, funcionario)
 * @returns Objeto com resultado da validação e mensagem de erro se inválido
 * 
 * @example
 * ```typescript
 * const result = validateEmailDomain('joao@sj.g12.br', 'aluno');
 * if (!result.valid) {
 *   console.error(result.message);
 * }
 * ```
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
  const domain = EMAIL_DOMAINS[userType.toUpperCase() as keyof typeof EMAIL_DOMAINS];

  if (!normalizedEmail.endsWith(domain)) {
    const userTypeLabel = {
      aluno: 'aluno',
      professor: 'professor',
      funcionario: 'funcionário',
    }[userType];

    return {
      valid: false,
      message: `Email de ${userTypeLabel} deve terminar com ${domain}`,
    };
  }

  return { valid: true };
}

/**
 * Retorna o domínio de email esperado para um tipo de usuário
 * 
 * @param userType - Tipo de usuário
 * @returns Domínio de email (ex: '@sj.g12.br')
 */
export function getEmailDomain(userType: UserType): string {
  return EMAIL_DOMAINS[userType.toUpperCase() as keyof typeof EMAIL_DOMAINS];
}

/**
 * Extrai o tipo de usuário baseado no domínio do email
 * 
 * @param email - Email a ser analisado
 * @returns Tipo de usuário ou null se não reconhecido
 * 
 * @example
 * ```typescript
 * const type = getUserTypeFromEmail('joao@sj.g12.br');
 * console.log(type); // 'aluno'
 * ```
 */
export function getUserTypeFromEmail(email: string): UserType | null {
  const normalizedEmail = email.trim().toLowerCase();

  if (normalizedEmail.endsWith(EMAIL_DOMAINS.ALUNO)) {
    return 'aluno';
  }
  if (normalizedEmail.endsWith(EMAIL_DOMAINS.PROFESSOR)) {
    return 'professor';
  }
  if (normalizedEmail.endsWith(EMAIL_DOMAINS.FUNCIONARIO)) {
    return 'funcionario';
  }

  return null;
}

/**
 * Valida formato básico de email (RFC 5322 simplificado)
 * 
 * @param email - Email a ser validado
 * @returns true se o formato é válido
 */
export function isValidEmailFormat(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Validação completa de email (formato + domínio)
 * 
 * @param email - Email a ser validado
 * @param userType - Tipo de usuário
 * @returns Objeto com resultado da validação e mensagem de erro se inválido
 */
export function validateEmail(
  email: string,
  userType: UserType
): EmailValidationResult {
  // Validar formato básico
  if (!isValidEmailFormat(email)) {
    return {
      valid: false,
      message: 'Formato de email inválido',
    };
  }

  // Validar domínio
  return validateEmailDomain(email, userType);
}
