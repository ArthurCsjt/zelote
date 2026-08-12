/**
 * Logger centralizado para o sistema
 * Em desenvolvimento: exibe logs no console
 * Em produção: desabilita logs e pode enviar para serviço de monitoramento
 */

const isDevelopment = import.meta.env.MODE === 'development';
const isTest = import.meta.env.MODE === 'test';

// Desabilitar logs em testes e produção
const shouldLog = isDevelopment && !isTest;

/**
 * Interface para contexto adicional de logs
 */
export interface LogContext {
    [key: string]: any;
}

/**
 * Logger centralizado com suporte a diferentes níveis de log
 */
export const logger = {
    /**
     * Log de informação (desenvolvimento apenas)
     * @param message - Mensagem a ser logada
     * @param context - Contexto adicional (opcional)
     */
    log: (message: string, context?: LogContext) => {
        if (shouldLog) {
            if (context) {
                console.log(`[INFO] ${message}`, context);
            } else {
                console.log(`[INFO] ${message}`);
            }
        }
    },

    /**
     * Log de informação (alias para log)
     */
    info: (message: string, context?: LogContext) => {
        if (shouldLog) {
            if (context) {
                console.info(`[INFO] ${message}`, context);
            } else {
                console.info(`[INFO] ${message}`);
            }
        }
    },

    /**
     * Log de aviso
     * @param message - Mensagem de aviso
     * @param context - Contexto adicional (opcional)
     */
    warn: (message: string, context?: LogContext) => {
        if (shouldLog) {
            if (context) {
                console.warn(`[WARN] ${message}`, context);
            } else {
                console.warn(`[WARN] ${message}`);
            }
        }

        // Em produção, poderia enviar para serviço de monitoramento
        if (!isDevelopment) {
            // TODO: Integrar com Sentry ou similar
            // Sentry.captureMessage(message, { level: 'warning', extra: context });
        }
    },

    /**
     * Log de erro
     * @param message - Mensagem de erro
     * @param error - Objeto de erro (opcional)
     * @param context - Contexto adicional (opcional)
     */
    error: (message: string, error?: Error | unknown, context?: LogContext) => {
        if (shouldLog) {
            if (error && context) {
                console.error(`[ERROR] ${message}`, error, context);
            } else if (error) {
                console.error(`[ERROR] ${message}`, error);
            } else if (context) {
                console.error(`[ERROR] ${message}`, context);
            } else {
                console.error(`[ERROR] ${message}`);
            }
        }

        // Em produção, sempre enviar erros para monitoramento
        if (!isDevelopment) {
            // TODO: Integrar com Sentry ou similar
            // Sentry.captureException(error || new Error(message), {
            //   extra: context,
            // });
        }
    },

    /**
     * Log de debug (apenas em desenvolvimento)
     * @param message - Mensagem de debug
     * @param context - Contexto adicional (opcional)
     */
    debug: (message: string, context?: LogContext) => {
        if (shouldLog) {
            if (context) {
                console.debug(`[DEBUG] ${message}`, context);
            } else {
                console.debug(`[DEBUG] ${message}`);
            }
        }
    },

    /**
     * Agrupa logs relacionados
     * @param label - Label do grupo
     * @param callback - Função com logs a serem agrupados
     */
    group: (label: string, callback: () => void) => {
        if (shouldLog) {
            console.group(label);
            callback();
            console.groupEnd();
        } else {
            callback();
        }
    },

    /**
     * Mede tempo de execução de uma operação
     * @param label - Label da medição
     */
    time: (label: string) => {
        if (shouldLog) {
            console.time(label);
        }
    },

    /**
     * Finaliza medição de tempo
     * @param label - Label da medição
     */
    timeEnd: (label: string) => {
        if (shouldLog) {
            console.timeEnd(label);
        }
    },

    /**
     * Log de tabela (útil para arrays de objetos)
     * @param data - Dados a serem exibidos em tabela
     */
    table: (data: any[]) => {
        if (shouldLog) {
            console.table(data);
        }
    },
};

/**
 * Helper para criar logger com contexto fixo
 * @param defaultContext - Contexto padrão para todos os logs
 * @returns Logger com contexto fixo
 * 
 * @example
 * ```typescript
 * const userLogger = createContextLogger({ module: 'UserService' });
 * userLogger.info('User created', { userId: '123' });
 * // Output: [INFO] User created { module: 'UserService', userId: '123' }
 * ```
 */
export function createContextLogger(defaultContext: LogContext) {
    return {
        log: (message: string, context?: LogContext) =>
            logger.log(message, { ...defaultContext, ...context }),
        info: (message: string, context?: LogContext) =>
            logger.info(message, { ...defaultContext, ...context }),
        warn: (message: string, context?: LogContext) =>
            logger.warn(message, { ...defaultContext, ...context }),
        error: (message: string, error?: Error | unknown, context?: LogContext) =>
            logger.error(message, error, { ...defaultContext, ...context }),
        debug: (message: string, context?: LogContext) =>
            logger.debug(message, { ...defaultContext, ...context }),
    };
}

export default logger;
