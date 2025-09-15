import { describe, it, expect } from 'vitest';
import {
  fisherYatesShuffle,
  validateTerms,
  generateCardArrangement,
  generateBingoCard,
  generateCardVariants
} from '../cardGenerator';

describe('fisherYatesShuffle', () => {
  it('should return an array of the same length', () => {
    const input = [1, 2, 3, 4, 5];
    const result = fisherYatesShuffle(input);
    expect(result).toHaveLength(input.length);
  });

  it('should contain all original elements', () => {
    const input = [1, 2, 3, 4, 5];
    const result = fisherYatesShuffle(input);
    expect(result.sort()).toEqual(input.sort());
  });

  it('should not modify the original array', () => {
    const input = [1, 2, 3, 4, 5];
    const original = [...input];
    fisherYatesShuffle(input);
    expect(input).toEqual(original);
  });

  it('should handle empty arrays', () => {
    const result = fisherYatesShuffle([]);
    expect(result).toEqual([]);
  });

  it('should handle single element arrays', () => {
    const result = fisherYatesShuffle([42]);
    expect(result).toEqual([42]);
  });
});

describe('validateTerms', () => {
  it('should return valid for exactly 24 terms', () => {
    const terms = Array.from({ length: 24 }, (_, i) => `term${i + 1}`);
    const result = validateTerms(terms);
    expect(result.isValid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('should return valid for more than 24 terms', () => {
    const terms = Array.from({ length: 30 }, (_, i) => `term${i + 1}`);
    const result = validateTerms(terms);
    expect(result.isValid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('should return invalid for fewer than 24 terms', () => {
    const terms = Array.from({ length: 23 }, (_, i) => `term${i + 1}`);
    const result = validateTerms(terms);
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('Insufficient terms provided');
    expect(result.error).toContain('23');
  });

  it('should filter out empty terms before validation', () => {
    const terms = [
      'term1', 'term2', '', 'term3', '   ', 'term4',
      ...Array.from({ length: 20 }, (_, i) => `term${i + 5}`)
    ];
    const result = validateTerms(terms);
    expect(result.isValid).toBe(true);
  });

  it('should return invalid when empty terms reduce count below 24', () => {
    const terms = [
      ...Array.from({ length: 20 }, (_, i) => `term${i + 1}`),
      '', '   ', '', ''
    ];
    const result = validateTerms(terms);
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('20');
  });
});

describe('generateCardArrangement', () => {
  it('should generate arrangement with 25 elements', () => {
    const arrangement = generateCardArrangement(24);
    expect(arrangement).toHaveLength(25);
  });

  it('should have -1 at center position (index 12)', () => {
    const arrangement = generateCardArrangement(24);
    expect(arrangement[12]).toBe(-1);
  });

  it('should contain indices 0 through 23 (excluding center)', () => {
    const arrangement = generateCardArrangement(24);
    const nonCenterIndices = arrangement.filter((_, i) => i !== 12);
    const sortedIndices = nonCenterIndices.sort((a, b) => a - b);
    const expected = Array.from({ length: 24 }, (_, i) => i);
    expect(sortedIndices).toEqual(expected);
  });

  it('should throw error for insufficient terms', () => {
    expect(() => generateCardArrangement(23)).toThrow('insufficient terms');
  });

  it('should work with more than 24 terms', () => {
    const arrangement = generateCardArrangement(30);
    expect(arrangement).toHaveLength(25);
    expect(arrangement[12]).toBe(-1);
    
    // Should contain 24 unique indices from 0-29
    const nonCenterIndices = arrangement.filter((_, i) => i !== 12);
    expect(nonCenterIndices).toHaveLength(24);
    expect(Math.max(...nonCenterIndices)).toBeLessThan(30);
    expect(Math.min(...nonCenterIndices)).toBeGreaterThanOrEqual(0);
  });

  it('should generate different arrangements on multiple calls', () => {
    const arrangement1 = generateCardArrangement(50);
    const arrangement2 = generateCardArrangement(50);
    
    // Very unlikely to be identical with 50 terms
    expect(arrangement1).not.toEqual(arrangement2);
  });
});

describe('generateBingoCard', () => {
  const validTerms = Array.from({ length: 24 }, (_, i) => `term${i + 1}`);

  it('should create card with provided title and terms', () => {
    const card = generateBingoCard('Test Card', validTerms);
    expect(card.title).toBe('Test Card');
    expect(card.terms).toEqual(validTerms);
  });

  it('should trim whitespace from title', () => {
    const card = generateBingoCard('  Test Card  ', validTerms);
    expect(card.title).toBe('Test Card');
  });

  it('should include freeSpaceImage when provided', () => {
    const imageUrl = 'https://example.com/image.jpg';
    const card = generateBingoCard('Test', validTerms, imageUrl);
    expect(card.freeSpaceImage).toBe(imageUrl);
  });

  it('should generate arrangement array', () => {
    const card = generateBingoCard('Test', validTerms);
    expect(card.arrangement).toBeDefined();
    expect(card.arrangement).toHaveLength(25);
    expect(card.arrangement![12]).toBe(-1);
  });

  it('should throw error for insufficient terms', () => {
    const insufficientTerms = Array.from({ length: 23 }, (_, i) => `term${i + 1}`);
    expect(() => generateBingoCard('Test', insufficientTerms)).toThrow('Insufficient terms');
  });

  it('should filter empty terms before processing', () => {
    const termsWithEmpties = [
      ...validTerms,
      '', '   ', ''
    ];
    const card = generateBingoCard('Test', termsWithEmpties);
    expect(card.terms).toEqual(validTerms);
  });
});

describe('generateCardVariants', () => {
  const baseCard = {
    title: 'Test Card',
    terms: Array.from({ length: 24 }, (_, i) => `term${i + 1}`),
    freeSpaceImage: 'test.jpg'
  };

  it('should generate requested number of variants', () => {
    const variants = generateCardVariants(baseCard, 3);
    expect(variants).toHaveLength(3);
  });

  it('should preserve title, terms, and freeSpaceImage in all variants', () => {
    const variants = generateCardVariants(baseCard, 5);
    
    variants.forEach(variant => {
      expect(variant.title).toBe(baseCard.title);
      expect(variant.terms).toEqual(baseCard.terms);
      expect(variant.freeSpaceImage).toBe(baseCard.freeSpaceImage);
    });
  });

  it('should generate different arrangements for each variant', () => {
    const variants = generateCardVariants(baseCard, 5);
    
    // Check that not all arrangements are identical
    const arrangements = variants.map(v => v.arrangement);
    const firstArrangement = arrangements[0];
    const allIdentical = arrangements.every(arr => 
      JSON.stringify(arr) === JSON.stringify(firstArrangement)
    );
    
    expect(allIdentical).toBe(false);
  });

  it('should throw error for invalid variant count', () => {
    expect(() => generateCardVariants(baseCard, 0)).toThrow('between 1 and 50');
    expect(() => generateCardVariants(baseCard, 51)).toThrow('between 1 and 50');
    expect(() => generateCardVariants(baseCard, -1)).toThrow('between 1 and 50');
  });

  it('should throw error for insufficient terms', () => {
    const invalidCard = {
      ...baseCard,
      terms: Array.from({ length: 23 }, (_, i) => `term${i + 1}`)
    };
    
    expect(() => generateCardVariants(invalidCard, 3)).toThrow('Insufficient terms');
  });

  it('should work with minimum and maximum variant counts', () => {
    const singleVariant = generateCardVariants(baseCard, 1);
    expect(singleVariant).toHaveLength(1);
    
    const maxVariants = generateCardVariants(baseCard, 50);
    expect(maxVariants).toHaveLength(50);
  });
});