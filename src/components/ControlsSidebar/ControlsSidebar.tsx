import React, { useState, useCallback, useMemo } from 'react';
import { ExportControls } from '../ExportControls';
import { CardCreationForm } from '../CardCreationForm';
import { useCardContext } from '../../contexts/hooks';
import type { CardData, ValidationErrors } from '../../types';
import type { ControlsSidebarProps } from './types';
import { defaultProps, propConstraints } from './types';
import styles from './ControlsSidebar.module.css';



/**
 * ControlsSidebar component provides a unified interface for card creation and management.
 * 
 * Features:
 * - Tabbed interface for creation vs management
 * - Real-time card preview updates
 * - Form validation with user feedback
 * - Card export and sharing functionality
 * - Responsive design for mobile devices
 * 
 * @example
 * ```tsx
 * <ControlsSidebar
 *   cardData={currentCard}
 *   onCardDataChange={handleCardDataChange}
 *   onCardCreate={handleCardCreate}
 *   variantCount={3}
 *   onVariantCountChange={setVariantCount}
 *   showVariants={true}
 *   onToggleVariants={toggleVariants}
 * />
 * ```
 */
export const ControlsSidebar: React.FC<ControlsSidebarProps> = React.memo(({
  cardData,
  onCardDataChange,
  onCardCreate,
  variantCount = defaultProps.variantCount!,
  onVariantCountChange,

  onToggleVariants,
  onShare = defaultProps.onShare,
  onRandomizeCard = defaultProps.onRandomizeCard,
  onRemixCard = defaultProps.onRemixCard,
  cardElements = defaultProps.cardElements!,
  container
}) => {
  // Validate required props
  if (!onCardDataChange) {
    throw new Error('ControlsSidebar: onCardDataChange prop is required');
  }
  if (!onCardCreate) {
    throw new Error('ControlsSidebar: onCardCreate prop is required');
  }
  if (!onVariantCountChange) {
    throw new Error('ControlsSidebar: onVariantCountChange prop is required');
  }
  if (!onToggleVariants) {
    throw new Error('ControlsSidebar: onToggleVariants prop is required');
  }
  
  // Validate prop constraints
  if (variantCount < propConstraints.variantCount.min || variantCount > propConstraints.variantCount.max) {
    console.warn(`ControlsSidebar: variantCount should be between ${propConstraints.variantCount.min} and ${propConstraints.variantCount.max}, received ${variantCount}`);
  }
  const [exportMessage, setExportMessage] = useState<string>('');
  const [exportMessageType, setExportMessageType] = useState<'success' | 'error'>('success');
  const [activeTab, setActiveTab] = useState<'create' | 'manage'>('create');
  
  // Get card context for validation and editing state
  const { 
    validationErrors, 
    isEditing,
    setEditingMode,
    clearCard
  } = useCardContext();

  const handleExportStart = useCallback(() => {
    setExportMessage('');
  }, []);

  const handleExportComplete = useCallback(() => {
    setExportMessage('PDF exported successfully!');
    setExportMessageType('success');
    setTimeout(() => setExportMessage(''), 3000);
  }, []);

  const handleExportError = useCallback((error: string) => {
    setExportMessage(error);
    setExportMessageType('error');
  }, []);

  const handleCardDataChange = useCallback((updates: Partial<CardData>) => {
    if (cardData) {
      onCardDataChange({ ...cardData, ...updates });
    }
  }, [cardData, onCardDataChange]);

  const handleValidationChange = useCallback((errors: ValidationErrors) => {
    // Validation errors are handled by the context
    // This callback is kept for compatibility with CardCreationForm
    console.debug('Validation errors updated:', errors);
  }, []);

  const handleCreateNewCard = useCallback(() => {
    clearCard();
    setEditingMode(true);
    setActiveTab('create');
  }, [clearCard, setEditingMode]);

  const handleEditCurrentCard = useCallback(() => {
    if (cardData) {
      onCardDataChange(cardData);
      setEditingMode(true);
      setActiveTab('create');
    }
  }, [cardData, onCardDataChange, setEditingMode]);

  // Memoize form validation to prevent unnecessary recalculations
  const isFormValid = useMemo(() => {
    return Object.keys(validationErrors).length === 0 && 
           cardData?.title && 
           cardData?.terms && 
           cardData.terms.length >= 24;
  }, [validationErrors, cardData?.title, cardData?.terms]);

  const handleCreateCard = useCallback(() => {
    if (cardData && isFormValid) {
      onCardCreate({
        ...cardData,
        id: cardData.id || crypto.randomUUID(),
        createdAt: cardData.createdAt || new Date(),
        updatedAt: new Date()
      });
      setEditingMode(false);
      setActiveTab('manage');
    }
  }, [cardData, isFormValid, onCardCreate, setEditingMode]);

  return (
    <div className={styles.sidebar}>
      {/* Tab Navigation */}
      <div className={styles.section}>
        <div className={styles.tabNavigation}>
          <button
            onClick={() => setActiveTab('create')}
            className={`${styles.tabButton} ${activeTab === 'create' ? styles.tabButtonActive : ''}`}
          >
            {isEditing ? '✏️ Edit Card' : '➕ Create Card'}
          </button>
          <button
            onClick={() => setActiveTab('manage')}
            className={`${styles.tabButton} ${activeTab === 'manage' ? styles.tabButtonActive : ''}`}
            disabled={!cardData}
          >
            ⚙️ Manage Card
          </button>
        </div>
      </div>

      {/* Card Creation Tab */}
      {activeTab === 'create' && (
        <div className={styles.section}>
          <CardCreationForm
            onCardDataChange={handleCardDataChange}
            onValidationChange={handleValidationChange}
            initialData={isEditing ? cardData || {} : {}}
            className={styles.cardCreationFormContainer}
          />
          
          <div className={styles.createActions}>
            {isEditing && (
              <button
                onClick={() => {
                  setEditingMode(false);
                  setActiveTab('manage');
                }}
                className={`${styles.button} ${styles.buttonSecondary}`}
              >
                Cancel
              </button>
            )}
            <button
              onClick={handleCreateCard}
              disabled={!isFormValid}
              className={`${styles.button} ${styles.buttonPrimary} ${!isFormValid ? styles.buttonDisabled : ''}`}
            >
              {isEditing ? 'Update Card' : 'Create Card'}
            </button>
          </div>
        </div>
      )}

      {/* Card Management Tab */}
      {activeTab === 'manage' && cardData && (
        <>
          {/* Card Info */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Card Information</h3>
            <div className={styles.cardInfo}>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Title:</span>
                <span className={styles.infoValue}>{cardData.title}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Terms:</span>
                <span className={styles.infoValue}>{cardData.terms.length}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Free Space:</span>
                <span className={styles.infoValue}>
                  {cardData.freeSpaceImage ? 'Custom Image' : `Icon: ${cardData.freeSpaceIcon || 'star'}`}
                </span>
              </div>
            </div>
          </div>

          {/* Card Actions */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Card Actions</h3>

            <button
              onClick={handleCreateNewCard}
              className={`${styles.button} ${styles.buttonSecondary}`}
            >
              ➕ Create New Card
            </button>

            <button
              onClick={handleEditCurrentCard}
              className={`${styles.button} ${styles.buttonInfo}`}
            >
              ✏️ Edit This Card
            </button>

            {onRemixCard && (
              <button
                onClick={onRemixCard}
                className={`${styles.button} ${styles.buttonPrimary}`}
              >
                🔄 Remix This Card
              </button>
            )}

            {onRandomizeCard && (
              <button
                onClick={onRandomizeCard}
                className={`${styles.button} ${styles.buttonSuccess}`}
              >
                🎲 Randomize
              </button>
            )}

            {onShare && (
              <button
                onClick={onShare}
                className={`${styles.button} ${styles.buttonPurple}`}
              >
                📤 Share Card
              </button>
            )}
          </div>

          {/* Export Section */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Export to PDF</h3>
            
            {/* Card Count Selection */}
            <div className={styles.variantsSection}>
              <div className={styles.variantControls}>
                <label className={styles.variantLabel}>
                  Number of Cards:
                  <select
                    value={variantCount}
                    onChange={(e) => onVariantCountChange(Number(e.target.value))}
                    className={styles.variantSelect}
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                      <option key={num} value={num}>{num}</option>
                    ))}
                  </select>
                </label>
              </div>
            </div>

            <ExportControls
              cards={variantCount === 1 ? [cardData] : Array(variantCount).fill(cardData)}
              cardElements={cardElements}
              container={container}
              variantCount={variantCount}
              onExportStart={handleExportStart}
              onExportComplete={handleExportComplete}
              onExportError={handleExportError}
            />

            {exportMessage && (
              <div className={`${styles.message} ${exportMessageType === 'error' ? styles.messageError : styles.messageSuccess}`}>
                {exportMessage}
              </div>
            )}
          </div>
        </>
      )}

      {/* Empty state when no card and on manage tab */}
      {activeTab === 'manage' && !cardData && (
        <div className={styles.section}>
          <div className={styles.emptyState}>
            <p className={styles.emptyStateText}>No card created yet.</p>
            <button
              onClick={() => setActiveTab('create')}
              className={`${styles.button} ${styles.buttonPrimary}`}
            >
              Create Your First Card
            </button>
          </div>
        </div>
      )}
    </div>
  );
});

// Set display name for better debugging
ControlsSidebar.displayName = 'ControlsSidebar';

export default ControlsSidebar;