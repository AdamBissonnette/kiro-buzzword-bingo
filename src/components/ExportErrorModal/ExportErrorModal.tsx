import React, { useState } from 'react';
import type { AppError } from '../../types';
import styles from './ExportErrorModal.module.css';

interface ExportErrorModalProps {
  isVisible: boolean;
  error: AppError | null;
  onRetry?: () => void;
  onDismiss: () => void;
  canRetry?: boolean;
}

interface TroubleshootingTip {
  title: string;
  description: string;
  action?: string;
}

export const ExportErrorModal: React.FC<ExportErrorModalProps> = ({
  isVisible,
  error,
  onRetry,
  onDismiss,
  canRetry = true
}) => {
  const [showTroubleshooting, setShowTroubleshooting] = useState(false);

  if (!isVisible || !error) {
    return null;
  }

  const getTroubleshootingTips = (errorCode: string): TroubleshootingTip[] => {
    switch (errorCode) {
      case 'PDF_EXPORT_ERROR':
        return [
          {
            title: 'Check card visibility',
            description: 'Ensure the bingo card is fully visible on screen before exporting.',
            action: 'Scroll to make sure the entire card is visible'
          },
          {
            title: 'Reduce export quality',
            description: 'Lower the export quality setting to reduce memory usage.',
            action: 'Try setting quality to 80% or lower'
          },
          {
            title: 'Close other browser tabs',
            description: 'Free up browser memory by closing unnecessary tabs.',
            action: 'Close tabs and try again'
          },
          {
            title: 'Try a different browser',
            description: 'Some browsers handle PDF generation better than others.',
            action: 'Use Chrome, Firefox, or Safari'
          }
        ];
      case 'BROWSER_COMPATIBILITY_ERROR':
        return [
          {
            title: 'Update your browser',
            description: 'Ensure you\'re using a modern, up-to-date browser.',
            action: 'Update to the latest version'
          },
          {
            title: 'Enable JavaScript',
            description: 'PDF export requires JavaScript to be enabled.',
            action: 'Check browser settings'
          },
          {
            title: 'Try a different browser',
            description: 'Use Chrome, Firefox, Safari, or Edge for best compatibility.',
            action: 'Switch browsers and try again'
          }
        ];
      case 'NETWORK_ERROR':
        return [
          {
            title: 'Check internet connection',
            description: 'Ensure you have a stable internet connection.',
            action: 'Test your connection and try again'
          },
          {
            title: 'Disable ad blockers',
            description: 'Ad blockers might interfere with PDF generation.',
            action: 'Temporarily disable extensions'
          }
        ];
      default:
        return [
          {
            title: 'Refresh the page',
            description: 'Sometimes a simple page refresh can resolve the issue.',
            action: 'Press F5 or Ctrl+R to refresh'
          },
          {
            title: 'Clear browser cache',
            description: 'Cached data might be causing conflicts.',
            action: 'Clear cache and cookies for this site'
          },
          {
            title: 'Try again later',
            description: 'The issue might be temporary.',
            action: 'Wait a few minutes and retry'
          }
        ];
    }
  };

  const getErrorIcon = (errorCode: string) => {
    switch (errorCode) {
      case 'PDF_EXPORT_ERROR':
        return '📄';
      case 'BROWSER_COMPATIBILITY_ERROR':
        return '🌍';
      case 'NETWORK_ERROR':
        return '🌐';
      default:
        return '❌';
    }
  };

  const troubleshootingTips = getTroubleshootingTips(error.code);
  const errorIcon = getErrorIcon(error.code);

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <div className={styles.titleSection}>
            <span className={styles.errorIcon}>{errorIcon}</span>
            <h3 className={styles.title}>Export Failed</h3>
          </div>
          <button
            className={styles.closeButton}
            onClick={onDismiss}
            aria-label="Close error dialog"
          >
            ×
          </button>
        </div>

        <div className={styles.content}>
          <div className={styles.errorMessage}>
            <p className={styles.primaryMessage}>{error.message}</p>
            {error.details && (
              <p className={styles.detailsMessage}>{error.details}</p>
            )}
          </div>

          <div className={styles.troubleshootingSection}>
            <button
              className={styles.troubleshootingToggle}
              onClick={() => setShowTroubleshooting(!showTroubleshooting)}
            >
              <span>💡 Troubleshooting Tips</span>
              <span className={`${styles.toggleIcon} ${showTroubleshooting ? styles.expanded : ''}`}>
                ▼
              </span>
            </button>

            {showTroubleshooting && (
              <div className={styles.troubleshootingContent}>
                <p className={styles.troubleshootingIntro}>
                  Try these solutions to resolve the export issue:
                </p>
                <div className={styles.tipsList}>
                  {troubleshootingTips.map((tip, index) => (
                    <div key={index} className={styles.tip}>
                      <h4 className={styles.tipTitle}>{tip.title}</h4>
                      <p className={styles.tipDescription}>{tip.description}</p>
                      {tip.action && (
                        <p className={styles.tipAction}>
                          <strong>Action:</strong> {tip.action}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className={styles.actions}>
            {canRetry && onRetry && error.retryable && (
              <button
                className={styles.retryButton}
                onClick={onRetry}
              >
                🔄 Try Again
              </button>
            )}
            <button
              className={styles.dismissButton}
              onClick={onDismiss}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportErrorModal;