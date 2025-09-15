import { useState, useCallback, useMemo } from 'react';
import type { CardData, ValidationErrors } from '../types';
import { generateBingoCard } from '../utils/cardGenerator';
import { useVariantGeneration } from './useVariantGeneration';

interface UseCardStateReturn {
  cardData: CardData | null;
  variants: CardData[];
  isEditing: boolean;
  validationErrors: ValidationErrors;
  updateCardData: (updates: Partial<CardData>) => void;
  createCard: (data: Omit<CardData, 'id' | 'createdAt' | 'updatedAt'>) => void;
  generateVariants: (count: number) => void;
  randomizeCard: () => void;
  validateCard: (data: Partial<CardData>) => ValidationErrors;
  clearCard: () => void;
  setEditingMode: (editing: boolean) => void;
}

export function useCardState(): UseCardStateReturn {
  const [cardData, setCardData] = useState<CardData | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  
  // Use optimized variant generation hook
  const variantGeneration = useVariantGeneration();

  // Validation logic for card title and terms
  const validateCard = useCallback((data: Partial<CardData>): ValidationErrors => {
    const errors: ValidationErrors = {};

    // Validate title
    if (!data.title?.trim()) {
      errors.title = 'Title is required';
    } else if (data.title.trim().length < 3) {
      errors.title = 'Title must be at least 3 characters long';
    } else if (data.title.trim().length > 100) {
      errors.title = 'Title must be less than 100 characters';
    }

    // Validate terms
    if (!data.terms || data.terms.length === 0) {
      errors.terms = 'At least one term is required';
    } else if (data.terms.length < 24) {
      errors.terms = `Need at least 24 terms for a bingo card. You have ${data.terms.length} terms.`;
    } else {
      // Check for empty or whitespace-only terms
      const validTerms = data.terms.filter(term => term.trim().length > 0);
      if (validTerms.length < 24) {
        errors.terms = `Need at least 24 non-empty terms. You have ${validTerms.length} valid terms.`;
      }
      
      // Check for duplicate terms
      const uniqueTerms = new Set(validTerms.map(term => term.trim().toLowerCase()));
      if (uniqueTerms.size < validTerms.length) {
        errors.terms = 'Duplicate terms found. Each term must be unique.';
      }
    }

    // Validate free space image URL if provided
    if (data.freeSpaceImage?.trim()) {
      try {
        new URL(data.freeSpaceImage.trim());
      } catch {
        errors.freeSpaceImage = 'Please enter a valid image URL';
      }
    }

    return errors;
  }, []);

  // Generate a unique ID for cards
  const generateCardId = useCallback((): string => {
    return `card_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  // Update card data with validation
  const updateCardData = useCallback((updates: Partial<CardData>) => {
    if (!cardData) return;

    const updatedCard = {
      ...cardData,
      ...updates,
      updatedAt: new Date()
    };

    // Validate the updated card
    const errors = validateCard(updatedCard);
    setValidationErrors(errors);

    setCardData(updatedCard);
  }, [cardData, validateCard]);

  // Create a new card with proper metadata
  const createCard = useCallback((data: Omit<CardData, 'id' | 'createdAt' | 'updatedAt'>) => {
    const errors = validateCard(data);
    setValidationErrors(errors);

    // Only create card if validation passes
    if (Object.keys(errors).length === 0) {
      const now = new Date();
      const newCard: CardData = {
        ...data,
        id: generateCardId(),
        createdAt: now,
        updatedAt: now
      };

      setCardData(newCard);
      setIsEditing(false);
      
      // Clear variants when creating a new card
      variantGeneration.clearVariants();
    }
  }, [validateCard, generateCardId, variantGeneration.clearVariants]);

  // Generate multiple card variants using optimized hook
  const generateVariants = useCallback(async (count: number) => {
    if (!cardData || count < 1) {
      variantGeneration.clearVariants();
      return;
    }

    try {
      await variantGeneration.generateVariants(cardData, count, {
        batchSize: Math.min(count, 5),
        maxConcurrent: 2,
        enableProgressTracking: true
      });
    } catch (error) {
      console.error('Error generating variants:', error);
      setValidationErrors({
        general: 'Failed to generate card variants. Please try again.'
      });
    }
  }, [cardData, variantGeneration.generateVariants, variantGeneration.clearVariants]);

  // Randomize the current card
  const randomizeCard = useCallback(() => {
    if (!cardData) return;

    try {
      // Generate a new randomized arrangement
      const randomizedCard = generateBingoCard(
        cardData.title,
        cardData.terms,
        cardData.freeSpaceImage,
        cardData.freeSpaceIcon
      );

      // Update the current card with new arrangement
      updateCardData({
        arrangement: randomizedCard.arrangement
      });
    } catch (error) {
      console.error('Error randomizing card:', error);
      setValidationErrors({
        general: 'Failed to randomize card. Please try again.'
      });
    }
  }, [cardData, updateCardData]);

  // Clear current card and reset state
  const clearCard = useCallback(() => {
    setCardData(null);
    variantGeneration.clearVariants();
    setValidationErrors({});
    setIsEditing(false);
  }, [variantGeneration.clearVariants]);

  // Set editing mode
  const setEditingMode = useCallback((editing: boolean) => {
    setIsEditing(editing);
  }, []);

  // Convert variants from generation hook to CardData format
  const variants = useMemo(() => {
    return variantGeneration.variants.map(variant => ({
      ...variant,
      id: generateCardId(),
      createdAt: new Date(),
      updatedAt: new Date()
    }));
  }, [variantGeneration.variants, generateCardId]);

  // Memoized return value to prevent unnecessary re-renders
  const returnValue = useMemo((): UseCardStateReturn => ({
    cardData,
    variants,
    isEditing,
    validationErrors,
    updateCardData,
    createCard,
    generateVariants,
    randomizeCard,
    validateCard,
    clearCard,
    setEditingMode
  }), [
    cardData,
    variants,
    isEditing,
    validationErrors,
    updateCardData,
    createCard,
    generateVariants,
    randomizeCard,
    validateCard,
    clearCard,
    setEditingMode
  ]);

  return returnValue;
}

export default useCardState;