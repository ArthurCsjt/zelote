import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ConfirmReturnDialog } from './ConfirmReturnDialog';
import type { LoanHistoryItem } from '@/types/database';

// Mock dependencies
vi.mock('@/utils/loanCalculations', () => ({
    calculateLoanDuration: vi.fn(() => 48),
    isOverdue: vi.fn(() => false),
    calculateOverdueDays: vi.fn(() => 0),
    formatDetailedDuration: vi.fn(() => '2 dias'),
    getOverdueStatusMessage: vi.fn(() => ''),
}));

// Mock Dialog components
vi.mock('./ui/dialog', () => ({
    Dialog: ({ children, open }: any) => open ? <div data-testid="dialog">{children}</div> : null,
    DialogContent: ({ children }: any) => <div data-testid="dialog-content">{children}</div>,
    DialogHeader: ({ children }: any) => <div data-testid="dialog-header">{children}</div>,
    DialogTitle: ({ children }: any) => <div data-testid="dialog-title">{children}</div>,
    DialogFooter: ({ children }: any) => <div data-testid="dialog-footer">{children}</div>,
    DialogDescription: ({ children }: any) => <div data-testid="dialog-description">{children}</div>,
}));

describe('ConfirmReturnDialog', () => {
    const defaultProps = {
        open: true,
        onOpenChange: vi.fn(),
        deviceIds: ['CB-001', 'CB-002'],
        loanDetails: new Map<string, LoanHistoryItem>([
            ['CB-001', { student_name: 'Student 1', purpose: 'Class', loan_date: '2023-01-01', expected_return_date: '2023-01-03', loan_id: '1', chromebook_id: 'CB-001' } as any],
            ['CB-002', { student_name: 'Student 2', purpose: 'Exam', loan_date: '2023-01-01', expected_return_date: '2023-01-03', loan_id: '2', chromebook_id: 'CB-002' } as any],
        ]),
        returnData: {
            name: 'Staff Member',
            email: 'staff@school.com',
            notes: 'Returned successfully',
        },
        onConfirm: vi.fn(),
        loading: false,
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should render dialog content correctly', () => {
        render(<ConfirmReturnDialog {...defaultProps} />);

        expect(screen.getByText('Confirmar Devolução')).toBeInTheDocument();
        expect(screen.getByText('Student 1')).toBeInTheDocument();
        expect(screen.getByText('Student 2')).toBeInTheDocument();
        expect(screen.getByText('Staff Member')).toBeInTheDocument();
        expect(screen.getByText('2 Dispositivos')).toBeInTheDocument();
        expect(screen.getByText('Returned successfully')).toBeInTheDocument();
    });

    it('should call onConfirm when confirm button is clicked', () => {
        render(<ConfirmReturnDialog {...defaultProps} />);

        const confirmButton = screen.getByText('CONFIRMAR');
        fireEvent.click(confirmButton);

        expect(defaultProps.onConfirm).toHaveBeenCalled();
    });

    it('should call onOpenChange when cancel button is clicked', () => {
        render(<ConfirmReturnDialog {...defaultProps} />);

        const cancelButton = screen.getByText('CANCELAR');
        fireEvent.click(cancelButton);

        expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false);
    });

    it('should display overdue badge if devices are overdue', async () => {
        // Import mocked module to change implementation
        const calculations = await import('@/utils/loanCalculations');
        vi.mocked(calculations.isOverdue).mockReturnValue(true);
        vi.mocked(calculations.calculateOverdueDays).mockReturnValue(5);

        render(<ConfirmReturnDialog {...defaultProps} />);

        expect(screen.getByText('2 atrasados')).toBeInTheDocument();
        expect(screen.getAllByText('+5d atraso')).toHaveLength(2);
    });

    it('should disable buttons when loading', () => {
        render(<ConfirmReturnDialog {...defaultProps} loading={true} />);

        const confirmButton = screen.getByText('PROCS...');
        expect(confirmButton).toBeDisabled();

        const cancelButton = screen.getByText('CANCELAR');
        expect(cancelButton).toBeDisabled();
    });
});
