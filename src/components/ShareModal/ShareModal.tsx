import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { generateShareableUrl } from '../../utils/urlEncoder';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import { AppErrorHandler } from '../../utils/errorHandler';
import type { CardData } from '../../types';
import ErrorMessage from '../ErrorMessage';
import LoadingSpinner from '../LoadingSpinner';
import styles from './ShareModal.module.css';

interface ShareModalProps {
  cardData: CardData;
  isOpen: boolean;
  onClose: () => void;
}

const ShareModal: React.FC<ShareModalProps> = React.memo(({ cardData, isOpen, onClose }: ShareModalProps) => {
  const [shareUrl, setShareUrl] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  const [shareInPlayMode, setShareInPlayMode] = useState(true);
  const urlInputRef = useRef<HTMLInputElement>(null);

  const { 
    error, 
    isLoading, 
    clearError, 
    executeWithErrorHandling 
  } = useErrorHandler();

  // Memoize URL generation to prevent unnecessary recalculations
  const generatedUrl = useMemo(() => {
    if (!cardData) return '';
    const baseUrl = generateShareableUrl(cardData);
    return shareInPlayMode ? `${baseUrl}&play=true` : baseUrl;
  }, [cardData, shareInPlayMode]);

  useEffect(() => {
    if (isOpen && cardData) {
      clearError();
      setCopySuccess(false);
      
      executeWithErrorHandling(
        async () => {
          setShareUrl(generatedUrl);
          return generatedUrl;
        },
        AppErrorHandler.handleURLError
      );
    }
  }, [isOpen, cardData, generatedUrl, clearError, executeWithErrorHandling]);

  const handleCopyToClipboard = useCallback(async () => {
    if (!shareUrl) return;

    const result = await executeWithErrorHandling(
      async () => {
        if (navigator.clipboard && window.isSecureContext) {
          // Use modern clipboard API
          await navigator.clipboard.writeText(shareUrl);
        } else {
          // Fallback for older browsers or non-secure contexts
          if (!urlInputRef.current) {
            throw new Error('Cannot access clipboard - input element not available');
          }
          
          urlInputRef.current.select();
          urlInputRef.current.setSelectionRange(0, 99999); // For mobile devices
          
          const success = document.execCommand('copy');
          if (!success) {
            throw new Error('Copy command failed');
          }
        }
        
        setCopySuccess(true);
        
        // Clear success message after 3 seconds
        setTimeout(() => setCopySuccess(false), 3000);
        
        return true;
      },
      () => AppErrorHandler.createError(
        'BROWSER_COMPATIBILITY_ERROR',
        'Failed to copy to clipboard',
        'Your browser may not support clipboard access. Try selecting the text manually and copying with Ctrl+C (or Cmd+C on Mac).',
        true
      )
    );

    return result;
  }, [shareUrl, executeWithErrorHandling]);

  const handleShare = useCallback(async () => {
    if (!shareUrl) return;

    // Use Web Share API if available (mainly on mobile)
    if (navigator.share) {
      await executeWithErrorHandling(
        async () => {
          await navigator.share({
            title: `Bingo Card: ${cardData.title}`,
            text: `Check out this bingo card: ${cardData.title}`,
            url: shareUrl,
          });
          return true;
        },
        (error) => {
          // Check if user cancelled (this is not really an error)
          if (error instanceof Error && error.name === 'AbortError') {
            return AppErrorHandler.createError(
              'UNKNOWN_ERROR',
              'Share cancelled',
              'Sharing was cancelled by the user.',
              false
            );
          }
          return AppErrorHandler.createError(
            'BROWSER_COMPATIBILITY_ERROR',
            'Failed to share',
            'There was an issue with the sharing feature. Try copying the link instead.',
            true
          );
        }
      );
    } else {
      // Fallback to copying to clipboard
      await handleCopyToClipboard();
    }
  }, [shareUrl, cardData.title, executeWithErrorHandling, handleCopyToClipboard]);

  const handleOverlayClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }, [onClose]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className={styles.overlay} 
      onClick={handleOverlayClick}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-modal-title"
    >
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2 id="share-modal-title" className={styles.title}>
            Share Bingo Card
          </h2>
          <button
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close modal"
          >
            ×
          </button>
        </div>

        <div className={styles.content}>
          <p className={styles.description}>
            Share this bingo card with others using the link below. 
            Anyone with this link can play the card in their browser.
          </p>

          {error && (
            <ErrorMessage
              error={error}
              onDismiss={clearError}
              showDetails={true}
            />
          )}

          {isLoading && (
            <LoadingSpinner
              size="small"
              message="Generating share link..."
            />
          )}

          {!isLoading && !error && (
            <>
              <div className={styles.optionsContainer}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={shareInPlayMode}
                    onChange={(e) => setShareInPlayMode(e.target.checked)}
                    className={styles.checkbox}
                  />
                  Share in play mode (recommended)
                </label>
                <p className={styles.optionDescription}>
                  {shareInPlayMode 
                    ? 'Recipients will see the card ready to play with no sidebar controls.'
                    : 'Recipients will see the full interface with editing controls.'
                  }
                </p>
              </div>

              <div className={styles.urlContainer}>
                <label htmlFor="share-url" className={styles.urlLabel}>
                  Shareable Link:
                </label>
                <input
                  id="share-url"
                  ref={urlInputRef}
                  type="text"
                  value={shareUrl}
                  readOnly
                  className={styles.urlInput}
                  onClick={(e) => e.currentTarget.select()}
                />
                
                {copySuccess && (
                  <div className={styles.successMessage}>
                    ✓ Link copied to clipboard!
                  </div>
                )}
              </div>
            </>
          )}

          <div className={styles.actions}>
            <button
              className={`${styles.button} ${styles.primaryButton}`}
              onClick={handleCopyToClipboard}
              disabled={!shareUrl || isLoading}
            >
              Copy Link
            </button>
            
            {navigator.share !== undefined && (
              <button
                className={`${styles.button} ${styles.primaryButton}`}
                onClick={handleShare}
                disabled={!shareUrl || isLoading}
              >
                Share
              </button>
            )}
            
            <button
              className={`${styles.button} ${styles.secondaryButton}`}
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

ShareModal.displayName = 'ShareModal';

export default ShareModal;