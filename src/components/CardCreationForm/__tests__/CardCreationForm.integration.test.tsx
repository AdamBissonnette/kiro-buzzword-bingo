import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import CardCreationForm from '../CardCreationForm';

describe('CardCreationForm - Integration Tests', () => {
  const mockOnCardDataChange = vi.fn();
  const mockOnValidationChange = vi.fn();

  const defaultProps = {
    onCardDataChange: mockOnCardDataChange,
    onValidationChange: mockOnValidationChange,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<CardCreationForm {...defaultProps} />);
    expect(screen.getByText('Card Details')).toBeInTheDocument();
  });

  it('renders all required form fields', () => {
    render(<CardCreationForm {...defaultProps} />);

    // Check for form fields
    expect(screen.getByLabelText(/card title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/bingo terms/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/free space image url/i)).toBeInTheDocument();
    expect(screen.getByText(/free space icon/i)).toBeInTheDocument();
  });

  it('displays initial data correctly', () => {
    const initialData = {
      title: 'Test Card',
      terms: ['Term 1', 'Term 2', 'Term 3'],
      freeSpaceImage: 'https://example.com/image.jpg',
      freeSpaceIcon: 'heart',
    };

    render(<CardCreationForm {...defaultProps} initialData={initialData} />);

    expect(screen.getByDisplayValue('Test Card')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Term 1\nTerm 2\nTerm 3')).toBeInTheDocument();
    expect(screen.getByDisplayValue('https://example.com/image.jpg')).toBeInTheDocument();
  });

  it('shows correct term count', () => {
    render(<CardCreationForm {...defaultProps} />);
    expect(screen.getByText('(0/24 minimum)')).toBeInTheDocument();
  });

  it('handles title input changes', () => {
    render(<CardCreationForm {...defaultProps} />);
    
    const titleInput = screen.getByLabelText(/card title/i);
    fireEvent.change(titleInput, { target: { value: 'New Title' } });
    
    expect(titleInput).toHaveValue('New Title');
  });

  it('handles terms input changes', () => {
    render(<CardCreationForm {...defaultProps} />);
    
    const termsTextarea = screen.getByLabelText(/bingo terms/i);
    fireEvent.change(termsTextarea, { target: { value: 'Term 1\nTerm 2' } });
    
    expect(termsTextarea).toHaveValue('Term 1\nTerm 2');
  });

  it('has proper accessibility attributes', () => {
    render(<CardCreationForm {...defaultProps} />);

    const titleInput = screen.getByLabelText(/card title/i);
    const termsTextarea = screen.getByLabelText(/bingo terms/i);
    const imageInput = screen.getByLabelText(/free space image url/i);

    expect(titleInput).toHaveAttribute('maxLength', '100');
    expect(titleInput).toHaveAttribute('aria-invalid', 'false');
    expect(termsTextarea).toHaveAttribute('aria-invalid', 'false');
    expect(imageInput).toHaveAttribute('type', 'url');
    expect(imageInput).toHaveAttribute('aria-invalid', 'false');
  });

  it('applies custom className when provided', () => {
    const { container } = render(
      <CardCreationForm {...defaultProps} className="custom-class" />
    );

    expect(container.firstChild).toHaveClass('custom-class');
  });
});