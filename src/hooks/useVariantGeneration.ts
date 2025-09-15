import { useState, useCallback, useRef, useMemo } from 'react';
import type { CardData, LoadingState } from '../types';
import { generateCardVariants, validateTerms } from '../utils/cardGenerator';

interface VariantGenerationOptions {
  batchSize?: number;
  maxConcurrent?: number;
  enableProgressTracking?: boolean;
}

interface UseVariantGenerationReturn {
  variants: Omit<CardData, 'id' | 'createdAt' | 'updatedAt'>[];
  isGenerating: boolean;
  loadingState: LoadingState;
  error: string | null;
  generateVariants: (
    cardData: CardData, 
    count: number, 
    options?: VariantGenerationOptions
  ) => Promise<void>;
  cancelGeneration: () => void;
  clearVariants: () => void;
}

/**
 * Optimized hook for variant generation with lazy loading, progress tracking,
 * and memory optimization for large numbers of variants.
 */
export function useVariantGeneration(): UseVariantGenerationReturn {
  const [variants, setVariants] = useState<Omit<CardData, 'id' | 'createdAt' | 'updatedAt'>[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingState, setLoadingState] = useState<LoadingState>({ isLoading: false });
  const [error, setError] = useState<string | null>(null);
  
  // Refs for cancellation and cleanup
  const abortControllerRef = useRef<AbortController | null>(null);
  const progressIntervalRef = useRef<number | null>(null);
  const generationTimeoutRef = useRef<number | null>(null);

  // Cleanup function to clear all timers and controllers
  const cleanup = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    if (generationTimeoutRef.current) {
      clearTimeout(generationTimeoutRef.current);
      generationTimeoutRef.current = null;
    }
  }, []);

  // Optimized batch generation with memory management
  const generateVariantsBatch = useCallback(async (
    cardData: Omit<CardData, 'id' | 'createdAt' | 'updatedAt'>,
    _startIndex: number,
    batchSize: number,
    signal: AbortSignal
  ): Promise<Omit<CardData, 'id' | 'createdAt' | 'updatedAt'>[]> => {
    return new Promise((resolve, reject) => {
      // Use setTimeout to yield control and prevent blocking
      const timeoutId = setTimeout(() => {
        try {
          if (signal.aborted) {
            reject(new Error('Generation cancelled'));
            return;
          }

          const batchVariants = generateCardVariants(cardData, batchSize);
          resolve(batchVariants);
        } catch (err) {
          reject(err);
        }
      }, 0);

      // Handle cancellation
      signal.addEventListener('abort', () => {
        clearTimeout(timeoutId);
        reject(new Error('Generation cancelled'));
      });
    });
  }, []);

  // Main variant generation function with optimizations
  const generateVariants = useCallback(async (
    cardData: CardData,
    count: number,
    options: VariantGenerationOptions = {}
  ) => {
    const {
      batchSize = Math.min(count, 5), // Process in smaller batches
      enableProgressTracking = true
    } = options;

    // Validate input
    const validation = validateTerms(cardData.terms);
    if (!validation.isValid) {
      setError(validation.error || 'Invalid terms provided');
      return;
    }

    // Cleanup any existing generation
    cleanup();

    // Initialize state
    setError(null);
    setIsGenerating(true);
    setVariants([]); // Clear existing variants to free memory
    
    if (enableProgressTracking) {
      setLoadingState({
        isLoading: true,
        message: `Generating ${count} card variants...`,
        progress: 0
      });
    }

    // Create abort controller for cancellation
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      const baseCardData = {
        title: cardData.title,
        terms: cardData.terms,
        freeSpaceImage: cardData.freeSpaceImage,
        freeSpaceIcon: cardData.freeSpaceIcon,
        arrangement: cardData.arrangement
      };

      const allVariants: Omit<CardData, 'id' | 'createdAt' | 'updatedAt'>[] = [];
      const totalBatches = Math.ceil(count / batchSize);
      let completedBatches = 0;

      // Progress tracking
      if (enableProgressTracking) {
        progressIntervalRef.current = setInterval(() => {
          const progress = Math.min((completedBatches / totalBatches) * 90, 90);
          setLoadingState(prev => ({
            ...prev,
            progress
          }));
        }, 100);
      }

      // Process variants in batches to prevent memory spikes
      for (let i = 0; i < count; i += batchSize) {
        if (abortController.signal.aborted) {
          throw new Error('Generation cancelled');
        }

        const currentBatchSize = Math.min(batchSize, count - i);
        
        // Generate batch with memory optimization
        const batchVariants = await generateVariantsBatch(
          baseCardData,
          i,
          currentBatchSize,
          abortController.signal
        );

        // Add to results and update progress
        allVariants.push(...batchVariants);
        completedBatches++;

        // Yield control to prevent blocking UI
        await new Promise(resolve => setTimeout(resolve, 0));
      }

      // Clear progress interval
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }

      // Final progress update
      if (enableProgressTracking) {
        setLoadingState({
          isLoading: true,
          message: 'Finalizing variants...',
          progress: 100
        });
      }

      // Small delay to show completion
      generationTimeoutRef.current = setTimeout(() => {
        setVariants(allVariants);
        setIsGenerating(false);
        setLoadingState({ isLoading: false });
      }, 200);

    } catch (err) {
      cleanup();
      
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate variants';
      setError(errorMessage);
      setIsGenerating(false);
      setLoadingState({ isLoading: false });
      
      // Clear variants on error to free memory
      setVariants([]);
    }
  }, [cleanup, generateVariantsBatch]);

  // Cancel generation
  const cancelGeneration = useCallback(() => {
    cleanup();
    setIsGenerating(false);
    setLoadingState({ isLoading: false });
    setError('Generation cancelled');
  }, [cleanup]);

  // Clear variants and free memory
  const clearVariants = useCallback(() => {
    setVariants([]);
    setError(null);
    setLoadingState({ isLoading: false });
  }, []);

  // Memoized return value to prevent unnecessary re-renders
  const returnValue = useMemo((): UseVariantGenerationReturn => ({
    variants,
    isGenerating,
    loadingState,
    error,
    generateVariants,
    cancelGeneration,
    clearVariants
  }), [
    variants,
    isGenerating,
    loadingState,
    error,
    generateVariants,
    cancelGeneration,
    clearVariants
  ]);

  return returnValue;
}

export default useVariantGeneration;