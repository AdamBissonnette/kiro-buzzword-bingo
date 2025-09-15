import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import MainContent from '../MainContent';
import type { CardData, AppError } from '../../../types';

// Mock the card generator utility
vi.mock('../../../utils/cardGenerator', () => ({
  generateCardVariants: vi.fn((cardData, count) => 
    Array.from({ length: count }, () => ({
      ...cardData,
      arrangement: Array.from({ length: 25 }, (_, j) => j === 12 ? -1 : (j > 12 ? j - 1 : j))
    }))
  ),
  validateTerms: vi.fn((terms) => ({
    isValid: terms.length >= 24,
    error: terms.length < 24 ? 'Need at least 24 terms' : null
  }))
}));

const mockCardData: CardData = {
  id: 'test-id',
  title: 'Test Card',
  terms: Array.from({ length: 24 }, (_, i) => `Term ${i + 1}`),
  freeSpaceIcon: 'star',
  arrangement: Array.from({ length: 25 }, (_, i) => i === 12 ? -1 : (i > 12 ? i - 1 : i)),
  createdAt: new Date(),
  updatedAt: new Date()
};

const mockError: AppError = {
  code: 'TEST_ERROR',
  message: 'Test error message',
  details: 'Test error details',
  retryable: true
};

describe('MainContent', () => {
  it('renders empty state when no card data is provided', () => {
    render(
      <MainContent
        cardData={null}
        showVariants={false}
        variantCount={1}
      />
    );

    expect(screen.getByText('Create Your First Bingo Card')).toBeInTheDocument();
    expect(screen.getByText('Use the sidebar to create a new bingo card with your custom terms.')).toBeInTheDocument();
  });

  it('renders loading state when isLoading is true', () => {
    render(
      <MainContent
        cardData={mockCardData}
        showVariants={false}
        variantCount={1}
        isLoading={true}
      />
    );

    expect(screen.getByText('Loading card data...')).toBeInTheDocument();
  });

  it('renders error state when error is provided', () => {
    render(
      <MainContent
        cardData={mockCardData}
        showVariants={false}
        variantCount={1}
        error={mockError}
      />
    );

    expect(screen.getByText('Test error message')).toBeInTheDocument();
  });

  it('renders single card when card data is provided and variants are not shown', () => {
    render(
      <MainContent
        cardData={mockCardData}
        showVariants={false}
        variantCount={1}
      />
    );

    expect(screen.getByText('Test Card')).toBeInTheDocument();
  });

  it('renders variants header when showVariants is true', async () => {
    render(
      <MainContent
        cardData={mockCardData}
        showVariants={true}
        variantCount={3}
      />
    );

    expect(screen.getByText('3 Card Variants')).toBeInTheDocument();
    expect(screen.getByText('Each card has a unique arrangement of your terms')).toBeInTheDocument();
  });

  it('shows loading state while generating variants', async () => {
    render(
      <MainContent
        cardData={mockCardData}
        showVariants={true}
        variantCount={2}
      />
    );

    // Should show loading initially
    expect(screen.getByText('Generating 2 card variants...')).toBeInTheDocument();
  });

  it('renders variants in horizontal layout after generation', async () => {
    render(
      <MainContent
        cardData={mockCardData}
        showVariants={true}
        variantCount={2}
      />
    );

    // Wait for variants to be generated
    await waitFor(() => {
      expect(screen.getByText('Card 1')).toBeInTheDocument();
      expect(screen.getByText('Card 2')).toBeInTheDocument();
    });
  });

  it('shows error when insufficient terms are provided for variants', async () => {
    const insufficientCardData = {
      ...mockCardData,
      terms: ['Term 1', 'Term 2'] // Only 2 terms, need 24
    };

    render(
      <MainContent
        cardData={insufficientCardData}
        showVariants={true}
        variantCount={2}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Need at least 24 terms')).toBeInTheDocument();
    });
  });

  it('handles singular variant count in header', () => {
    render(
      <MainContent
        cardData={mockCardData}
        showVariants={true}
        variantCount={1}
      />
    );

    expect(screen.getByText('1 Card Variant')).toBeInTheDocument();
  });

  it('clears variants when switching from variants to single view', () => {
    const { rerender } = render(
      <MainContent
        cardData={mockCardData}
        showVariants={true}
        variantCount={2}
      />
    );

    // Switch to single view
    rerender(
      <MainContent
        cardData={mockCardData}
        showVariants={false}
        variantCount={2}
      />
    );

    expect(screen.getByText('Test Card')).toBeInTheDocument();
    expect(screen.queryByText('Card Variants')).not.toBeInTheDocument();
  });
});