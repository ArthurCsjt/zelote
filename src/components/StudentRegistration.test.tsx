import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { StudentRegistration } from './StudentRegistration';

// Mock dependencies
vi.mock('./StudentForm', () => ({
    StudentForm: () => <div data-testid="student-form">StudentForm Mock</div>,
}));

vi.mock('./StudentCSVImport', () => ({
    StudentCSVImport: () => <div data-testid="student-csv-import">StudentCSVImport Mock</div>,
}));

vi.mock('./ui/tabs', () => ({
    Tabs: ({ children, defaultValue, className }: any) => <div data-testid="tabs" data-default={defaultValue} className={className}>{children}</div>,
    TabsList: ({ children, className }: any) => <div data-testid="tabs-list" className={className}>{children}</div>,
    TabsTrigger: ({ children, value, className }: any) => <button data-testid={`tab-trigger-${value}`} className={className}>{children}</button>,
    TabsContent: ({ children, value, className }: any) => <div data-testid={`tab-content-${value}`} className={className}>{children}</div>,
}));

describe('StudentRegistration', () => {
    it('should render correct layout with tabs', () => {
        render(<StudentRegistration />);

        expect(screen.getByTestId('tabs')).toBeInTheDocument();
        expect(screen.getByTestId('tab-trigger-individual')).toHaveTextContent('Cadastro Individual');
        expect(screen.getByTestId('tab-trigger-csv')).toHaveTextContent('Importação em Lote (CSV)');
    });

    it('should render StudentForm within the individual tab content and StudentCSVImport within the csv tab content', () => {
        render(<StudentRegistration />);

        expect(screen.getByTestId('tab-content-individual')).toBeInTheDocument();
        expect(screen.getByTestId('student-form')).toBeInTheDocument();
        expect(screen.getByTestId('tab-content-csv')).toBeInTheDocument();
        expect(screen.getByTestId('student-csv-import')).toBeInTheDocument();
    });
});
