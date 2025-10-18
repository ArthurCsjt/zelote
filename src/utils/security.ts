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
 * Normaliza o ID do Chromebook para o formato padrão (ex: '12' -> 'CHR012').
 * @param identifier O ID ou número de patrimônio/série inserido.
 * @returns O ID normalizado ou a string original em maiúsculas.
 */
export function normalizeChromebookId(identifier: string): string {
  const raw = identifier.trim();
  if (!raw) return '';

  // Remove zeros à esquerda se for puramente numérico, mas mantém o formato original se for alfanumérico
  const numericPart = raw.replace(/^0+/, '');
  const onlyDigits = /^\d+$/.test(raw);

  if (onlyDigits) {
    // Se for apenas dígitos, formata como CHR + preenchimento com zeros (mínimo 3 dígitos)
    // Ex: '60' -> 'CHR060', '600' -> 'CHR600', '6000' -> 'CHR6000'
    const num = parseInt(raw, 10);
    if (isNaN(num)) return raw.toUpperCase(); // Fallback
    
    // Se o número for menor que 1000, preenche com zeros até 3 dígitos.
    const paddedNum = num < 1000 ? String(num).padStart(3, '0') : String(num);
    return `CHR${paddedNum}`;
  }

  // Se já começar com 'CHR' (case insensitive), garante que seja maiúsculo
  if (raw.toUpperCase().startsWith('CHR')) {
    return raw.toUpperCase();
  }

  // Caso contrário, retorna a string original em maiúsculas
  return raw.toUpperCase();
}

/**
 * Valida ID de Chromebook (deve conter apenas letras, números e hífens)
 */
export function isValidChromebookId(id: string): boolean {
  const chromebookIdRegex = /^[A-Za-z0-9\-_]+$/;
  return chromebookIdRegex.test(id) && id.length >= 3 && id.length <= 50;
}

/**
 * Sanitiza entrada do QR Code para prevenir injeção de código.
 * Retorna SEMPRE o ID do Chromebook normalizado como string.
 */
export function sanitizeQRCodeData(data: string): string {
  if (!data) return '';
  
  let cleanData = data.trim();

  // 1. Tenta limpar aspas externas que podem vir do scanner
  if (cleanData.startsWith('"') && cleanData.endsWith('"')) {
    cleanData = cleanData.substring(1, cleanData.length - 1);
  }

  let identifierToUse = data;

  try {
    // 2. Tenta fazer parse como JSON
    const parsed = JSON.parse(cleanData);
    
    // Se for um objeto e tiver a chave 'id' (novo formato de cadastro inteligente)
    if (parsed && typeof parsed === 'object' && parsed.id) {
      // Se for o formato JSON, extrai o ID e usa ele
      identifierToUse = parsed.id;
    }
  } catch {
    // Se falhar o parse JSON, continua usando a string bruta
  }
  
  // 3. Tenta extrair o ID usando Regex (para QR Codes antigos ou simples)
  const idRegex = /["']id["']\s*:\s*["']([^"']+)["']/;
  const match = cleanData.match(idRegex);
  
  if (match && match[1]) {
    identifierToUse = match[1];
  }
  
  // Sanitiza a string (removendo HTML) e depois normaliza o formato (CHRxxx)
  return normalizeChromebookId(sanitizeString(identifierToUse));
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
    // Aplica normalização antes de salvar no sanitizedData
    sanitizedData.chromebookId = normalizeChromebookId(sanitizeString(data.chromebookId));
  }

  // Sanitizar finalidade
  if (!data.purpose || data.purpose.trim().length < 3) {
    errors.push('Finalidade deve ter pelo menos 3 caracteres');
  } else {
    sanitizedData.purpose = sanitizeString(limitStringLength(data.purpose, 500));
  }

  // Sanitizar RA se fornecido
  if (data.ra && data.ra.trim()) {
    // NOTE: A função isValidRA não existe no seu código, assumindo que a validação é apenas para garantir que seja uma string simples.
    // Se você precisar de validação de formato de RA, precisará implementar isValidRA.
    // Por enquanto, apenas sanitiza.
    sanitizedData.ra = sanitizeString(data.ra.trim());
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedData
  };
}