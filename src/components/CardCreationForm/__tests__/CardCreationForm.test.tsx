import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import CardCreationForm from '../CardCreationForm';
import type { CardData } from '../../../types';

describe('CardCreationForm', () => {
  const mockOnCardDataChange = vi.fn();
  const mockOnValidationChange = vi.fn();

  const defaultProps = {
    onCardDataChange: mockOnCardDataChange,
    onValidationChange: mockOnValidationChange,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all form fields', () => {
    render(<CardCreationForm {...defaultProps} />);

    expect(screen.getByLabelText(/card title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/bingo terms/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/free space image url/i)).toBeInTheDocument();
    expect(screen.getByText(/free space icon/i)).toBeInTheDocument();
  });

  it('displays initial data when provided', () => {
    const initialData: Partial<CardData> = {
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

  it('validates title field correctly', async () => {
    const user = userEvent.setup();
    render(<CardCreationForm {...defaultProps} />);

    const titleInput = screen.getByLabelText(/card title/i);

    // Test empty title
    await user.clear(titleInput);
    await user.tab(); // Trigger blur to show validation

    await waitFor(() => {
      expect(mockOnValidationChange).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Title is required'
        })
      );
    });

    // Test short title
    await user.type(titleInput, 'AB');
    await waitFor(() => {
      expect(mockOnValidationChange).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Title must be at least 3 characters long'
        })
      );
    });

    // Test valid title
    await user.clear(titleInput);
    await user.type(titleInput, 'Valid Title');
    await waitFor(() => {
      expect(mockOnValidationChange).toHaveBeenCalledWith(
        expect.not.objectContaining({
          title: expect.any(String)
        })
      );
    });
  });

  it('validates terms field correctly', async () => {
    const user = userEvent.setup();
    render(<CardCreationForm {...defaultProps} />);

    const termsTextarea = screen.getByLabelText(/bingo terms/i);

    // Test empty terms
    await user.clear(termsTextarea);
    await waitFor(() => {
      expect(mockOnValidationChange).toHaveBeenCalledWith(
        expect.objectContaining({
          terms: 'At least one term is required'
        })
      );
    });

    // Test insufficient terms
    await user.type(termsTextarea, 'Term 1\nTerm 2\nTerm 3');
    await waitFor(() => {
      expect(mockOnValidationChange).toHaveBeenCalledWith(
        expect.objectContaining({
          terms: expect.stringContaining('Need at least 24 terms')
        })
      );
    });
  });

  it('validates free space image URL correctly', async () => {
    const user = userEvent.setup();
    render(<CardCreationForm {...defaultProps} />);

    const imageInput = screen.getByLabelText(/free space image url/i);

    // Test invalid URL
    await user.type(imageInput, 'not-a-url');
    await waitFor(() => {
      expect(mockOnValidationChange).toHaveBeenCalledWith(
        expect.objectContaining({
          freeSpaceImage: 'Please enter a valid image URL'
        })
      );
    });

    // Test valid URL
    await user.clear(imageInput);
    await user.type(imageInput, 'https://example.com/image.jpg');
    await waitFor(() => {
      expect(mockOnValidationChange).toHaveBeenCalledWith(
        expect.not.objectContaining({
          freeSpaceImage: expect.any(String)
        })
      );
    });

    // Test empty URL (should be valid as it's optional)
    await user.clear(imageInput);
    await waitFor(() => {
      expect(mockOnValidationChange).toHaveBeenCalledWith(
        expect.not.objectContaining({
          freeSpaceImage: expect.any(String)
        })
      );
    });
  });

  it('shows term count correctly', async () => {
    const user = userEvent.setup();
    render(<CardCreationForm {...defaultProps} />);

    const termsTextarea = screen.getByLabelText(/bingo terms/i);

    // Initial count should be 0
    expect(screen.getByText('(0/24 minimum)')).toBeInTheDocument();

    // Add some terms
    await user.type(termsTextarea, 'Term 1\nTerm 2\nTerm 3');
    expect(screen.getByText('(3/24 minimum)')).toBeInTheDocument();
  });

  it('hides icon selector when image URL is provided', async () => {
    const user = userEvent.setup();
    render(<CardCreationForm {...defaultProps} />);

    const imageInput = screen.getByLabelText(/free space image url/i);

    // Icon selector should be visible initially
    expect(screen.getByText(/free space icon/i)).toBeInTheDocument();

    // Add image URL
    await user.type(imageInput, 'https://example.com/image.jpg');

    // Icon selector should be hidden
    await waitFor(() => {
      expect(screen.queryByText(/free space icon/i)).not.toBeInTheDocument();
    });

    // Clear image URL
    await user.clear(imageInput);

    // Icon selector should be visible again
    await waitFor(() => {
      expect(screen.getByText(/free space icon/i)).toBeInTheDocument();
    });
  });

  it('calls onCardDataChange with correct data', async () => {
    const user = userEvent.setup();
    render(<CardCreationForm {...defaultProps} />);

    const titleInput = screen.getByLabelText(/card title/i);
    const termsTextarea = screen.getByLabelText(/bingo terms/i);

    await user.type(titleInput, 'Test Card');
    await user.type(termsTextarea, 'Term 1\nTerm 2\nTerm 3');

    await waitFor(() => {
      expect(mockOnCardDataChange).toHaveBeenCalledWith({
        title: 'Test Card',
        terms: ['Term 1', 'Term 2', 'Term 3'],
        freeSpaceImage: undefined,
        freeSpaceIcon: 'star',
      });
    });
  });

  it('debounces validation and data change calls', async () => {
    const user = userEvent.setup();
    render(<CardCreationForm {...defaultProps} />);

    const titleInput = screen.getByLabelText(/card title/i);

    // Type quickly
    await user.type(titleInput, 'Test');

    // Wait for debounce
    await waitFor(() => {
      expect(mockOnCardDataChange).toHaveBeenCalled();
      expect(mockOnValidationChange).toHaveBeenCalled();
    }, { timeout: 1000 });
  });

  it('has proper accessibility attributes', () => {
    render(<CardCreationForm {...defaultProps} />);

    const titleInput = screen.getByLabelText(/card title/i);
    const termsTextarea = screen.getByLabelText(/bingo terms/i);
    const imageInput = screen.getByLabelText(/free space image url/i);

    expect(titleInput).toHaveAttribute('aria-invalid', 'false');
    expect(termsTextarea).toHaveAttribute('aria-invalid', 'false');
    expect(imageInput).toHaveAttribute('aria-invalid', 'false');

    expect(titleInput).toHaveAttribute('maxLength', '100');
    expect(imageInput).toHaveAttribute('type', 'url');
  });

  it('shows error messages with proper ARIA attributes', async () => {
    const user = userEvent.setup();
    render(<CardCreationForm {...defaultProps} />);

    const titleInput = screen.getByLabelText(/card title/i);

    // Trigger validation error
    await user.clear(titleInput);
    await user.tab();

    await waitFor(() => {
      const errorMessage = screen.getByRole('alert');
      expect(errorMessage).toBeInTheDocument();
      expect(titleInput).toHaveAttribute('aria-invalid', 'true');
      expect(titleInput).toHaveAttribute('aria-describedby', 'title-error');
    });
  });

  it('applies custom className when provided', () => {
    const { container } = render(
      <CardCreationForm {...defaultProps} className="custom-class" />
    );

    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('handles icon selection correctly', async () => {
    const user = userEvent.setup();
    render(<CardCreationForm {...defaultProps} />);

    // Find and click the icon selector trigger
    const iconTrigger = screen.getByRole('button', { name: /star/i });
    await user.click(iconTrigger);

    // Select a different icon
    const heartOption = screen.getByRole('button', { name: /filled heart/i });
    await user.click(heartOption);

    await waitFor(() => {
      expect(mockOnCardDataChange).toHaveBeenCalledWith(
        expect.objectContaining({
          freeSpaceIcon: 'heart-filled',
        })
      );
    });
  });
});