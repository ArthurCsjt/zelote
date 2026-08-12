import { vi } from 'vitest';

/**
 * Mock do cliente Supabase para testes
 */
export const createMockSupabaseClient = () => ({
    auth: {
        getSession: vi.fn(() =>
            Promise.resolve({
                data: {
                    session: {
                        user: {
                            id: 'test-user-id',
                            email: 'test@colegiosaojudas.com.br',
                        },
                    },
                },
                error: null,
            })
        ),
        onAuthStateChange: vi.fn(() => ({
            data: { subscription: { unsubscribe: vi.fn() } },
        })),
        signInWithPassword: vi.fn(() =>
            Promise.resolve({
                data: { user: { id: 'test-user-id' }, session: {} },
                error: null,
            })
        ),
        signOut: vi.fn(() => Promise.resolve({ error: null })),
    },
    from: vi.fn((table: string) => ({
        select: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        neq: vi.fn().mockReturnThis(),
        is: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        single: vi.fn(() => Promise.resolve({ data: null, error: null })),
    })),
    rpc: vi.fn(() => Promise.resolve({ data: null, error: null })),
});

/**
 * Dados mock para testes
 */
export const mockData = {
    chromebooks: [
        {
            id: '1',
            chromebook_id: 'CHR001',
            model: 'Acer Chromebook 314',
            status: 'disponivel',
            created_at: '2025-01-01T00:00:00Z',
            updated_at: '2025-01-01T00:00:00Z',
        },
        {
            id: '2',
            chromebook_id: 'CHR002',
            model: 'HP Chromebook 14',
            status: 'emprestado',
            created_at: '2025-01-01T00:00:00Z',
            updated_at: '2025-01-01T00:00:00Z',
        },
    ],
    loans: [
        {
            id: '1',
            chromebook_id: '2',
            student_name: 'João Silva',
            student_ra: '12345',
            student_email: 'joao@colegiosaojudas.com.br',
            purpose: 'Aula de Matemática',
            user_type: 'aluno',
            loan_type: 'individual',
            loan_date: '2025-01-01T10:00:00Z',
            expected_return_date: '2025-01-08T18:00:00Z',
            created_at: '2025-01-01T10:00:00Z',
            updated_at: '2025-01-01T10:00:00Z',
        },
    ],
    users: [
        {
            id: 'user-1',
            email: 'arthur.alencar@colegiosaojudas.com.br',
            name: 'Arthur Alencar',
            role: 'super_admin',
        },
        {
            id: 'user-2',
            email: 'prof.teste@colegiosaojudas.com.br',
            name: 'Professor Teste',
            role: 'user',
        },
    ],
};
