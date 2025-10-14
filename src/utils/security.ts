import DOMPurify from 'dompurify';

/**
 * Utilitários de segurança para sanitização de dados
 */

/**
 * Sanitiza uma string removendo tags HTML e scripts maliciosos
 */
export function sanitizeString(input: string): string {
  if (!input) return '';
  return DOMPurify.sanitize(input, { ALLOWED_TAGS: [] });
}

/**
 * Sanitiza HTML permitindo apenas tags seguras
 */
export function sanitizeHTML(input: string): string {
  if (!input) return '';
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
    ALLOWED_ATTR: []
  });
}

/**
 * Valida formato de email
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Valida se o email é do domínio da escola
 */
export function isSchoolEmail(email: string): boolean {
  if (!isValidEmail(email)) return false;
  const allowedDomains = [
    'colegiosaojudas.com.br',
    'escola.edu.br',
    'student.edu.br'
  ];
  
  const domain = email.split('@')[1]?.toLowerCase();
  return allowedDomains.includes(domain || '');
}

/**
 * Valida ID de Chromebook (deve conter apenas letras, números e hífens)
 */
export function isValidChromebookId(id: string): boolean {
  const chromebookIdRegex = /^[A-Za-z0-9\-_]+$/;
  return chromebookIdRegex.test(id) && id.length >= 3 && id.length <= 50;
}

/**
 * Valida RA (Registro Acadêmico) - apenas números
 */
export function isValidRA(ra: string): boolean {
  const raRegex = /^\d{6,12}$/;
  return raRegex.test(ra);
}

/**
 * Sanitiza entrada do QR Code para prevenir injeção de código
 */
export function sanitizeQRCodeData(data: string): string {
  if (!data) return '';
  
  try {
    // Tenta fazer parse como JSON
    const parsed = JSON.parse(data);
    if (parsed && typeof parsed === 'object' && parsed.id) {
      return sanitizeString(parsed.id);
    }
  } catch {
    // Se não for JSON válido, sanitiza como string
    return sanitizeString(data);
  }
  
  return sanitizeString(data);
}

/**
 * Limita tamanho da string para prevenir ataques de DoS
 */
export function limitStringLength(input: string, maxLength: number = 1000): string {
  if (!input) return '';
  return input.length > maxLength ? input.substring(0, maxLength) : input;
}

/**
 * Remove caracteres especiais perigosos
 */
export function removeSpecialChars(input: string): string {
  if (!input) return '';
  return input.replace(/[<>\"'&\x00-\x1f\x7f-\x9f]/g, '');
}

/**
 * Valida e sanitiza dados de formulário de empréstimo
 */
export function validateLoanFormData(data: any): {
  isValid: boolean;
  errors: string[];
  sanitizedData: any;
} {
  const errors: string[] = [];
  const sanitizedData = { ...data };

  // Sanitizar nome
  if (!data.studentName || data.studentName.trim().length < 2) {
    errors.push('Nome deve ter pelo menos 2 caracteres');
  } else {
    sanitizedData.studentName = sanitizeString(limitStringLength(data.studentName, 100));
  }

  // Validar e sanitizar email
  if (!data.email || !isValidEmail(data.email)) {
    errors.push('Email inválido');
  } else {
    sanitizedData.email = sanitizeString(data.email.toLowerCase());
  }

  // Validar e sanitizar ID do Chromebook
  if (!data.chromebookId || !isValidChromebookId(data.chromebookId)) {
    errors.push('ID do Chromebook inválido');
  } else {
    sanitizedData.chromebookId = sanitizeString(data.chromebookId);
  }

  // Sanitizar finalidade
  if (!data.purpose || data.purpose.trim().length < 3) {
    errors.push('Finalidade deve ter pelo menos 3 caracteres');
  } else {
    sanitizedData.purpose = sanitizeString(limitStringLength(data.purpose, 500));
  }

  // Sanitizar RA se fornecido
  if (data.ra && data.ra.trim()) {
    if (!isValidRA(data.ra.trim())) {
      errors.push('RA deve conter apenas números (6-12 dígitos)');
    } else {
      sanitizedData.ra = sanitizeString(data.ra.trim());
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedData
  };
}