import React, { useState, useCallback, useMemo } from 'react';
import { defaultIcons, type IconOption } from '../IconSelector';
import { usePerformanceMonitor, useRenderTracker } from '../../utils/performanceMonitor';
import styles from './BingoCard.module.css';

interface BingoCardProps {
  title: string;
  terms: string[];
  freeSpaceImage?: string;
  freeSpaceIcon?: string;
  isPlayMode?: boolean;
  onSquareClick?: (index: number) => void;
  arrangement?: number[]; // Optional arrangement for randomized cards
}

const BingoCard: React.FC<BingoCardProps> = React.memo(({
  title,
  terms,
  freeSpaceImage,
  freeSpaceIcon = 'star',
  isPlayMode = false,
  onSquareClick,
  arrangement
}) => {
  const [clickedSquares, setClickedSquares] = useState<Set<number>>(new Set());
  
  // Performance monitoring in development
  const { startMeasure } = usePerformanceMonitor('BingoCard');
  useRenderTracker('BingoCard', { title, terms: terms.length, freeSpaceImage, freeSpaceIcon, isPlayMode, arrangement });
  
  React.useLayoutEffect(() => {
    const endMeasure = startMeasure();
    return endMeasure;
  });

  const handleSquareClick = useCallback((index: number) => {
    if (!isPlayMode) return;
    
    setClickedSquares(prev => {
      const newClickedSquares = new Set(prev);
      if (newClickedSquares.has(index)) {
        newClickedSquares.delete(index);
      } else {
        newClickedSquares.add(index);
      }
      return newClickedSquares;
    });
    
    if (onSquareClick) {
      onSquareClick(index);
    }
  }, [isPlayMode, onSquareClick]);

  // Memoize icon data to prevent repeated lookups
  const iconData = useMemo(() => {
    return defaultIcons.find((icon: IconOption) => icon.id === freeSpaceIcon) || defaultIcons[0];
  }, [freeSpaceIcon]);

  const renderSquare = useCallback((index: number) => {
    const isFreeSpace = index === 12; // Center square (0-indexed)
    const isClicked = clickedSquares.has(index);
    
    let content;
    if (isFreeSpace) {
      if (freeSpaceImage) {
        content = (
          <img 
            src={freeSpaceImage} 
            alt="Free Space" 
            className={styles.freeSpaceImage}
          />
        );
      } else {
        content = (
          <span className={styles.freeSpaceIcon}>{iconData.icon}</span>
        );
      }
    } else {
      let termIndex;
      if (arrangement) {
        // Use arrangement if provided (for randomized cards)
        termIndex = arrangement[index];
        if (termIndex === -1) {
          // This shouldn't happen for non-free spaces, but handle gracefully
          termIndex = index > 12 ? index - 1 : index;
        }
      } else {
        // Default sequential arrangement
        termIndex = index > 12 ? index - 1 : index;
      }
      content = terms[termIndex] || '';
    }

    return (
      <div
        key={index}
        className={`${styles.square} ${isFreeSpace ? styles.freeSpace : ''} ${
          isPlayMode ? styles.playMode : ''
        }`}
        onClick={() => handleSquareClick(index)}
      >
        {content}
        {isClicked && <div className={styles.clickedOverlay} />}
      </div>
    );
  }, [clickedSquares, freeSpaceImage, iconData, arrangement, terms, isPlayMode, handleSquareClick]);

  // Memoize the squares array to prevent recreation on every render
  const squares = useMemo(() => {
    return Array.from({ length: 25 }, (_, index) => renderSquare(index));
  }, [renderSquare]);

  return (
    <div className={styles.bingoCard} data-card-element>
      <h2 className={styles.title}>{title}</h2>
      <div className={styles.grid}>
        {squares}
      </div>
    </div>
  );
});

BingoCard.displayName = 'BingoCard';

export default BingoCard;