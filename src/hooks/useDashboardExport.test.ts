import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useDashboardExport } from './useDashboardExport';
import { toast } from '@/hooks/use-toast';
import logger from '@/utils/logger';
import jsPDF from 'jspdf';

// Create a mock function for the default export
const jsPDFMock = vi.fn().mockImplementation(() => ({
    internal: {
        pageSize: {
            getWidth: () => 210,
            getHeight: () => 297,
        },
    },
    setFontSize: vi.fn(),
    text: vi.fn(),
    save: vi.fn(),
    addPage: vi.fn(),
}));

// Mock dependencies
vi.mock('jspdf', () => {
    return {
        default: jsPDFMock,
    };
});

vi.mock('@/hooks/use-toast', () => ({
    toast: vi.fn(),
}));

vi.mock('@/utils/logger', () => ({
    default: {
        error: vi.fn(),
    },
}));

describe('useDashboardExport', () => {
    const mockData = {
        history: [
            {
                chromebook_id: 'CB-001',
                student_name: 'John Doe',
                user_type: 'Student',
                purpose: 'Study',
                loan_date: new Date('2023-01-01T10:00:00').toISOString(),
                expected_return_date: new Date('2023-01-01T12:00:00').toISOString(),
                status: 'active',
            },
        ],
        stats: {
            totalChromebooks: 10,
            availableChromebooks: 8,
            activeLoans: 2,
            maxOccupancyRate: 20,
            averageUsageTime: 60,
            completionRate: 90,
            totalLoans: 100,
        },
        startDate: new Date('2023-01-01'),
        endDate: new Date('2023-01-31'),
        startHour: 8,
        endHour: 18,
    };

    beforeEach(() => {
        vi.clearAllMocks();
        jsPDFMock.mockClear();
    });

    it('should generate and save PDF successfully', () => {
        const { result } = renderHook(() => useDashboardExport());

        act(() => {
            result.current.handleDownloadPDF(mockData as any);
        });

        expect(jsPDFMock).toHaveBeenCalled();

        // Check if save was called
        const mockPDFInstance = jsPDFMock.mock.results[0].value;
        expect(mockPDFInstance.save).toHaveBeenCalledWith(expect.stringContaining('relatorio-dashboard-'));
        expect(toast).toHaveBeenCalledWith(expect.objectContaining({
            title: 'Sucesso',
        }));
    });

    it('should handle errors during PDF generation', () => {
        const { result } = renderHook(() => useDashboardExport());
        // Directly mock the implementation for this test
        jsPDFMock.mockImplementationOnce(() => {
            throw new Error('PDF Error');
        });

        act(() => {
            result.current.handleDownloadPDF(mockData as any);
        });

        expect(logger.error).toHaveBeenCalledWith('Erro ao gerar PDF', expect.any(Error));
        expect(toast).toHaveBeenCalledWith(expect.objectContaining({
            title: 'Erro',
            variant: 'destructive',
        }));
    });
});
