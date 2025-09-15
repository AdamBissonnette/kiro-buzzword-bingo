import React, { useMemo } from 'react';
import type { AppError } from '../../types';
import styles from './ErrorMessage.module.css';

interface ErrorMessageProps {
  error: AppError;
  onRetry?: () => void;
  onDismiss?: () => void;
  showDetails?: boolean;
  className?: string;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = React.memo(({
  error,
  onRetry,
  onDismiss,
  showDetails = false,
  className = ''
}) => {
  // Memoize error icon and severity calculations
  const { icon, severity } = useMemo(() => {
    const getErrorIcon = (errorCode: string) => {
      switch (errorCode) {
        case 'VALIDATION_ERROR':
          return '⚠️';
        case 'PDF_EXPORT_ERROR':
          return '📄';
        case 'URL_PARSING_ERROR':
          return '🔗';
        case 'NETWORK_ERROR':
          return '🌐';
        case 'BROWSER_COMPATIBILITY_ERROR':
          return '🌍';
        default:
          return '❌';
      }
    };

    const getErrorSeverity = (errorCode: string) => {
      switch (errorCode) {
        case 'VALIDATION_ERROR':
          return 'warning';
        case 'BROWSER_COMPATIBILITY_ERROR':
          return 'info';
        default:
          return 'error';
      }
    };

    return {
      icon: getErrorIcon(error.code),
      severity: getErrorSeverity(error.code)
    };
  }, [error.code]);

  return (
    <div className={`${styles.errorMessage} ${styles[severity]} ${className}`}>
      <div className={styles.errorHeader}>
        <span className={styles.errorIcon}>{icon}</span>
        <span className={styles.errorText}>{error.message}</span>
        {onDismiss && (
          <button
            className={styles.dismissButton}
            onClick={onDismiss}
            aria-label="Dismiss error"
          >
            ×
          </button>
        )}
      </div>

      {error.details && showDetails && (
        <div className={styles.errorDetails}>
          <p>{error.details}</p>
        </div>
      )}

      {(onRetry || onDismiss) && (
        <div className={styles.errorActions}>
          {onRetry && error.retryable && (
            <button
              className={styles.retryButton}
              onClick={onRetry}
            >
              Try Again
            </button>
          )}
          {onDismiss && (
            <button
              className={styles.dismissActionButton}
              onClick={onDismiss}
            >
              Dismiss
            </button>
          )}
        </div>
      )}
    </div>
  );
});

ErrorMessage.displayName = 'ErrorMessage';

export default ErrorMessage;