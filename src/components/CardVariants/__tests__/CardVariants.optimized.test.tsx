import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import CardVariants from '../CardVariants';
import type { CardData } from '../../../types';

// Mock the useVariantGeneration hook
vi.mock('../../../hooks/useVariantGeneration', () => ({
  useVariantGeneration: vi.fn(),
}));

// Mock the cardGenerator utility
vi.mock('../../../utils/cardGenerator', () => ({
  validateTerms: vi.fn(),
}));

// Mock the BingoCard component
vi.mock('../../BingoCard/BingoCard', () => ({
  default: ({ title }: { title: string }) => (
    <div data-testid="bingo-card">
      <div data-testid="card-title">{title}</div>
    </div>
  ),
}));

// Mock LoadingSpinner component
vi.mock('../../LoadingSpinner', () => ({
  default: () => <div data-testid="loading-spinner">Loading...</div>,
}));

// Mock ErrorMessage component
vi.mock('../../ErrorMessage', () => ({
  default: ({ error, onRetry }: { error: { message: string }; onRetry?: () => void }) => (
    <div data-testid="error-message">
      <div>{error.message}</div>
      {onRetry && <button onClick={onRetry}>Retry</button>}
    </div>
  ),
}));

import { useVariantGeneration } from '../../../hooks/useVariantGeneration';
import { validateTerms } from '../../../utils/cardGenerator';

const mockUseVariantGeneration = useVariantGeneration as ReturnType<typeof vi.fn>;
const mockValidateTerms = validateTerms as ReturnType<typeof vi.fn>;

