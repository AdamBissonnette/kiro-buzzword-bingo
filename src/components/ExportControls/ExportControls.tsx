import React, { useState, useRef, useCallback, useMemo } from 'react';
import type { CardData } from '../../types';
import { PDFExporter, type PDFExportOptions, type PDFExportProgress, type PDFExportController, ExportCancellationError } from '../../utils/pdfExporter';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import { AppErrorHandler } from '../../utils/errorHandler';
import ExportProgressModal from '../ExportProgressModal';
import ExportErrorModal from '../ExportErrorModal';
import styles from './ExportControls.module.css';

interface ExportControlsProps {
  cards: CardData[];
  cardElements?: HTMLElement[]; // Made optional for backward compatibility
  variantCount: number;
  container?: HTMLElement | Document; // New prop for automatic detection
  onExportStart?: () => void;
  onExportComplete?: () => void;
  onExportError?: (error: string) => void;
}

export const ExportControls: React.FC<ExportControlsProps> = React.memo(({
  cards,
  cardElements,
  variantCount,
  container,
  onExportStart,
  onExportComplete,
  onExportError
}) => {
  const [exportOptions, setExportOptions] = useState<PDFExportOptions>({
    format: 'a4',
    orientation: 'portrait',
    quality: 1.0
  });
  const [exportProgress, setExportProgress] = useState<PDFExportProgress | null>(null);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const exportControllerRef = useRef<PDFExportController | null>(null);

  const { 
    error, 
    isLoading, 
    clearError, 
    executeWithRetry, 
    canRetry, 
    retry 
  } = useErrorHandler({
    maxRetries: 2,
    retryDelay: 1000,
    onError: (error) => {
      setShowProgressModal(false);
      if (!(error instanceof ExportCancellationError)) {
        setShowErrorModal(true);
        onExportError?.(error.message);
      }
    }
  });

  const performExport = useCallback(async () => {
    if (cards.length === 0) {
      throw AppErrorHandler.createError(
        'PDF_EXPORT_ERROR',
        'No cards available for export',
        'Please ensure at least one card is created before exporting.',
        false
      );
    }

    // Create export controller for cancellation support
    const controller = PDFExporter.createExportController();
    exportControllerRef.current = controller;

    onExportStart?.();
    setShowProgressModal(true);
    setExportProgress(null);
    setShowSuccessMessage(false);

    const filename = PDFExporter.generateFilename(
      cards[0], 
      variantCount > 1
    );

    const progressHandler = (progress: PDFExportProgress) => {
      setExportProgress(progress);
    };

    try {
      // Use automatic card element detection if container is provided and cardElements are not
      if (container && (!cardElements || cardElements.length === 0)) {
        await PDFExporter.exportCardsFromContainer(
          container,
          cards,
          filename,
          exportOptions,
          progressHandler,
          controller
        );
      } else {
        // Fallback to legacy method with provided cardElements
        if (!cardElements || cardElements.length === 0) {
          throw AppErrorHandler.createError(
            'PDF_EXPORT_ERROR',
            'Card element not found',
            'The card content is not available for export. Please ensure the card is properly loaded and try again.',
            false
          );
        }

        // For single card export
        if (variantCount === 1) {
          await PDFExporter.exportCard(cardElements[0], filename, exportOptions, progressHandler, controller);
        } else {
          // For multiple cards
          if (cardElements.length >= variantCount) {
            // We have multiple card elements (variants are being displayed)
            await PDFExporter.exportMultipleCards(
              cardElements.slice(0, variantCount), 
              filename, 
              exportOptions,
              progressHandler,
              controller
            );
          } else {
            // We need to generate variants for export
            // This happens when user wants multiple cards but variants aren't displayed
            // We'll export the single visible card multiple times with different arrangements
            // This is a limitation but works for the current use case
            const elementsToExport = Array(variantCount).fill(cardElements[0]);
            await PDFExporter.exportMultipleCards(
              elementsToExport, 
              filename, 
              exportOptions,
              progressHandler,
              controller
            );
          }
        }
      }

      // Show success state
      setExportProgress({
        current: variantCount,
        total: variantCount,
        stage: 'complete',
        message: 'PDF export completed successfully!'
      });

      // Auto-hide progress modal after success
      setTimeout(() => {
        setShowProgressModal(false);
        setShowSuccessMessage(true);
        setTimeout(() => setShowSuccessMessage(false), 3000);
      }, 1500);

      onExportComplete?.();
    } finally {
      exportControllerRef.current = null;
    }
  }, [cards, variantCount, cardElements, container, exportOptions, onExportStart, onExportComplete, onExportError]);

  const handleExport = useCallback(async () => {
    clearError();
    setShowErrorModal(false);
    const result = await executeWithRetry(performExport, AppErrorHandler.handlePDFError);
    if (result !== null) {
      // Export successful - handled in performExport
    }
  }, [clearError, executeWithRetry, performExport]);

  const handleRetry = useCallback(async () => {
    setShowErrorModal(false);
    const result = await retry(performExport, AppErrorHandler.handlePDFError);
    if (result !== null) {
      // Export successful - handled in performExport
    }
  }, [retry, performExport]);

  const handleCancelExport = useCallback(() => {
    if (exportControllerRef.current) {
      exportControllerRef.current.cancel();
    }
    setShowProgressModal(false);
    setExportProgress(null);
  }, []);

  const handleDismissError = useCallback(() => {
    setShowErrorModal(false);
    clearError();
  }, [clearError]);

  const handleFormatChange = useCallback((format: 'a4' | 'letter') => {
    setExportOptions(prev => ({ ...prev, format }));
  }, []);

  const handleOrientationChange = useCallback((orientation: 'portrait' | 'landscape') => {
    setExportOptions(prev => ({ ...prev, orientation }));
  }, []);

  const handleQualityChange = useCallback((quality: number) => {
    setExportOptions(prev => ({ ...prev, quality }));
  }, []);

  const isDisabled = useMemo(() => 
    cards.length === 0 || isLoading || 
    (!container && (!cardElements || cardElements.length === 0)),
    [cards.length, isLoading, container, cardElements]
  );

  return (
    <>
      <div className={styles.exportControls}>
        <h3 className={styles.title}>Export to PDF</h3>
        
        <div className={styles.options}>
          <div className={styles.optionGroup}>
            <label className={styles.label}>Paper Size:</label>
            <div className={styles.radioGroup}>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="format"
                  value="a4"
                  checked={exportOptions.format === 'a4'}
                  onChange={() => handleFormatChange('a4')}
                  disabled={isLoading}
                />
                A4
              </label>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="format"
                  value="letter"
                  checked={exportOptions.format === 'letter'}
                  onChange={() => handleFormatChange('letter')}
                  disabled={isLoading}
                />
                Letter
              </label>
            </div>
          </div>

          <div className={styles.optionGroup}>
            <label className={styles.label}>Orientation:</label>
            <div className={styles.radioGroup}>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="orientation"
                  value="portrait"
                  checked={exportOptions.orientation === 'portrait'}
                  onChange={() => handleOrientationChange('portrait')}
                  disabled={isLoading}
                />
                Portrait
              </label>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="orientation"
                  value="landscape"
                  checked={exportOptions.orientation === 'landscape'}
                  onChange={() => handleOrientationChange('landscape')}
                  disabled={isLoading}
                />
                Landscape
              </label>
            </div>
          </div>

          <div className={styles.optionGroup}>
            <label className={styles.label} htmlFor="quality">
              Quality: {Math.round((exportOptions.quality ?? 0.8) * 100)}%
            </label>
            <input
              id="quality"
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={exportOptions.quality}
              onChange={(e) => handleQualityChange(parseFloat(e.target.value))}
              disabled={isLoading}
              className={styles.slider}
            />
          </div>
        </div>

        <div className={styles.exportInfo}>
          <p className={styles.cardCount}>
            {variantCount === 1 
              ? '1 card will be exported' 
              : `${variantCount} cards will be exported (${variantCount} pages)`
            }
          </p>
        </div>

        {showSuccessMessage && (
          <div className={styles.successMessage}>
            <span className={styles.successIcon}>✅</span>
            <span>PDF exported successfully!</span>
          </div>
        )}

        <button
          onClick={handleExport}
          disabled={isDisabled}
          className={`${styles.exportButton} ${isLoading ? styles.exporting : ''}`}
        >
          {isLoading ? 'Generating PDF...' : 'Export PDF'}
        </button>

        {!PDFExporter.isSupported() && (
          <p className={styles.warning}>
            PDF export is not supported in this browser. Please use a modern browser.
          </p>
        )}
      </div>

      {/* Progress Modal */}
      <ExportProgressModal
        isVisible={showProgressModal}
        progress={exportProgress}
        onCancel={handleCancelExport}
        canCancel={!exportProgress || exportProgress.stage !== 'complete'}
      />

      {/* Error Modal */}
      <ExportErrorModal
        isVisible={showErrorModal}
        error={error}
        onRetry={canRetry ? handleRetry : undefined}
        onDismiss={handleDismissError}
        canRetry={canRetry}
      />
    </>
  );
});

ExportControls.displayName = 'ExportControls';

export default ExportControls;