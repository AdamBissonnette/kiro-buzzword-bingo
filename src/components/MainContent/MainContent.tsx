import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import BingoCard from '../BingoCard';
import LoadingSpinner from '../LoadingSpinner';
import ErrorMessage from '../ErrorMessage';
import { generateCardVariants, validateTerms } from '../../utils/cardGenerator';
import { useThrottledCallback, useStableCallback } from '../../utils/performanceOptimizations';
import { usePerformanceMonitor, useRenderTracker } from '../../utils/performanceMonitor';
import type { CardData, LoadingState, AppError } from '../../types';
import styles from './MainContent.module.css';

interface MainContentProps {
  cardData: CardData | null;
  showVariants: boolean;
  variantCount: number;
  onSquareClick?: (index: number) => void;
  isLoading?: boolean;
  error?: AppError | null;
}

export const MainContent: React.FC<MainContentProps> = React.memo(({
  cardData,
  showVariants,
  variantCount,
  onSquareClick,
  isLoading = false,
  error = null
}) => {
  const [variants, setVariants] = useState<Omit<CardData, 'id' | 'createdAt' | 'updatedAt'>[]>([]);
  const [variantError, setVariantError] = useState<string>('');
  const [isGeneratingVariants, setIsGeneratingVariants] = useState<boolean>(false);
  const [loadingState, setLoadingState] = useState<LoadingState>({ isLoading: false });
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Performance monitoring in development
  const { startMeasure } = usePerformanceMonitor('MainContent');
  useRenderTracker('MainContent', { 
    cardData: cardData?.id, 
    showVariants, 
    variantCount, 
    isLoading, 
    error: error?.code 
  });
  
  React.useLayoutEffect(() => {
    const endMeasure = startMeasure();
    return endMeasure;
  });

  // Memoize validation to prevent unnecessary recalculations
  const validation = useMemo(() => {
    return cardData ? validateTerms(cardData.terms) : { isValid: false, error: 'No card data' };
  }, [cardData]);

  const generateVariants = useCallback(async () => {
    if (!cardData || !showVariants) return;

    if (!validation.isValid) {
      setVariantError(validation.error || 'Invalid terms provided');
      setVariants([]);
      return;
    }
    
    setVariantError('');
    setIsGeneratingVariants(true);
    setLoadingState({ 
      isLoading: true, 
      message: `Generating ${variantCount} card variants...`,
      progress: 0
    });

    try {
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setLoadingState(prev => ({
          ...prev,
          progress: Math.min((prev.progress || 0) + 20, 90)
        }));
      }, 100);

      const newVariants = generateCardVariants({
        title: cardData.title,
        terms: cardData.terms,
        freeSpaceImage: cardData.freeSpaceImage,
        freeSpaceIcon: cardData.freeSpaceIcon,
        arrangement: cardData.arrangement
      }, variantCount);

      clearInterval(progressInterval);
      setLoadingState({ isLoading: true, progress: 100 });
      
      // Small delay to show completion
      setTimeout(() => {
        setVariants(newVariants);
        setIsGeneratingVariants(false);
        setLoadingState({ isLoading: false });
      }, 200);

    } catch (err) {
      setVariantError(err instanceof Error ? err.message : 'Failed to generate variants');
      setVariants([]);
      setIsGeneratingVariants(false);
      setLoadingState({ isLoading: false });
    }
  }, [cardData, variantCount, showVariants, validation]);



  // Optimized keyboard navigation with throttling
  const handleKeyDown = useThrottledCallback((event: React.KeyboardEvent) => {
    if (!showVariants || variants.length === 0) return;
    
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
  }, 100, [showVariants, variants.length]);

  // Optimized touch handlers with stable callbacks
  const handleTouchStart = useStableCallback((event: React.TouchEvent) => {
    const touch = event.touches[0];
    if (touch && scrollContainerRef.current) {
      scrollContainerRef.current.dataset.startX = touch.clientX.toString();
    }
  });

  const handleTouchMove = useThrottledCallback((event: React.TouchEvent) => {
    const touch = event.touches[0];
    const container = scrollContainerRef.current;
    if (!touch || !container || !container.dataset.startX) return;

    const startX = parseInt(container.dataset.startX);
    const currentX = touch.clientX;
    const diffX = startX - currentX;

    // Smooth scrolling during touch
    container.scrollLeft += diffX * 0.5;
    container.dataset.startX = currentX.toString();
  }, 16, []); // 60fps throttling

  // Generate variants when cardData, variantCount, or showVariants changes
  useEffect(() => {
    if (showVariants && cardData) {
      generateVariants();
    } else {
      setVariants([]);
      setVariantError('');
      setIsGeneratingVariants(false);
      setLoadingState({ isLoading: false });
    }
  }, [showVariants, cardData, generateVariants]);

  // Handle empty state
  if (!cardData) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyStateContent}>
          <h2>Create Your First Bingo Card</h2>
          <p>Use the sidebar to create a new bingo card with your custom terms.</p>
        </div>
      </div>
    );
  }

  // Handle loading state
  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <LoadingSpinner />
        <p className={styles.loadingText}>Loading card data...</p>
      </div>
    );
  }

  // Handle error state
  if (error) {
    return (
      <div className={styles.errorContainer}>
        <ErrorMessage 
          error={error}
          onRetry={error.retryable ? () => window.location.reload() : undefined}
          showDetails={true}
        />
      </div>
    );
  }

  return (
    <div className={styles.mainContent}>
      {showVariants ? (
        <div className={styles.variantsContainer}>
          {/* Variants Header */}
          <div className={styles.variantsHeader}>
            <h2 className={styles.variantsTitle}>
              {variantCount} Card Variant{variantCount !== 1 ? 's' : ''}
            </h2>
            <p className={styles.variantsSubtitle}>
              Each card has a unique arrangement of your terms
            </p>
          </div>

          {/* Loading State for Variants */}
          {isGeneratingVariants && (
            <div className={styles.variantLoadingContainer}>
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
          )}

          {/* Error State for Variants */}
          {variantError && (
            <div className={styles.variantErrorContainer}>
              <ErrorMessage 
                error={{
                  code: 'VALIDATION_ERROR',
                  message: variantError,
                  details: 'Please provide at least 24 terms to generate bingo card variants.',
                  retryable: true
                }}
                onRetry={() => generateVariants()}
                showDetails={true}
              />
            </div>
          )}

          {/* Variants Display - Enhanced Horizontal Scrollable Row */}
          {!isGeneratingVariants && !variantError && variants.length > 0 && (
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
                {variants.map((variant, index) => (
                  <div 
                    key={index} 
                    className={styles.variantCard}
                    role="article"
                    aria-label={`Bingo card variant ${index + 1} of ${variants.length}`}
                  >
                    <div className={styles.variantHeader}>
                      <span className={styles.variantNumber}>
                        Card {index + 1}
                      </span>
                    </div>
                    <div className={styles.variantCardWrapper}>
                      <BingoCard
                        title={variant.title}
                        terms={variant.terms}
                        freeSpaceImage={variant.freeSpaceImage}
                        freeSpaceIcon={variant.freeSpaceIcon}
                        arrangement={variant.arrangement}
                        isPlayMode={false}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty Variants State */}
          {!isGeneratingVariants && !variantError && variants.length === 0 && (
            <div className={styles.emptyVariantsState}>
              <p>No variants generated yet.</p>
            </div>
          )}
        </div>
      ) : (
        <div className={styles.singleCardContainer}>
          <BingoCard
            title={cardData.title}
            terms={cardData.terms}
            freeSpaceImage={cardData.freeSpaceImage}
            freeSpaceIcon={cardData.freeSpaceIcon}
            isPlayMode={true}
            onSquareClick={onSquareClick}
            arrangement={cardData.arrangement}
          />
        </div>
      )}
    </div>
  );
});

MainContent.displayName = 'MainContent';

export default MainContent;