import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import CardVariants from '../CardVariants';
import type { CardData } from '../../../types';

// Mock the cardGenerator utility
vi.mock('../../../utils/cardGenerator', () => ({
  validateTerms: vi.fn(),
  generateCardVariants: vi.fn(),
}));

// Mock the useVariantGeneration hook
vi.mock('../../../hooks/useVariantGeneration', () => ({
  useVariantGeneration: vi.fn(),
}));

// Mock the BingoCard component
vi.mock('../../BingoCard/BingoCard', () => ({
  default: ({ title, arrangement }: { title: string; arrangement?: number[] }) => (
    <div data-testid="bingo-card">
      <div data-testid="card-title">{title}</div>
      <div data-testid="card-arrangement">{JSON.stringify(arrangement)}</div>
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

import { validateTerms } from '../../../utils/cardGenerator';
import { useVariantGeneration } from '../../../hooks/useVariantGeneration';

const mockValidateTerms = validateTerms as ReturnType<typeof vi.fn>;
const mockUseVariantGeneration = useVariantGeneration as ReturnType<typeof vi.fn>;

describe('CardVariants', () => {
  const validCardData: CardData = {
    id: 'test-card-1',
    title: 'Test Bingo Card',
    terms: Array.from({ length: 25 }, (_, i) => `Term ${i + 1}`),
    freeSpaceImage: 'https://example.com/image.jpg',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const invalidCardData: CardData = {
    id: 'test-card-2',
    title: 'Invalid Card',
    terms: ['Term 1', 'Term 2'], // Only 2 terms, need 24
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
    mockUseVariantGeneration.mockReturnValue(mockVariantGeneration);
  });

  describe('Component Rendering', () => {
    it('renders horizontal row layout for variants', async () => {
      mockValidateTerms.mockReturnValue({ isValid: true });
      mockUseVariantGeneration.mockReturnValue({
        ...mockVariantGeneration,
        variants: [validCardData]
      });

      render(<CardVariants cardData={validCardData} variantCount={1} />);

      await waitFor(() => {
        const variantsRow = screen.getByRole('region');
        expect(variantsRow).toHaveAttribute('aria-label', '1 bingo card variants');
      });
    });

    it('renders proper accessibility attributes', async () => {
      mockValidateTerms.mockReturnValue({ isValid: true });
      mockGenerateCardVariants.mockReturnValue([validCardData, validCardData]);

      render(<CardVariants cardData={validCardData} variantCount={2} />);

      await waitFor(() => {
        const variantsRow = screen.getByRole('region');
        expect(variantsRow).toHaveAttribute('aria-label', '2 bingo card variants');
        
        const articles = screen.getAllByRole('article');
        expect(articles).toHaveLength(2);
        expect(articles[0]).toHaveAttribute('aria-label', 'Bingo card variant 1 of 2');
        expect(articles[1]).toHaveAttribute('aria-label', 'Bingo card variant 2 of 2');
      });
    });

    it('renders variants header with correct title', async () => {
      mockValidateTerms.mockReturnValue({ isValid: true });
      mockGenerateCardVariants.mockReturnValue([validCardData, validCardData]);

      render(<CardVariants cardData={validCardData} variantCount={2} />);

      await waitFor(() => {
        expect(screen.getByText('2 Card Variants')).toBeInTheDocument();
        expect(screen.getByText('Each card has a unique arrangement of your terms')).toBeInTheDocument();
      });
    });

    it('supports custom className prop', async () => {
      mockValidateTerms.mockReturnValue({ isValid: true });
      mockGenerateCardVariants.mockReturnValue([validCardData]);

      const { container } = render(
        <CardVariants cardData={validCardData} variantCount={1} className="custom-class" />
      );

      await waitFor(() => {
        const cardVariantsElement = container.firstChild as HTMLElement;
        expect(cardVariantsElement).toHaveClass('custom-class');
      });
    });
  });

  describe('Validation and Error Handling', () => {
    it('displays error when terms are insufficient', () => {
      const errorMessage = 'Insufficient terms provided. Need at least 24 terms, but got 2.';
      mockValidateTerms.mockReturnValue({ 
        isValid: false, 
        error: errorMessage 
      });

      render(<CardVariants cardData={invalidCardData} variantCount={1} />);

      expect(screen.getByTestId('error-message')).toBeInTheDocument();
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    it('displays loading state during generation', () => {
      mockValidateTerms.mockReturnValue({ isValid: true });
      mockGenerateCardVariants.mockReturnValue([]);

      render(<CardVariants cardData={validCardData} variantCount={1} />);

      // Initially shows loading
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
      expect(screen.getByText(/generating.*card variants/i)).toBeInTheDocument();
    });

    it('handles generation errors gracefully', async () => {
      mockValidateTerms.mockReturnValue({ isValid: true });
      mockGenerateCardVariants.mockImplementation(() => {
        throw new Error('Generation failed');
      });

      render(<CardVariants cardData={validCardData} variantCount={1} />);

      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toBeInTheDocument();
        expect(screen.getByText('Generation failed')).toBeInTheDocument();
      });
    });

    it('calls onError callback when validation fails', () => {
      const onError = vi.fn();
      const errorMessage = 'Insufficient terms provided. Need at least 24 terms, but got 2.';
      mockValidateTerms.mockReturnValue({ 
        isValid: false, 
        error: errorMessage 
      });

      render(<CardVariants cardData={invalidCardData} variantCount={1} onError={onError} />);

      expect(onError).toHaveBeenCalledWith({
        code: 'VALIDATION_ERROR',
        message: errorMessage,
        details: 'Please provide at least 24 terms to generate bingo card variants.',
        retryable: true
      });
    });

    it('calls onError callback when generation fails', async () => {
      const onError = vi.fn();
      mockValidateTerms.mockReturnValue({ isValid: true });
      mockGenerateCardVariants.mockImplementation(() => {
        throw new Error('Generation failed');
      });

      render(<CardVariants cardData={validCardData} variantCount={1} onError={onError} />);

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith({
          code: 'GENERATION_ERROR',
          message: 'Generation failed',
          details: 'An error occurred while generating card variants. Please try again.',
          retryable: true
        });
      });
    });
  });

  describe('Variant Generation', () => {
    it('generates single variant', async () => {
      const mockVariants = [
        { ...validCardData, arrangement: [1, 2, 3] }
      ];
      
      mockValidateTerms.mockReturnValue({ isValid: true });
      mockGenerateCardVariants.mockReturnValue(mockVariants);

      render(<CardVariants cardData={validCardData} variantCount={1} />);

      await waitFor(() => {
        expect(mockGenerateCardVariants).toHaveBeenCalledWith({
          title: validCardData.title,
          terms: validCardData.terms,
          freeSpaceImage: validCardData.freeSpaceImage,
          freeSpaceIcon: validCardData.freeSpaceIcon,
          arrangement: validCardData.arrangement
        }, 1);
        expect(screen.getByText('Card 1')).toBeInTheDocument();
      });
    });

    it('generates multiple variants', async () => {
      const mockVariants = [
        { ...validCardData, arrangement: [1, 2, 3] },
        { ...validCardData, arrangement: [4, 5, 6] },
        { ...validCardData, arrangement: [7, 8, 9] }
      ];
      
      mockValidateTerms.mockReturnValue({ isValid: true });
      mockGenerateCardVariants.mockReturnValue(mockVariants);

      render(<CardVariants cardData={validCardData} variantCount={3} />);

      await waitFor(() => {
        expect(mockGenerateCardVariants).toHaveBeenCalledWith({
          title: validCardData.title,
          terms: validCardData.terms,
          freeSpaceImage: validCardData.freeSpaceImage,
          freeSpaceIcon: validCardData.freeSpaceIcon,
          arrangement: validCardData.arrangement
        }, 3);
        expect(screen.getByText('Card 1')).toBeInTheDocument();
        expect(screen.getByText('Card 2')).toBeInTheDocument();
        expect(screen.getByText('Card 3')).toBeInTheDocument();
      });
    });

    it('displays all generated variants in horizontal row layout', async () => {
      const mockVariants = [
        { ...validCardData, arrangement: [1, 2, 3] },
        { ...validCardData, arrangement: [4, 5, 6] }
      ];
      
      mockValidateTerms.mockReturnValue({ isValid: true });
      mockGenerateCardVariants.mockReturnValue(mockVariants);

      render(<CardVariants cardData={validCardData} variantCount={2} />);

      await waitFor(() => {
        const bingoCards = screen.getAllByTestId('bingo-card');
        expect(bingoCards).toHaveLength(2);
        
        // Check that cards are in horizontal layout container
        const variantsRow = screen.getByRole('region');
        expect(variantsRow).toBeInTheDocument();
        expect(variantsRow).toHaveAttribute('aria-label', '2 bingo card variants');
      });
    });

    it('displays progress bar during generation', async () => {
      mockValidateTerms.mockReturnValue({ isValid: true });
      mockGenerateCardVariants.mockReturnValue([validCardData]);

      render(<CardVariants cardData={validCardData} variantCount={1} />);

      // Should show loading with progress
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
      
      await waitFor(() => {
        expect(screen.getByTestId('bingo-card')).toBeInTheDocument();
      });
    });

    it('uses memoized validation for performance', async () => {
      mockValidateTerms.mockReturnValue({ isValid: true });
      mockGenerateCardVariants.mockReturnValue([validCardData]);

      const { rerender } = render(<CardVariants cardData={validCardData} variantCount={1} />);

      // Rerender with same cardData should not call validateTerms again
      rerender(<CardVariants cardData={validCardData} variantCount={2} />);

      // validateTerms should only be called once due to memoization
      expect(mockValidateTerms).toHaveBeenCalledTimes(1);
    });
  });

  describe('Performance Optimization', () => {
    it('memoizes validation to prevent unnecessary recalculations', () => {
      mockValidateTerms.mockReturnValue({ isValid: true });
      mockGenerateCardVariants.mockReturnValue([validCardData]);

      const { rerender } = render(<CardVariants cardData={validCardData} variantCount={1} />);
      
      // Clear mock calls from initial render
      mockValidateTerms.mockClear();
      
      // Rerender with same cardData.terms should not call validateTerms again
      rerender(<CardVariants cardData={validCardData} variantCount={2} />);
      
      expect(mockValidateTerms).not.toHaveBeenCalled();
    });

    it('regenerates variants only when necessary', () => {
      mockValidateTerms.mockReturnValue({ isValid: true });
      mockGenerateCardVariants.mockReturnValue([validCardData]);

      const { rerender } = render(<CardVariants cardData={validCardData} variantCount={1} />);
      
      // Clear mock calls from initial render
      mockGenerateCardVariants.mockClear();
      
      // Rerender with same props should not regenerate
      rerender(<CardVariants cardData={validCardData} variantCount={1} />);
      
      expect(mockGenerateCardVariants).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility and Navigation', () => {
    it('supports keyboard navigation', async () => {
      const mockVariants = [
        { ...validCardData, arrangement: [1, 2, 3] },
        { ...validCardData, arrangement: [4, 5, 6] }
      ];
      
      mockValidateTerms.mockReturnValue({ isValid: true });
      mockGenerateCardVariants.mockReturnValue(mockVariants);

      render(<CardVariants cardData={validCardData} variantCount={2} />);

      await waitFor(() => {
        const scrollContainer = screen.getByRole('region');
        expect(scrollContainer).toHaveAttribute('tabIndex', '0');
        expect(scrollContainer).toHaveAttribute('aria-describedby', 'variants-instructions');
      });
    });

    it('provides screen reader instructions', async () => {
      mockValidateTerms.mockReturnValue({ isValid: true });
      mockGenerateCardVariants.mockReturnValue([validCardData]);

      render(<CardVariants cardData={validCardData} variantCount={1} />);

      await waitFor(() => {
        const instructions = screen.getByText(/use arrow keys to scroll/i);
        expect(instructions).toBeInTheDocument();
      });
    });
  });

  describe('Edge Cases', () => {
    it('handles empty variants array', async () => {
      mockValidateTerms.mockReturnValue({ isValid: true });
      mockGenerateCardVariants.mockReturnValue([]);

      render(<CardVariants cardData={validCardData} variantCount={1} />);

      await waitFor(() => {
        expect(screen.getByText('No variants generated yet.')).toBeInTheDocument();
      });
    });

    it('updates variants when cardData changes', async () => {
      const newCardData = { ...validCardData, title: 'Updated Card' };
      mockValidateTerms.mockReturnValue({ isValid: true });
      mockGenerateCardVariants.mockReturnValue([validCardData]);

      const { rerender } = render(<CardVariants cardData={validCardData} variantCount={1} />);

      await waitFor(() => {
        expect(mockGenerateCardVariants).toHaveBeenCalledWith({
          title: validCardData.title,
          terms: validCardData.terms,
          freeSpaceImage: validCardData.freeSpaceImage,
          freeSpaceIcon: validCardData.freeSpaceIcon,
          arrangement: validCardData.arrangement
        }, 1);
      });

      mockGenerateCardVariants.mockReturnValue([newCardData]);
      rerender(<CardVariants cardData={newCardData} variantCount={1} />);

      await waitFor(() => {
        expect(mockGenerateCardVariants).toHaveBeenCalledWith({
          title: newCardData.title,
          terms: newCardData.terms,
          freeSpaceImage: newCardData.freeSpaceImage,
          freeSpaceIcon: newCardData.freeSpaceIcon,
          arrangement: newCardData.arrangement
        }, 1);
      });
    });

    it('updates variants when variantCount changes', async () => {
      mockValidateTerms.mockReturnValue({ isValid: true });
      mockGenerateCardVariants.mockReturnValue([validCardData]);

      const { rerender } = render(<CardVariants cardData={validCardData} variantCount={1} />);

      await waitFor(() => {
        expect(mockGenerateCardVariants).toHaveBeenCalledWith({
          title: validCardData.title,
          terms: validCardData.terms,
          freeSpaceImage: validCardData.freeSpaceImage,
          freeSpaceIcon: validCardData.freeSpaceIcon,
          arrangement: validCardData.arrangement
        }, 1);
      });

      mockGenerateCardVariants.mockClear();
      mockGenerateCardVariants.mockReturnValue([validCardData, validCardData]);
      
      rerender(<CardVariants cardData={validCardData} variantCount={2} />);

      await waitFor(() => {
        expect(mockGenerateCardVariants).toHaveBeenCalledWith({
          title: validCardData.title,
          terms: validCardData.terms,
          freeSpaceImage: validCardData.freeSpaceImage,
          freeSpaceIcon: validCardData.freeSpaceIcon,
          arrangement: validCardData.arrangement
        }, 2);
      });
    });

    it('handles unique keys for variants properly', async () => {
      const mockVariants = [
        { ...validCardData, arrangement: [1, 2, 3] },
        { ...validCardData, arrangement: [4, 5, 6] }
      ];
      
      mockValidateTerms.mockReturnValue({ isValid: true });
      mockGenerateCardVariants.mockReturnValue(mockVariants);

      render(<CardVariants cardData={validCardData} variantCount={2} />);

      await waitFor(() => {
        const articles = screen.getAllByRole('article');
        expect(articles).toHaveLength(2);
        
        // Check that each variant has unique labeling
        expect(articles[0]).toHaveAttribute('aria-label', 'Bingo card variant 1 of 2');
        expect(articles[1]).toHaveAttribute('aria-label', 'Bingo card variant 2 of 2');
        expect(screen.getByText('Card 1')).toBeInTheDocument();
        expect(screen.getByText('Card 2')).toBeInTheDocument();
      });
    });

    it('uses React.memo for performance optimization', () => {
      // Test that the component is memoized
      expect(CardVariants.displayName).toBe(undefined); // React.memo doesn't set displayName by default
      expect(typeof CardVariants).toBe('object'); // Memoized components are objects, not functions
    });
  });
});