import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useVariantGeneration } from '../useVariantGeneration';
import type { CardData } from '../../types';

// Mock the card generator utilities
vi.mock('../../utils/cardGenerator', () => ({
  generateCardVariants: vi.fn(),
  validateTerms: vi.fn()
}));

import { generateCardVariants, validateTerms } from '../../utils/cardGenerator';

const mockGenerateCardVariants = generateCardVariants as ReturnType<typeof vi.fn>;
const mockValidateTerms = validateTerms as ReturnType<typeof vi.fn>;

describe('useVariantGeneration', () => {
  const mockCardData: CardData = {
    id: 'test-card',
    title: 'Test Card',
    terms: Array.from({ length: 25 }, (_, i) => `Term ${i + 1}`),
    freeSpaceIcon: 'star',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockValidateTerms.mockReturnValue({ isValid: true });
    mockGenerateCardVariants.mockImplementation((cardData, count) => 
      Array.from({ length: count }, () => ({
        ...cardData,
        arrangement: Array.from({ length: 25 }, (_, j) => j === 12 ? -1 : j)
      }))
    );
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should initialize with empty state', () => {
    const { result } = renderHook(() => useVariantGeneration());

    expect(result.current.variants).toEqual([]);
    expect(result.current.isGenerating).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.loadingState.isLoading).toBe(false);
  });

  it('should generate variants successfully', async () => {
    const { result } = renderHook(() => useVariantGeneration());

    await act(async () => {
      await result.current.generateVariants(mockCardData, 3);
    });

    await waitFor(() => {
      expect(result.current.variants).toHaveLength(3);
      expect(result.current.isGenerating).toBe(false);
      expect(result.current.error).toBeNull();
    });

    expect(mockGenerateCardVariants).toHaveBeenCalledWith(
      expect.objectContaining({
        title: mockCardData.title,
        terms: mockCardData.terms
      }),
      3
    );
  });

  it('should handle validation errors', async () => {
    mockValidateTerms.mockReturnValue({ 
      isValid: false, 
      error: 'Insufficient terms' 
    });

    const { result } = renderHook(() => useVariantGeneration());

    await act(async () => {
      await result.current.generateVariants(mockCardData, 3);
    });

    expect(result.current.error).toBe('Insufficient terms');
    expect(result.current.variants).toEqual([]);
    expect(result.current.isGenerating).toBe(false);
  });

  it('should handle generation errors', async () => {
    mockGenerateCardVariants.mockImplementation(() => {
      throw new Error('Generation failed');
    });

    const { result } = renderHook(() => useVariantGeneration());

    await act(async () => {
      await result.current.generateVariants(mockCardData, 3);
    });

    expect(result.current.error).toBe('Generation failed');
    expect(result.current.variants).toEqual([]);
    expect(result.current.isGenerating).toBe(false);
  });

  it('should support cancellation', async () => {
    vi.useFakeTimers();
    
    const { result } = renderHook(() => useVariantGeneration());

    // Start generation
    act(() => {
      result.current.generateVariants(mockCardData, 10);
    });

    // Cancel immediately
    act(() => {
      result.current.cancelGeneration();
    });

    // Fast-forward timers
    act(() => {
      vi.runAllTimers();
    });

    expect(result.current.isGenerating).toBe(false);
    expect(result.current.error).toBe('Generation cancelled');
  });

  it('should clear variants', () => {
    const { result } = renderHook(() => useVariantGeneration());

    // Set some initial state
    act(() => {
      result.current.generateVariants(mockCardData, 3);
    });

    act(() => {
      result.current.clearVariants();
    });

    expect(result.current.variants).toEqual([]);
    expect(result.current.error).toBeNull();
    expect(result.current.loadingState.isLoading).toBe(false);
  });

  it('should use custom batch size', async () => {
    const { result } = renderHook(() => useVariantGeneration());

    await act(async () => {
      await result.current.generateVariants(mockCardData, 10, {
        batchSize: 2,
        enableProgressTracking: true
      });
    });

    await waitFor(() => {
      expect(result.current.variants).toHaveLength(10);
    });

    // Should have been called multiple times due to batching
    expect(mockGenerateCardVariants).toHaveBeenCalled();
  });

  it('should track progress when enabled', async () => {
    const { result } = renderHook(() => useVariantGeneration());
    
    act(() => {
      result.current.generateVariants(mockCardData, 5, {
        enableProgressTracking: true
      });
    });

    // Initially should show loading
    expect(result.current.loadingState.isLoading).toBe(true);
    
    await waitFor(() => {
      expect(result.current.variants).toHaveLength(5);
    });
  });

  it('should optimize memory usage by clearing variants on new generation', async () => {
    const { result } = renderHook(() => useVariantGeneration());

    // Generate first batch
    await act(async () => {
      await result.current.generateVariants(mockCardData, 3);
    });

    await waitFor(() => {
      expect(result.current.variants).toHaveLength(3);
    });

    // Generate second batch - should clear previous variants
    await act(async () => {
      await result.current.generateVariants(mockCardData, 5);
    });

    await waitFor(() => {
      expect(result.current.variants).toHaveLength(5);
    });
  });
});