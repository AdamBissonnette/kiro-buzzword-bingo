import type { CardData } from '../types';

/**
 * Fisher-Yates shuffle algorithm for randomizing array elements
 * @param array - Array to shuffle
 * @returns New shuffled array
 */
export function fisherYatesShuffle<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Validates if the provided terms are sufficient for bingo card generation
 * @param terms - Array of terms to validate
 * @returns Validation result with success status and error message
 */
export function validateTerms(terms: string[]): { isValid: boolean; error?: string } {
  const cleanTerms = terms.filter(term => term.trim().length > 0);
  
  if (cleanTerms.length < 24) {
    return {
      isValid: false,
      error: `Insufficient terms provided. Need at least 24 terms, but got ${cleanTerms.length}.`
    };
  }
  
  return { isValid: true };
}

/**
 * Generates a randomized arrangement of term indices for a 5x5 bingo grid
 * @param termCount - Total number of available terms
 * @returns Array of 25 indices with center position (12) set to -1 for free space
 */
export function generateCardArrangement(termCount: number): number[] {
  if (termCount < 24) {
    throw new Error('Cannot generate arrangement: insufficient terms');
  }
  
  // Create array of indices for available terms
  const termIndices = Array.from({ length: termCount }, (_, i) => i);
  
  // Shuffle the indices
  const shuffledIndices = fisherYatesShuffle(termIndices);
  
  // Take first 24 shuffled indices for the grid (excluding center)
  const gridIndices = shuffledIndices.slice(0, 24);
  
  // Create 25-element array with free space at center (index 12)
  const arrangement: number[] = [];
  let termIndex = 0;
  
  for (let i = 0; i < 25; i++) {
    if (i === 12) {
      // Center square is free space
      arrangement[i] = -1;
    } else {
      arrangement[i] = gridIndices[termIndex];
      termIndex++;
    }
  }
  
  return arrangement;
}

/**
 * Creates a complete bingo card with randomized term arrangement
 * @param title - Card title
 * @param terms - Array of terms (minimum 24 required)
 * @param freeSpaceImage - Optional image URL for free space
 * @param freeSpaceIcon - Optional icon ID for free space
 * @returns CardData object with randomized arrangement (without id and timestamps)
 */
export function generateBingoCard(
  title: string,
  terms: string[],
  freeSpaceImage?: string,
  freeSpaceIcon?: string
): Omit<CardData, 'id' | 'createdAt' | 'updatedAt'> {
  const validation = validateTerms(terms);
  if (!validation.isValid) {
    throw new Error(validation.error);
  }
  
  const cleanTerms = terms.filter(term => term.trim().length > 0);
  const arrangement = generateCardArrangement(cleanTerms.length);
  
  return {
    title: title.trim(),
    terms: cleanTerms,
    freeSpaceImage,
    freeSpaceIcon: freeSpaceIcon || 'star',
    arrangement
  };
}

/**
 * Generates multiple unique variants of a bingo card with memory optimization
 * @param cardData - Base card data
 * @param variantCount - Number of variants to generate (1-50)
 * @returns Array of CardData objects with different arrangements (without id and timestamps)
 */
export function generateCardVariants(
  cardData: Omit<CardData, 'id' | 'createdAt' | 'updatedAt'>, 
  variantCount: number
): Omit<CardData, 'id' | 'createdAt' | 'updatedAt'>[] {
  if (variantCount < 1 || variantCount > 50) {
    throw new Error('Variant count must be between 1 and 50');
  }
  
  const validation = validateTerms(cardData.terms);
  if (!validation.isValid) {
    throw new Error(validation.error);
  }
  
  const variants: Omit<CardData, 'id' | 'createdAt' | 'updatedAt'>[] = [];
  
  // Pre-allocate array for better memory management
  variants.length = variantCount;
  
  for (let i = 0; i < variantCount; i++) {
    const arrangement = generateCardArrangement(cardData.terms.length);
    variants[i] = {
      title: cardData.title,
      terms: cardData.terms, // Reuse the same terms array reference
      freeSpaceImage: cardData.freeSpaceImage,
      freeSpaceIcon: cardData.freeSpaceIcon,
      arrangement
    };
  }
  
  return variants;
}

