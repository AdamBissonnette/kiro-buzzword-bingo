import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { ErrorMessage } from '../ErrorMessage';
import type { AppError } from '../../../types';

const mockError: AppError = {
  code: 'PDF_EXPORT_ERROR',
  message: 'Failed to export PDF',
  details: 'The PDF generation process encountered an error.',
  retryable: true
};

describe('ErrorMessage', () => {
  it('renders error message', () => {
    render(<ErrorMessage error={mockError} />);
    
    expect(screen.getByText('Failed to export PDF')).toBeInTheDocument();
  });

  it('shows error details when showDetails is true', () => {
    render(<ErrorMessage error={mockError} showDetails={true} />);
    
    expect(screen.getByText('The PDF generation process encountered an error.')).toBeInTheDocument();
  });

  it('hides error details when showDetails is false', () => {
    render(<ErrorMessage error={mockError} showDetails={false} />);
    
    expect(screen.queryByText('The PDF generation process encountered an error.')).not.toBeInTheDocument();
  });

  it('shows retry button when error is retryable and onRetry is provided', () => {
    const onRetry = vi.fn();
    render(<ErrorMessage error={mockError} onRetry={onRetry} />);
    
    expect(screen.getByText('Try Again')).toBeInTheDocument();
  });

  it('hides retry button when error is not retryable', () => {
    const nonRetryableError = { ...mockError, retryable: false };
    const onRetry = vi.fn();
    render(<ErrorMessage error={nonRetryableError} onRetry={onRetry} />);
    
    expect(screen.queryByText('Try Again')).not.toBeInTheDocument();
  });

  it('calls onRetry when retry button is clicked', () => {
    const onRetry = vi.fn();
    render(<ErrorMessage error={mockError} onRetry={onRetry} />);
    
    fireEvent.click(screen.getByText('Try Again'));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('shows dismiss button when onDismiss is provided', () => {
    const onDismiss = vi.fn();
    render(<ErrorMessage error={mockError} onDismiss={onDismiss} />);
    
    expect(screen.getByLabelText('Dismiss error')).toBeInTheDocument();
  });

  it('calls onDismiss when dismiss button is clicked', () => {
    const onDismiss = vi.fn();
    render(<ErrorMessage error={mockError} onDismiss={onDismiss} />);
    
    fireEvent.click(screen.getByLabelText('Dismiss error'));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('applies correct CSS class based on error type', () => {
    const { container } = render(<ErrorMessage error={mockError} />);
    
    expect(container.firstChild).toHaveClass('error');
  });

  it('shows warning style for validation errors', () => {
    const validationError: AppError = {
      code: 'VALIDATION_ERROR',
      message: 'Invalid input',
      retryable: false
    };
    
    const { container } = render(<ErrorMessage error={validationError} />);
    
    expect(container.firstChild).toHaveClass('warning');
  });

  it('shows info style for compatibility errors', () => {
    const compatibilityError: AppError = {
      code: 'BROWSER_COMPATIBILITY_ERROR',
      message: 'Feature not supported',
      retryable: false
    };
    
    const { container } = render(<ErrorMessage error={compatibilityError} />);
    
    expect(container.firstChild).toHaveClass('info');
  });
});