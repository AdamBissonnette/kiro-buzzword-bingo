import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import CardCreationForm from '../CardCreationForm';

describe('CardCreationForm - Basic Tests', () => {
  const mockOnCardDataChange = vi.fn();
  const mockOnValidationChange = vi.fn();

  const defaultProps = {
    onCardDataChange: mockOnCardDataChange,
    onValidationChange: mockOnValidationChange,
  };

  it('renders without crashing', () => {
    render(<CardCreationForm {...defaultProps} />);
    expect(screen.getByText('Card Details')).toBeInTheDocument();
  });

  it('renders all form fields', () => {
    render(<CardCreationForm {...defaultProps} />);

    expect(screen.getByLabelText(/card title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/bingo terms/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/free space image url/i)).toBeInTheDocument();
    expect(screen.getByText(/free space icon/i)).toBeInTheDocument();
  });

  it('displays initial data when provided', () => {
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

  it('shows term count correctly', () => {
    render(<CardCreationForm {...defaultProps} />);
    expect(screen.getByText('(0/24 minimum)')).toBeInTheDocument();
  });
});