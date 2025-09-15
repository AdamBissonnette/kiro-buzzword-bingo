import React, { useEffect, useMemo, useCallback, useRef, useState } from 'react';
import BingoCard from '../BingoCard/BingoCard';
import LoadingSpinner from '../LoadingSpinner';
import ErrorMessage from '../ErrorMessage';
import { useVariantGeneration } from '../../hooks/useVariantGeneration';
import { validateTerms } from '../../utils/cardGenerator';
import type { CardData, AppError } from '../../types';
import styles from './CardVariants.module.css';

interface CardVariantsProps {
  cardData: CardData;
  variantCount: number;
  onError?: (error: AppError) => void;
  className?: string;
  enableLazyLoading?: boolean;
  batchSize?: number;
}

const CardVariants: React.FC<CardVariantsProps> = React.memo(({
  cardData,
  variantCount,
  onError,
  className,
  enableLazyLoading = true,
  batchSize = 5
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: Math.min(batchSize, variantCount) });
  
  // Use optimized variant generation hook
  const {
    variants,
    isGenerating,
    loadingState,
    error: generationError,
    generateVariants,
    cancelGeneration,
    clearVariants
  } = useVariantGeneration();

  // Memoize validation to prevent unnecessary recalculations
  const validation = useMemo(() => {
    return validateTerms(cardData.terms);
  }, [cardData.terms]);

  // Handle generation with optimized options
  const handleGenerateVariants = useCallback(async () => {
    if (!validation.isValid) {
      const errorMessage = validation.error || 'Invalid terms provided';
      
      // Notify parent component of error
      onError?.({
        code: 'VALIDATION_ERROR',
        message: errorMessage,
        details: 'Please provide at least 24 terms to generate bingo card variants.',
        retryable: true
      });
      return;
    }

    try {
      await generateVariants(cardData, variantCount, {
        batchSize,
        maxConcurrent: 2,
        enableProgressTracking: true
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate variants';
      
      // Notify parent component of error
      onError?.({
        code: 'GENERATION_ERROR',
        message: errorMessage,
        details: 'An error occurred while generating card variants. Please try again.',
        retryable: true
      });
    }
  }, [cardData, variantCount, validation.isValid, validation.error, onError, generateVariants, batchSize]);

  // Lazy loading for visible variants
  const handleScroll = useCallback(() => {
    if (!enableLazyLoading || variants.length === 0) return;
    
    const container = scrollContainerRef.current;
    if (!container) return;

    const containerWidth = container.clientWidth;
    const scrollLeft = container.scrollLeft;
    const cardWidth = 360; // Approximate card width including margins
    
    const startIndex = Math.max(0, Math.floor(scrollLeft / cardWidth) - 1);
    const endIndex = Math.min(variants.length, startIndex + Math.ceil(containerWidth / cardWidth) + 2);
    
    setVisibleRange({ start: startIndex, end: endIndex });
  }, [enableLazyLoading, variants.length]);

  // Throttled scroll handler for performance
  const throttledScrollHandler = useCallback(() => {
    let ticking = false;
    
    return () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };
  }, [handleScroll]);



  // Keyboard navigation for horizontal scrolling
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (variants.length === 0) return;
    
    const container = scrollContainerRef.current;
    if (!container) return;

    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault();
        container.scrollBy({ left: -360, behavior: 'smooth' });
        break;
      case 'ArrowRight':
        event.preventDefault();
        container.scrollBy({ left: 360, behavior: 'smooth' });
        break;
      case 'Home':
        event.preventDefault();
        container.scrollTo({ left: 0, behavior: 'smooth' });
        break;
      case 'End':
        event.preventDefault();
        container.scrollTo({ left: container.scrollWidth, behavior: 'smooth' });
        break;
    }
  }, [variants.length]);

  // Touch/swipe support for mobile
  const handleTouchStart = useCallback((event: React.TouchEvent) => {
    const touch = event.touches[0];
    if (touch && scrollContainerRef.current) {
      scrollContainerRef.current.dataset.startX = touch.clientX.toString();
    }
  }, []);

  const handleTouchMove = useCallback((event: React.TouchEvent) => {
    const touch = event.touches[0];
    const container = scrollContainerRef.current;
    if (!touch || !container || !container.dataset.startX) return;

    const startX = parseInt(container.dataset.startX);
    const currentX = touch.clientX;
    const diffX = startX - currentX;

    // Smooth scrolling during touch
    container.scrollLeft += diffX * 0.5;
    container.dataset.startX = currentX.toString();
  }, []);

  // Generate variants when cardData or variantCount changes
  useEffect(() => {
    handleGenerateVariants();
  }, [handleGenerateVariants]);

  // Set up scroll listener for lazy loading
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || !enableLazyLoading) return;

    const scrollHandler = throttledScrollHandler();
    container.addEventListener('scroll', scrollHandler, { passive: true });
    
    // Initial calculation
    handleScroll();

    return () => {
      container.removeEventListener('scroll', scrollHandler);
    };
  }, [enableLazyLoading, throttledScrollHandler, handleScroll]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancelGeneration();
      clearVariants();
    };
  }, [cancelGeneration, clearVariants]);

  // Handle error state
  if (generationError) {
    return (
      <div className={`${styles.cardVariants} ${className || ''}`}>
        <div className={styles.errorContainer}>
          <ErrorMessage 
            error={{
              code: 'VALIDATION_ERROR',
              message: generationError,
              details: 'Please provide at least 24 terms to generate bingo card variants.',
              retryable: true
            }}
            onRetry={() => handleGenerateVariants()}
            showDetails={true}
          />
        </div>
      </div>
    );
  }

  // Handle loading state
  if (isGenerating) {
    return (
      <div className={`${styles.cardVariants} ${className || ''}`}>
        <div className={styles.loadingContainer}>
          <LoadingSpinner />
          <p className={styles.loadingText}>
            {loadingState.message || `Generating ${variantCount} card variants...`}
          </p>
          {loadingState.progress !== undefined && (
            <div className={styles.progressBar}>
              <div 
                className={styles.progressFill}
                style={{ width: `${loadingState.progress}%` }}
              />
            </div>
          )}
        </div>
      </div>
    );
  }

  // Handle empty state
  if (variants.length === 0) {
    return (
      <div className={`${styles.cardVariants} ${className || ''}`}>
        <div className={styles.emptyState}>
          <p>No variants generated yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.cardVariants} ${className || ''}`}>
      {/* Variants Header */}
      <div className={styles.variantsHeader}>
        <h2 className={styles.variantsTitle}>
          {variantCount} Card Variant{variantCount !== 1 ? 's' : ''}
        </h2>
        <p className={styles.variantsSubtitle}>
          Each card has a unique arrangement of your terms
        </p>
      </div>

      {/* Enhanced Horizontal Scrollable Row with Lazy Loading */}
      <div 
        ref={scrollContainerRef}
        className={styles.horizontalScrollContainer}
        onKeyDown={handleKeyDown}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        tabIndex={0}
        role="region"
        aria-label={`${variantCount} bingo card variants`}
        aria-describedby="variants-instructions"
      >
        <div 
          id="variants-instructions" 
          className="sr-only"
          aria-live="polite"
        >
          Use arrow keys to scroll through card variants, or swipe on touch devices
        </div>
        <div className={styles.variantsRow}>
          {variants.map((variant, index) => {
            // Lazy loading: only render visible variants
            const isVisible = !enableLazyLoading || 
              (index >= visibleRange.start && index < visibleRange.end);
            
            return (
              <div 
                key={`variant-${index}`} 
                className={styles.variantWrapper}
                role="article"
                aria-label={`Bingo card variant ${index + 1} of ${variants.length}`}
              >
                <div className={styles.variantHeader}>
                  <span 
                    id={`variant-label-${index}`}
                    className={styles.variantNumber}
                  >
                    Card {index + 1}
                  </span>
                </div>
                <div className={styles.variantCardWrapper}>
                  {isVisible ? (
                    <BingoCard
                      title={variant.title}
                      terms={variant.terms}
                      freeSpaceImage={variant.freeSpaceImage}
                      freeSpaceIcon={variant.freeSpaceIcon}
                      arrangement={variant.arrangement}
                      isPlayMode={false}
                    />
                  ) : (
                    <div className={styles.cardPlaceholder}>
                      <LoadingSpinner />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});

export default CardVariants;