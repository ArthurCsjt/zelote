/**
 * Utilitários para detecção e tratamento de erros de rede
 * Ajuda a diferenciar erros de rede de erros de validação/negócio
 */

import { PostgrestError } from '@supabase/supabase-js';

/**
 * Verifica se um erro é relacionado a problemas de rede
 * 
 * @param error - Erro a ser verificado
 * @returns true se for erro de rede
 */
export function isNetworkError(error: any): boolean {
    if (!error) return false;

    // Verificar se está offline
    if (!navigator.onLine) {
        return true;
    }

    // Verificar mensagens de erro comuns de rede
    const errorMessage = error.message?.toLowerCase() || '';
    const networkKeywords = [
        'fetch',
        'network',
        'timeout',
        'connection',
        'offline',
        'net::err',
        'failed to fetch',
        'networkerror',
    ];

    if (networkKeywords.some(keyword => errorMessage.includes(keyword))) {
        return true;
    }

    // Verificar códigos de erro Supabase relacionados a rede
    if (error.code === 'PGRST301') { // Timeout
        return true;
    }

    // Verificar status HTTP de rede
    if (error.status === 0 || error.status === 408 || error.status === 504) {
        return true;
    }

    return false;
}

/**
 * Verifica se um erro é de timeout
 * 
 * @param error - Erro a ser verificado
 * @returns true se for timeout
 */
export function isTimeoutError(error: any): boolean {
    if (!error) return false;

    const errorMessage = error.message?.toLowerCase() || '';
    return (
        errorMessage.includes('timeout') ||
        error.code === 'PGRST301' ||
        error.status === 408 ||
        error.status === 504
    );
}

/**
 * Verifica se um erro é de autenticação/autorização
 * 
 * @param error - Erro a ser verificado
 * @returns true se for erro de auth
 */
export function isAuthError(error: any): boolean {
    if (!error) return false;

    return (
        error.status === 401 ||
        error.status === 403 ||
        error.code === 'PGRST301' ||
        error.message?.toLowerCase().includes('unauthorized') ||
        error.message?.toLowerCase().includes('forbidden')
    );
}

/**
 * Verifica se um erro é de validação (constraint violation)
 * 
 * @param error - Erro a ser verificado
 * @returns true se for erro de validação
 */
export function isValidationError(error: any): boolean {
    if (!error) return false;

    // Códigos PostgreSQL de violação de constraint
    const validationCodes = ['23505', '23503', '23502', '23514'];

    return (
        validationCodes.includes(error.code) ||
        error.status === 400 ||
        error.status === 422
    );
}

/**
 * Extrai mensagem amigável de erro do Supabase
 * 
 * @param error - Erro do Supabase
 * @returns Mensagem amigável para o usuário
 */
export function getSupabaseErrorMessage(error: PostgrestError | any): string {
    if (!error) return 'Erro desconhecido';

    // Erros de rede
    if (isNetworkError(error)) {
        if (!navigator.onLine) {
            return 'Você está offline. Verifique sua conexão com a internet.';
        }
        if (isTimeoutError(error)) {
            return 'A operação demorou muito tempo. Tente novamente.';
        }
        return 'Erro de conexão. Verifique sua internet e tente novamente.';
    }

    // Erros de autenticação
    if (isAuthError(error)) {
        return 'Você não tem permissão para realizar esta ação.';
    }

    // Erros de validação comuns
    if (error.code === '23505') {
        return 'Este registro já existe no sistema.';
    }
    if (error.code === '23503') {
        return 'Não é possível deletar este registro pois ele está sendo usado.';
    }
    if (error.code === '23502') {
        return 'Campos obrigatórios não foram preenchidos.';
    }

    // Mensagem padrão do erro
    if (error.message) {
        return error.message;
    }

    return 'Ocorreu um erro inesperado. Tente novamente.';
}

/**
 * Trata erro do Supabase e retorna objeto padronizado
 * 
 * @param error - Erro a ser tratado
 * @returns Objeto com informações do erro
 */
export interface ErrorInfo {
    message: string;
    isNetwork: boolean;
    isAuth: boolean;
    isValidation: boolean;
    originalError: any;
}

export function handleSupabaseError(error: any): ErrorInfo {
    return {
        message: getSupabaseErrorMessage(error),
        isNetwork: isNetworkError(error),
        isAuth: isAuthError(error),
        isValidation: isValidationError(error),
        originalError: error,
    };
}

/**
 * Helper para retry de operações com backoff exponencial
 * 
 * @param fn - Função assíncrona a ser executada
 * @param maxRetries - Número máximo de tentativas
 * @param baseDelay - Delay base em ms
 * @returns Resultado da função ou erro
 */
export async function retryWithBackoff<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
): Promise<T> {
    let lastError: any;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;

            // Não fazer retry se não for erro de rede
            if (!isNetworkError(error)) {
                throw error;
            }

            // Não fazer retry na última tentativa
            if (attempt === maxRetries - 1) {
                break;
            }

            // Backoff exponencial: 1s, 2s, 4s, 8s...
            const delay = baseDelay * Math.pow(2, attempt);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }

    throw lastError;
}
