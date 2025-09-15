import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { CardData, ValidationErrors } from '../../types';
import IconSelector from '../IconSelector';
import { usePerformanceMonitor, useRenderTracker } from '../../utils/performanceMonitor';
import styles from './CardCreationForm.module.css';

interface CardCreationFormProps {
  onCardDataChange: (cardData: Partial<CardData>) => void;
  onValidationChange: (errors: ValidationErrors) => void;
  initialData?: Partial<CardData>;
  className?: string;
}

const CardCreationForm: React.FC<CardCreationFormProps> = React.memo(({
  onCardDataChange,
  onValidationChange,
  initialData = {},
  className = ''
}) => {
  const [title, setTitle] = useState<string>(initialData.title || '');
  const [terms, setTerms] = useState<string>(
    initialData.terms ? initialData.terms.join('\n') : ''
  );
  const [freeSpaceImage, setFreeSpaceImage] = useState<string>(
    initialData.freeSpaceImage || ''
  );
  const [freeSpaceIcon, setFreeSpaceIcon] = useState<string>(
    initialData.freeSpaceIcon || 'star'
  );
  const [errors, setErrors] = useState<ValidationErrors>({});

  // Use ref for timeout to prevent stale closures
  const validationTimeoutRef = useRef<number | null>(null);

  // Update form state when initialData changes
  useEffect(() => {
    setTitle(initialData.title || '');
    setTerms(initialData.terms ? initialData.terms.join('\n') : '');
    setFreeSpaceImage(initialData.freeSpaceImage || '');
    setFreeSpaceIcon(initialData.freeSpaceIcon || 'star');
  }, [initialData]);

  // Clear form fields
  const clearForm = useCallback(() => {
    setTitle('');
    setTerms('');
    setFreeSpaceImage('');
    setFreeSpaceIcon('star');
    setErrors({});
  }, []);

  // Performance monitoring in development
  const { startMeasure } = usePerformanceMonitor('CardCreationForm');
  useRenderTracker('CardCreationForm', {
    initialData: Object.keys(initialData).length,
    className,
    title: title.length,
    terms: terms.length,
    freeSpaceImage: freeSpaceImage.length,
    freeSpaceIcon,
    errors: Object.keys(errors).length
  });

  React.useLayoutEffect(() => {
    const endMeasure = startMeasure();
    return endMeasure;
  });

  // Memoize URL validation function
  const isValidUrl = useCallback((url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }, []);

  // Memoize terms list calculation
  const termsList = useMemo(() => {
    return terms
      .split('\n')
      .map(term => term.trim())
      .filter(term => term.length > 0);
  }, [terms]);

  // Memoized validation function
  const validateForm = useCallback((): ValidationErrors => {
    const newErrors: ValidationErrors = {};

    // Validate title
    if (!title.trim()) {
      newErrors.title = 'Title is required';
    } else if (title.trim().length < 3) {
      newErrors.title = 'Title must be at least 3 characters long';
    } else if (title.trim().length > 100) {
      newErrors.title = 'Title must be less than 100 characters';
    }

    // Validate terms
    if (termsList.length === 0) {
      newErrors.terms = 'At least one term is required';
    } else if (termsList.length < 24) {
      newErrors.terms = `Need at least 24 terms for a bingo card. You have ${termsList.length} terms.`;
    }

    // Check for duplicate terms
    const uniqueTerms = new Set(termsList.map(term => term.toLowerCase()));
    if (uniqueTerms.size !== termsList.length) {
      newErrors.terms = newErrors.terms
        ? `${newErrors.terms} Also, some terms are duplicated.`
        : 'Some terms are duplicated. Each term should be unique.';
    }

    // Validate free space image URL (optional field)
    if (freeSpaceImage.trim() && !isValidUrl(freeSpaceImage.trim())) {
      newErrors.freeSpaceImage = 'Please enter a valid image URL';
    }

    return newErrors;
  }, [title, termsList, freeSpaceImage, isValidUrl]);

  // Debounced validation and data change notification
  useEffect(() => {
    // Clear existing timeout
    if (validationTimeoutRef.current) {
      clearTimeout(validationTimeoutRef.current);
    }

    // Set new timeout for debounced validation
    validationTimeoutRef.current = setTimeout(() => {
      const newErrors = validateForm();
      setErrors(newErrors);
      onValidationChange(newErrors);

      // Notify parent of data changes
      const cardData: Partial<CardData> = {
        title: title.trim(),
        terms: termsList,
        freeSpaceImage: freeSpaceImage.trim() || undefined,
        freeSpaceIcon: freeSpaceIcon,
      };

      onCardDataChange(cardData);
    }, 300); // 300ms debounce

    // Cleanup timeout on unmount
    return () => {
      if (validationTimeoutRef.current) {
        clearTimeout(validationTimeoutRef.current);
      }
    };
  }, [title, termsList, freeSpaceImage, freeSpaceIcon, validateForm, onCardDataChange, onValidationChange]);

  const handleTitleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
  }, []);

  const handleTermsChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTerms(e.target.value);
  }, []);

  const handleIconSelect = useCallback((iconId: string) => {
    setFreeSpaceIcon(iconId);
  }, []);

  // Memoize term count calculation
  const termCount = useMemo(() => termsList.length, [termsList]);

  return (
    <div className={`${styles.cardCreationForm} ${className}`}>
      <h3 className={styles.heading}>Card Details</h3>

      <form className={styles.form} onSubmit={(e) => e.preventDefault()}>
        {/* Title Input */}
        <div className={styles.formGroup}>
          <label htmlFor="card-title" className={styles.label}>
            Card Title *
          </label>
          <input
            type="text"
            id="card-title"
            value={title}
            onChange={handleTitleChange}
            className={`${styles.input} ${errors.title ? styles.inputError : ''}`}
            placeholder="Enter your bingo card title"
            maxLength={100}
            aria-describedby={errors.title ? 'title-error' : undefined}
            aria-invalid={!!errors.title}
          />
          {errors.title && (
            <span id="title-error" className={styles.errorMessage} role="alert">
              {errors.title}
            </span>
          )}
        </div>

        {/* Terms Textarea */}
        <div className={styles.formGroup}>
          <label htmlFor="card-terms" className={styles.label}>
            Bingo Terms *
            <span className={styles.termCount}>
              ({termCount}/24 minimum)
            </span>
          </label>
          <textarea
            id="card-terms"
            value={terms}
            onChange={handleTermsChange}
            className={`${styles.textarea} ${errors.terms ? styles.inputError : ''}`}
            placeholder="Enter each term on a new line&#10;Example:&#10;Synergy&#10;Paradigm&#10;Leverage&#10;..."
            rows={8}
            aria-describedby={`terms-helper ${errors.terms ? 'terms-error' : ''}`}
            aria-invalid={!!errors.terms}
          />
          {errors.terms && (
            <span id="terms-error" className={styles.errorMessage} role="alert">
              {errors.terms}
            </span>
          )}
          <div id="terms-helper" className={styles.helperText}>
            Enter one term per line. You need at least 24 unique terms to create a 5x5 bingo card (since center square is FREE but more is better).<br />
            Too many terms or emojis might break the sharing functionality - idealy aim for a max of 50 short words or phrases or fewer with emojis.
          </div>
        </div>

        {/* Free Space Image URL
        <div className={styles.formGroup}>
          <label htmlFor="free-space-image" className={styles.label}>
            Free Space Image URL (Optional)
          </label>
          <input
            type="url"
            id="free-space-image"
            value={freeSpaceImage}
            onChange={handleFreeSpaceImageChange}
            className={`${styles.input} ${errors.freeSpaceImage ? styles.inputError : ''}`}
            placeholder="https://example.com/image.jpg"
            aria-describedby={`image-helper ${errors.freeSpaceImage ? 'image-error' : ''}`}
            aria-invalid={!!errors.freeSpaceImage}
          />
          {errors.freeSpaceImage && (
            <span id="image-error" className={styles.errorMessage} role="alert">
              {errors.freeSpaceImage}
            </span>
          )}
          <div id="image-helper" className={styles.helperText}>
            Optional: Add a custom image for the center "FREE" space. If no image is provided, an icon will be used instead.
          </div>
        </div> */}

        {/* Free Space Icon Selector */}
        {!freeSpaceImage.trim() && (
          <div className={styles.formGroup}>
            <IconSelector
              selectedIcon={freeSpaceIcon}
              onIconSelect={handleIconSelect}
            />
            <div className={styles.helperText}>
              Choose an icon for the center "FREE" space when no custom image is provided.
            </div>
          </div>
        )}

        <button type="button" className={styles.clearButton} onClick={clearForm}>
          Clear Card
        </button>
      </form>
    </div>
  );
});

CardCreationForm.displayName = 'CardCreationForm';

export default CardCreationForm;