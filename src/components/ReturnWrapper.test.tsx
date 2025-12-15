import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ReturnWrapper } from './ReturnWrapper';

// Mock child components
vi.mock('./ReturnForm', () => ({
    ReturnForm: vi.fn(({ initialChromebookId, onReturnSuccess }) => (
        <div data-testid="return-form">
            ReturnForm Mock
            <span data-testid="initial-id">{initialChromebookId}</span>
            <button onClick={onReturnSuccess}>Success</button>
        </div>
    )),
}));

vi.mock('./Shared/SectionHeader', () => ({
    SectionHeader: vi.fn(({ title }) => <div data-testid="section-header">{title}</div>),
}));

describe('ReturnWrapper', () => {
    const defaultProps = {
        onBack: vi.fn(),
        onReturnSuccess: vi.fn(),
    };

    it('should render the layout correctly', () => {
        render(<ReturnWrapper {...defaultProps} />);

        expect(screen.getByTestId('section-header')).toHaveTextContent('REGISTRAR DEVOLUÇÃO');
        expect(screen.getByTestId('return-form')).toBeInTheDocument();
    });

    it('should pass props to ReturnForm', () => {
        render(<ReturnWrapper {...defaultProps} initialChromebookId="CB-123" />);

        expect(screen.getByTestId('initial-id')).toHaveTextContent('CB-123');
    });
});
