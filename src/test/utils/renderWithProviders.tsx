import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { ReactElement } from 'react';
import { AuthProvider } from '@/providers/AuthProvider';

/**
 * Cria um QueryClient configurado para testes
 * Desabilita retry para testes mais rápidos e previsíveis
 */
const createTestQueryClient = () =>
    new QueryClient({
        defaultOptions: {
            queries: {
                retry: false,
                cacheTime: 0,
            },
            mutations: {
                retry: false,
            },
        },
        logger: {
            log: console.log,
            warn: console.warn,
            error: () => { }, // Silencia erros em testes
        },
    });

interface ExtendedRenderOptions extends Omit<RenderOptions, 'wrapper'> {
    queryClient?: QueryClient;
}

/**
 * Renderiza um componente com todos os providers necessários
 * @param ui - Componente React a ser renderizado
 * @param options - Opções de renderização
 * @returns Resultado do render com queryClient
 */
export function renderWithProviders(
    ui: ReactElement,
    {
        queryClient = createTestQueryClient(),
        ...renderOptions
    }: ExtendedRenderOptions = {}
) {
    function Wrapper({ children }: { children: React.ReactNode }) {
        return (
            <QueryClientProvider client={queryClient}>
                <AuthProvider>
                    <BrowserRouter>{children}</BrowserRouter>
                </AuthProvider>
            </QueryClientProvider>
        );
    }

    return {
        ...render(ui, { wrapper: Wrapper, ...renderOptions }),
        queryClient,
    };
}

/**
 * Cria um mock de usuário autenticado
 */
export const createMockUser = (overrides = {}) => ({
    id: 'test-user-id',
    email: 'test@colegiosaojudas.com.br',
    role: 'user',
    ...overrides,
});

/**
 * Cria um mock de Chromebook
 */
export const createMockChromebook = (overrides = {}) => ({
    id: 'test-chromebook-id',
    chromebook_id: 'CHR001',
    model: 'Acer Chromebook 314',
    status: 'disponivel' as const,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
});

/**
 * Cria um mock de empréstimo
 */
export const createMockLoan = (overrides = {}) => ({
    id: 'test-loan-id',
    chromebook_id: 'test-chromebook-id',
    student_name: 'João Silva',
    student_email: 'joao@colegiosaojudas.com.br',
    purpose: 'Aula de Matemática',
    user_type: 'aluno' as const,
    loan_type: 'individual' as const,
    loan_date: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
});
