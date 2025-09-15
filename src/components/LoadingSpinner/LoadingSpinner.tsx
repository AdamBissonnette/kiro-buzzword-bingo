import React, { useMemo } from 'react';
import styles from './LoadingSpinner.module.css';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  message?: string;
  progress?: number;
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = React.memo(({
  size = 'medium',
  message,
  progress,
  className = ''
}) => {
  // Memoize progress calculations to prevent unnecessary re-renders
  const progressValue = useMemo(() => {
    if (typeof progress !== 'number') return undefined;
    return Math.min(100, Math.max(0, progress));
  }, [progress]);

  const progressText = useMemo(() => {
    if (typeof progress !== 'number') return undefined;
    return Math.round(progress);
  }, [progress]);

  return (
    <div className={`${styles.container} ${className}`}>
      <div className={`${styles.spinner} ${styles[size]}`}>
        <div className={styles.spinnerInner}></div>
      </div>
      
      {message && (
        <p className={styles.message}>{message}</p>
      )}
      
      {typeof progress === 'number' && (
        <div className={styles.progressContainer}>
          <div className={styles.progressBar}>
            <div 
              className={styles.progressFill}
              style={{ width: `${progressValue}%` }}
            />
          </div>
          <span className={styles.progressText}>
            {progressText}%
          </span>
        </div>
      )}
    </div>
  );
});

LoadingSpinner.displayName = 'LoadingSpinner';

export default LoadingSpinner;