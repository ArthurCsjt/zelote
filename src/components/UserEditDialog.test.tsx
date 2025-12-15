import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UserEditDialog } from './UserEditDialog';
import { useDatabase } from '@/hooks/useDatabase';
import { toast } from '@/hooks/use-toast';

// Mock dependencies
vi.mock('@/hooks/useDatabase', () => ({
    useDatabase: vi.fn(),
}));

vi.mock('@/hooks/use-toast', () => ({
    toast: vi.fn(),
}));

// Mock icons
vi.mock('lucide-react', () => ({
    Loader2: () => <div data-testid="loader">Loader</div>,
    Save: () => <span>Save</span>,
    User: () => <span>User</span>,
    GraduationCap: () => <span>GraduationCap</span>,
    Briefcase: () => <span>Briefcase</span>,
}));

// Mock Dialog components
vi.mock('./ui/dialog', () => ({
    Dialog: ({ children, open }: any) => open ? <div data-testid="dialog">{children}</div> : null,
    DialogContent: ({ children }: any) => <div data-testid="dialog-content">{children}</div>,
    DialogHeader: ({ children }: any) => <div data-testid="dialog-header">{children}</div>,
    DialogTitle: ({ children }: any) => <div data-testid="dialog-title">{children}</div>,
    DialogDescription: ({ children }: any) => <div data-testid="dialog-description">{children}</div>,
    DialogFooter: ({ children }: any) => <div data-testid="dialog-footer">{children}</div>,
}));

describe('UserEditDialog', () => {
    const mockUpdateStudent = vi.fn();
    const mockUpdateTeacher = vi.fn();
    const mockUpdateStaff = vi.fn();

    const defaultProps = {
        open: true,
        onOpenChange: vi.fn(),
        user: {
            id: 'user-1',
            nome_completo: 'Test User',
            email: 'test@sj.g12.br',
            tipo: 'Aluno' as const,
            ra: '12345',
            turma: '9A',
        },
        onSuccess: vi.fn(),
    };

    beforeEach(() => {
        vi.clearAllMocks();
        (useDatabase as any).mockReturnValue({
            updateStudent: mockUpdateStudent,
            updateTeacher: mockUpdateTeacher,
            updateStaff: mockUpdateStaff,
            loading: false,
        });
        mockUpdateStudent.mockResolvedValue(true);
    });

    it('should render student fields correctly', () => {
        render(<UserEditDialog {...defaultProps} />);

        expect(screen.getByLabelText('Nome Completo *')).toHaveValue('Test User');
        expect(screen.getByLabelText('E-mail *')).toHaveValue('test@sj.g12.br');
        expect(screen.getByLabelText('RA (Registro do Aluno)')).toHaveValue('12345');
        expect(screen.getByLabelText('Turma')).toHaveValue('9A');
    });

    it('should not render extra fields for teachers', () => {
        render(<UserEditDialog {...defaultProps} user={{ ...defaultProps.user, tipo: 'Professor', email: 'test@sj.pro.br' }} />);

        expect(screen.getByLabelText('Nome Completo *')).toBeInTheDocument();
        expect(screen.queryByLabelText('RA (Registro do Aluno)')).not.toBeInTheDocument();
    });

    it('should validate email on change', () => {
        render(<UserEditDialog {...defaultProps} />);

        const emailInput = screen.getByLabelText('E-mail *');
        fireEvent.change(emailInput, { target: { value: 'invalid@test.com' } });

        expect(screen.getByText(/E-mail deve terminar com @sj.g12.br/i)).toBeInTheDocument();
        expect(screen.getByText('Salvar Alterações').closest('button')).toBeDisabled();
    });

    it('should call generic user updateStudent on submit for student', async () => {
        render(<UserEditDialog {...defaultProps} />);

        const submitButton = screen.getByText('Salvar Alterações');
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(mockUpdateStudent).toHaveBeenCalledWith('user-1', expect.objectContaining({
                nome_completo: 'Test User',
                email: 'test@sj.g12.br',
                ra: '12345',
                turma: '9A'
            }));
            expect(defaultProps.onSuccess).toHaveBeenCalled();
            expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false);
        });
    });

    it('should show toast on error', async () => {
        mockUpdateStudent.mockRejectedValue(new Error('Update failed'));
        render(<UserEditDialog {...defaultProps} />);

        const submitButton = screen.getByText('Salvar Alterações');
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(toast).toHaveBeenCalledWith(expect.objectContaining({ variant: 'destructive' }));
        });
    });
});
