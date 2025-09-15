import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { useCardState } from '../useCardState';


describe('useCardState', () => {
  let hook: ReturnType<typeof renderHook<ReturnType<typeof useCardState>, unknown>>;

  beforeEach(() => {
    hook = renderHook(() => useCardState());
  });

  describe('Initial State', () => {
    it('should initialize with null card data', () => {
      expect(hook.result.current.cardData).toBeNull();
    });

    it('should initialize with empty variants array', () => {
      expect(hook.result.current.variants).toEqual([]);
    });

    it('should initialize with editing mode false', () => {
      expect(hook.result.current.isEditing).toBe(false);
    });

    it('should initialize with empty validation errors', () => {
      expect(hook.result.current.validationErrors).toEqual({});
    });
  });

  describe('Card Validation', () => {
    it('should validate title is required', () => {
      const errors = hook.result.current.validateCard({ title: '' });
      expect(errors.title).toBe('Title is required');
    });

    it('should validate title minimum length', () => {
      const errors = hook.result.current.validateCard({ title: 'ab' });
      expect(errors.title).toBe('Title must be at least 3 characters long');
    });

    it('should validate title maximum length', () => {
      const longTitle = 'a'.repeat(101);
      const errors = hook.result.current.validateCard({ title: longTitle });
      expect(errors.title).toBe('Title must be less than 100 characters');
    });

    it('should validate terms are required', () => {
      const errors = hook.result.current.validateCard({ terms: [] });
      expect(errors.terms).toBe('At least one term is required');
    });

    it('should validate minimum number of terms', () => {
      const terms = Array.from({ length: 23 }, (_, i) => `Term ${i + 1}`);
      const errors = hook.result.current.validateCard({ terms });
      expect(errors.terms).toBe('Need at least 24 terms for a bingo card. You have 23 terms.');
    });

    it('should validate non-empty terms', () => {
      const terms = Array.from({ length: 24 }, (_, i) => i < 20 ? `Term ${i + 1}` : '   ');
      const errors = hook.result.current.validateCard({ terms });
      expect(errors.terms).toBe('Need at least 24 non-empty terms. You have 20 valid terms.');
    });

    it('should validate unique terms', () => {
      const terms = Array.from({ length: 24 }, (_, i) => i < 12 ? `Term ${i + 1}` : 'Duplicate');
      const errors = hook.result.current.validateCard({ terms });
      expect(errors.terms).toBe('Duplicate terms found. Each term must be unique.');
    });

    it('should validate free space image URL', () => {
      const errors = hook.result.current.validateCard({ 
        freeSpaceImage: 'invalid-url' 
      });
      expect(errors.freeSpaceImage).toBe('Please enter a valid image URL');
    });

    it('should pass validation with valid data', () => {
      const validData = {
        title: 'Test Card',
        terms: Array.from({ length: 24 }, (_, i) => `Term ${i + 1}`),
        freeSpaceImage: 'https://example.com/image.jpg'
      };
      const errors = hook.result.current.validateCard(validData);
      expect(Object.keys(errors)).toHaveLength(0);
    });
  });

  describe('Card Creation', () => {
    it('should create a card with valid data', () => {
      const cardData = {
        title: 'Test Card',
        terms: Array.from({ length: 24 }, (_, i) => `Term ${i + 1}`),
        freeSpaceIcon: 'star'
      };

      act(() => {
        hook.result.current.createCard(cardData);
      });

      const result = hook.result.current.cardData;
      expect(result).not.toBeNull();
      expect(result?.title).toBe('Test Card');
      expect(result?.terms).toHaveLength(24);
      expect(result?.id).toBeDefined();
      expect(result?.createdAt).toBeInstanceOf(Date);
      expect(result?.updatedAt).toBeInstanceOf(Date);
      expect(hook.result.current.isEditing).toBe(false);
    });

    it('should not create a card with invalid data', () => {
      const invalidCardData = {
        title: 'ab', // Too short
        terms: ['term1'], // Too few terms
        freeSpaceIcon: 'star'
      };

      act(() => {
        hook.result.current.createCard(invalidCardData);
      });

      expect(hook.result.current.cardData).toBeNull();
      expect(hook.result.current.validationErrors.title).toBeDefined();
      expect(hook.result.current.validationErrors.terms).toBeDefined();
    });
  });

  describe('Card Updates', () => {
    beforeEach(() => {
      const cardData = {
        title: 'Test Card',
        terms: Array.from({ length: 24 }, (_, i) => `Term ${i + 1}`),
        freeSpaceIcon: 'star'
      };

      act(() => {
        hook.result.current.createCard(cardData);
      });
    });

    it('should update card data', () => {
      act(() => {
        hook.result.current.updateCardData({ title: 'Updated Title' });
      });

      expect(hook.result.current.cardData?.title).toBe('Updated Title');
      expect(hook.result.current.cardData?.updatedAt).toBeInstanceOf(Date);
    });

    it('should validate updates', () => {
      act(() => {
        hook.result.current.updateCardData({ title: 'ab' }); // Too short
      });

      expect(hook.result.current.validationErrors.title).toBeDefined();
    });
  });

  describe('Card Randomization', () => {
    beforeEach(() => {
      const cardData = {
        title: 'Test Card',
        terms: Array.from({ length: 24 }, (_, i) => `Term ${i + 1}`),
        freeSpaceIcon: 'star'
      };

      act(() => {
        hook.result.current.createCard(cardData);
      });
    });

    it('should randomize card arrangement', () => {
      const originalArrangement = hook.result.current.cardData?.arrangement;

      act(() => {
        hook.result.current.randomizeCard();
      });

      const newArrangement = hook.result.current.cardData?.arrangement;
      expect(newArrangement).toBeDefined();
      expect(newArrangement).not.toEqual(originalArrangement);
    });
  });

  describe('Variant Generation', () => {
    beforeEach(() => {
      const cardData = {
        title: 'Test Card',
        terms: Array.from({ length: 24 }, (_, i) => `Term ${i + 1}`),
        freeSpaceIcon: 'star'
      };

      act(() => {
        hook.result.current.createCard(cardData);
      });
    });

    it('should generate multiple variants', async () => {
      await act(async () => {
        await hook.result.current.generateVariants(3);
      });

      await waitFor(() => {
        expect(hook.result.current.variants).toHaveLength(3);
      });
      
      hook.result.current.variants.forEach(variant => {
        expect(variant.id).toBeDefined();
        expect(variant.title).toBe('Test Card');
        expect(variant.terms).toHaveLength(24);
        expect(variant.arrangement).toBeDefined();
      });
    });

    it('should clear variants when count is 0', async () => {
      await act(async () => {
        await hook.result.current.generateVariants(3);
      });

      await waitFor(() => {
        expect(hook.result.current.variants).toHaveLength(3);
      });

      await act(async () => {
        await hook.result.current.generateVariants(0);
      });

      expect(hook.result.current.variants).toHaveLength(0);
    });
  });

  describe('State Management', () => {
    it('should clear card and reset state', async () => {
      const cardData = {
        title: 'Test Card',
        terms: Array.from({ length: 24 }, (_, i) => `Term ${i + 1}`),
        freeSpaceIcon: 'star'
      };

      act(() => {
        hook.result.current.createCard(cardData);
      });

      await act(async () => {
        await hook.result.current.generateVariants(2);
      });

      act(() => {
        hook.result.current.setEditingMode(true);
      });

      expect(hook.result.current.cardData).not.toBeNull();
      
      await waitFor(() => {
        expect(hook.result.current.variants).toHaveLength(2);
      });
      
      expect(hook.result.current.isEditing).toBe(true);

      act(() => {
        hook.result.current.clearCard();
      });

      expect(hook.result.current.cardData).toBeNull();
      expect(hook.result.current.variants).toHaveLength(0);
      expect(hook.result.current.isEditing).toBe(false);
      expect(hook.result.current.validationErrors).toEqual({});
    });

    it('should set editing mode', () => {
      act(() => {
        hook.result.current.setEditingMode(true);
      });

      expect(hook.result.current.isEditing).toBe(true);

      act(() => {
        hook.result.current.setEditingMode(false);
      });

      expect(hook.result.current.isEditing).toBe(false);
    });
  });
});