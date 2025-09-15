import React from 'react';
import type { PDFExportProgress } from '../../utils/pdfExporter';
import LoadingSpinner from '../LoadingSpinner';
import styles from './ExportProgressModal.module.css';

interface ExportProgressModalProps {
  isVisible: boolean;
  progress: PDFExportProgress | null;
  onCancel?: () => void;
  canCancel?: boolean;
}

export const ExportProgressModal: React.FC<ExportProgressModalProps> = ({
  isVisible,
  progress,
  onCancel,
  canCancel = true
}) => {
  if (!isVisible || !progress) {
    return null;
  }

  const getStageIcon = (stage: PDFExportProgress['stage']) => {
    switch (stage) {
      case 'validation':
        return '🔍';
      case 'rendering':
        return '🎨';
      case 'generating':
        return '📄';
      case 'complete':
        return '✅';
      default:
        return '⏳';
    }
  };

  const getStageDescription = (stage: PDFExportProgress['stage']) => {
    switch (stage) {
      case 'validation':
        return 'Validating card elements...';
      case 'rendering':
        return 'Converting cards to images...';
      case 'generating':
        return 'Creating PDF document...';
      case 'complete':
        return 'Export completed successfully!';
      default:
        return 'Processing...';
    }
  };

  const progressPercentage = progress.total > 0 
    ? Math.round((progress.current / progress.total) * 100)
    : 0;

  const isComplete = progress.stage === 'complete';

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h3 className={styles.title}>
            {getStageIcon(progress.stage)} Exporting PDF
          </h3>
          {canCancel && !isComplete && onCancel && (
            <button
              className={styles.cancelButton}
              onClick={onCancel}
              aria-label="Cancel export"
            >
              ×
            </button>
          )}
        </div>

        <div className={styles.content}>
          <div className={styles.progressSection}>
            <div className={styles.stageInfo}>
              <span className={styles.stageText}>
                {progress.message || getStageDescription(progress.stage)}
              </span>
            </div>

            {progress.total > 1 && (
              <div className={styles.cardProgress}>
                <span className={styles.cardCount}>
                  Card {progress.current} of {progress.total}
                </span>
              </div>
            )}

            <div className={styles.progressBarContainer}>
              <div className={styles.progressBar}>
                <div 
                  className={styles.progressFill}
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
              <span className={styles.progressText}>
                {progressPercentage}%
              </span>
            </div>
          </div>

          {!isComplete && (
            <div className={styles.spinnerContainer}>
              <LoadingSpinner 
                size="medium" 
                progress={progressPercentage}
              />
            </div>
          )}

          {isComplete && (
            <div className={styles.successMessage}>
              <div className={styles.successIcon}>✅</div>
              <p>Your PDF has been generated and downloaded successfully!</p>
            </div>
          )}

          {canCancel && !isComplete && onCancel && (
            <div className={styles.actions}>
              <button
                className={styles.cancelActionButton}
                onClick={onCancel}
              >
                Cancel Export
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExportProgressModal;