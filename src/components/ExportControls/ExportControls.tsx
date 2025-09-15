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
  const [exportOptions, ] = useState<PDFExportOptions>({
    format: 'a4',
    orientation: 'portrait',
    quality: 1.0,
    blackAndWhite: true
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

    // Method to export multiple variants by temporarily rendering them
  const exportMultipleVariants = useCallback(async (
    cards: CardData[],
    filename: string,
    exportOptions: PDFExportOptions,
    progressHandler: (progress: PDFExportProgress) => void,
    controller: PDFExportController
  ) => {
    // Import the card generator to create variants
    const { generateCardVariants } = await import('../../utils/cardGenerator');
    
    if (cards.length === 0) {
      throw new Error('No card data provided for variant export');
    }

    const baseCard = cards[0];
    
    // Generate the variants
    progressHandler({ 
      current: 0, 
      total: variantCount, 
      stage: 'validation', 
      message: 'Generating card variants for export...' 
    });

    const variants = generateCardVariants(baseCard, variantCount);
    
    // Create a temporary container to render all variants for export
    const tempContainer = document.createElement('div');
    tempContainer.style.position = 'absolute';
    // tempContainer.style.top = '-9999px';
    // tempContainer.style.left = '-9999px';
    // tempContainer.style.visibility = 'hidden';
    // tempContainer.style.pointerEvents = 'none';
    document.body.appendChild(tempContainer);

    try {
      // Dynamically import React and ReactDOM for rendering
      const React = await import('react');
      const { createRoot } = await import('react-dom/client');
      const { default: BingoCard } = await import('../BingoCard/BingoCard');

      // Create a wrapper component to render all variants
      const VariantsExportWrapper = () => {
        return React.createElement('div', {}, 
          variants.map((variant, index) => 
            React.createElement(BingoCard, {
              key: index,
              title: variant.title,
              terms: variant.terms,
              freeSpaceImage: variant.freeSpaceImage,
              freeSpaceIcon: variant.freeSpaceIcon,
              arrangement: variant.arrangement,
              isPlayMode: false
            })
          )
        );
      };

      // Render the variants
      const root = createRoot(tempContainer);
      
      await new Promise<void>((resolve) => {
        root.render(React.createElement(VariantsExportWrapper));
        // Wait for rendering to complete
        setTimeout(resolve, 100);
      });

      // Wait a bit more for all elements to be fully rendered
      await new Promise(resolve => setTimeout(resolve, 200));

      // Now export using the temporary container
      await PDFExporter.exportCardsFromContainer(
        tempContainer,
        variants.map(v => ({ ...v, id: `temp-${Date.now()}`, createdAt: new Date(), updatedAt: new Date() })),
        filename,
        exportOptions,
        progressHandler,
        controller
      );

      // Cleanup
      root.unmount();
      
    } finally {
      // Always remove the temporary container
      if (tempContainer.parentNode) {
        tempContainer.parentNode.removeChild(tempContainer);
      }
    }
  }, [variantCount]);

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
      // For multiple variants, we need to handle the case where only one card element is visible
      if (variantCount > 1) {
        await exportMultipleVariants(
          cards,
          filename,
          exportOptions,
          progressHandler,
          controller
        );
      } else {
        // Single card export
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

          await PDFExporter.exportCard(cardElements[0], filename, exportOptions, progressHandler, controller);
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
  }, [cards, variantCount, cardElements, container, exportOptions, onExportStart, onExportComplete, exportMultipleVariants]);

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

  const isDisabled = useMemo(() => 
    cards.length === 0 || isLoading || 
    (!container && (!cardElements || cardElements.length === 0)),
    [cards.length, isLoading, container, cardElements]
  );

  return (
    <>
      <div>

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
          {isLoading ? 'Generating...' : 'Export'}
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