describe('CardVariants - Optimized Implementation', () => {
  const validCardData: CardData = {
    id: 'test-card-1',
    title: 'Test Bingo Card',
    terms: Array.from({ length: 25 }, (_, i) => `Term ${i + 1}`),
    freeSpaceImage: 'https://example.com/image.jpg',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockVariantGeneration = {
    variants: [],
    isGenerating: false,
    loadingState: { isLoading: false },
    error: null,
    generateVariants: vi.fn(),
    cancelGeneration: vi.fn(),
    clearVariants: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockValidateTerms.mockReturnValue({ isValid: true });
    mockUseVariantGeneration.mockReturnValue(mockVariantGeneration);
  });

  describe('Basic Rendering', () => {
    it('renders with empty variants', () => {
      render(<CardVariants cardData={validCardData} variantCount={1} />);
      
      expect(screen.getByText('No variants generated yet.')).toBeInTheDocument();
    });

    it('renders loading state', () => {
      mockUseVariantGeneration.mockReturnValue({
        ...mockVariantGeneration,
        isGenerating: true,
        loadingState: { 
          isLoading: true, 
          message: 'Generating 3 card variants...',
          progress: 50
        }
      });

      render(<CardVariants cardData={validCardData} variantCount={3} />);
      
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
      expect(screen.getByText('Generating 3 card variants...')).toBeInTheDocument();
    });

    it('renders error state', () => {
      mockUseVariantGeneration.mockReturnValue({
        ...mockVariantGeneration,
        error: 'Generation failed'
      });

      render(<CardVariants cardData={validCardData} variantCount={1} />);
      
      expect(screen.getByTestId('error-message')).toBeInTheDocument();
      expect(screen.getByText('Generation failed')).toBeInTheDocument();
    });

    it('renders variants when available', () => {
      const mockVariants = [
        { ...validCardData, arrangement: [1, 2, 3] },
        { ...validCardData, arrangement: [4, 5, 6] }
      ];

      mockUseVariantGeneration.mockReturnValue({
        ...mockVariantGeneration,
        variants: mockVariants
      });

      render(<CardVariants cardData={validCardData} variantCount={2} />);
      
      expect(screen.getByText('2 Card Variants')).toBeInTheDocument();
      expect(screen.getAllByTestId('bingo-card')).toHaveLength(2);
      expect(screen.getByText('Card 1')).toBeInTheDocument();
      expect(screen.getByText('Card 2')).toBeInTheDocument();
    });
  });

  describe('Optimization Features', () => {
    it('calls generateVariants with optimization options', () => {
      const mockGenerateVariants = vi.fn();
      mockUseVariantGeneration.mockReturnValue({
        ...mockVariantGeneration,
        generateVariants: mockGenerateVariants
      });

      render(<CardVariants cardData={validCardData} variantCount={5} batchSize={3} />);
      
      expect(mockGenerateVariants).toHaveBeenCalledWith(
        validCardData,
        5,
        expect.objectContaining({
          batchSize: 3,
          maxConcurrent: 2,
          enableProgressTracking: true
        })
      );
    });

    it('supports lazy loading when enabled', () => {
      const mockVariants = Array.from({ length: 10 }, (_, i) => ({
        ...validCardData,
        arrangement: [i]
      }));

      mockUseVariantGeneration.mockReturnValue({
        ...mockVariantGeneration,
        variants: mockVariants
      });

      render(
        <CardVariants 
          cardData={validCardData} 
          variantCount={10} 
          enableLazyLoading={true}
          batchSize={5}
        />
      );
      
      // Should render some cards and some placeholders
      const cards = screen.getAllByTestId('bingo-card');
      const placeholders = screen.getAllByTestId('loading-spinner');
      
      expect(cards.length + placeholders.length).toBe(10);
    });

    it('disables lazy loading when specified', () => {
      const mockVariants = Array.from({ length: 5 }, (_, i) => ({
        ...validCardData,
        arrangement: [i]
      }));

      mockUseVariantGeneration.mockReturnValue({
        ...mockVariantGeneration,
        variants: mockVariants
      });

      render(
        <CardVariants 
          cardData={validCardData} 
          variantCount={5} 
          enableLazyLoading={false}
        />
      );
      
      // Should render all cards, no placeholders
      expect(screen.getAllByTestId('bingo-card')).toHaveLength(5);
      expect(screen.queryAllByTestId('loading-spinner')).toHaveLength(0);
    });
  });

  describe('Error Handling', () => {
    it('calls onError callback when validation fails', () => {
      const onError = vi.fn();
      mockValidateTerms.mockReturnValue({ 
        isValid: false, 
        error: 'Insufficient terms' 
      });

      render(
        <CardVariants 
          cardData={validCardData} 
          variantCount={1} 
          onError={onError}
        />
      );
      
      expect(onError).toHaveBeenCalledWith({
        code: 'VALIDATION_ERROR',
        message: 'Insufficient terms',
        details: 'Please provide at least 24 terms to generate bingo card variants.',
        retryable: true
      });
    });

    it('handles cleanup on unmount', () => {
      const mockCancelGeneration = vi.fn();
      const mockClearVariants = vi.fn();
      
      mockUseVariantGeneration.mockReturnValue({
        ...mockVariantGeneration,
        cancelGeneration: mockCancelGeneration,
        clearVariants: mockClearVariants
      });

      const { unmount } = render(
        <CardVariants cardData={validCardData} variantCount={1} />
      );
      
      unmount();
      
      expect(mockCancelGeneration).toHaveBeenCalled();
      expect(mockClearVariants).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('provides proper ARIA labels', () => {
      const mockVariants = [
        { ...validCardData, arrangement: [1, 2, 3] },
        { ...validCardData, arrangement: [4, 5, 6] }
      ];

      mockUseVariantGeneration.mockReturnValue({
        ...mockVariantGeneration,
        variants: mockVariants
      });

      render(<CardVariants cardData={validCardData} variantCount={2} />);
      
      const container = screen.getByRole('region');
      expect(container).toHaveAttribute('aria-label', '2 bingo card variants');
      
      const articles = screen.getAllByRole('article');
      expect(articles[0]).toHaveAttribute('aria-label', 'Bingo card variant 1 of 2');
      expect(articles[1]).toHaveAttribute('aria-label', 'Bingo card variant 2 of 2');
    });

    it('provides keyboard navigation support', () => {
      const mockVariants = [{ ...validCardData, arrangement: [1, 2, 3] }];

      mockUseVariantGeneration.mockReturnValue({
        ...mockVariantGeneration,
        variants: mockVariants
      });

      render(<CardVariants cardData={validCardData} variantCount={1} />);
      
      const container = screen.getByRole('region');
      expect(container).toHaveAttribute('tabIndex', '0');
      expect(container).toHaveAttribute('aria-describedby', 'variants-instructions');
    });
  });

  describe('Performance', () => {
    it('uses React.memo for optimization', () => {
      // Test that the component is memoized
      expect(typeof CardVariants).toBe('object'); // Memoized components are objects
    });

    it('memoizes validation results', () => {
      const { rerender } = render(
        <CardVariants cardData={validCardData} variantCount={1} />
      );
      
      // Clear mock calls from initial render
      mockValidateTerms.mockClear();
      
      // Rerender with same cardData.terms should not call validateTerms again
      rerender(<CardVariants cardData={validCardData} variantCount={2} />);
      
      expect(mockValidateTerms).not.toHaveBeenCalled();
    });
  });
});