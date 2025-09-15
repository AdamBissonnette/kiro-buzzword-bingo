import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { encodeCardData, decodeCardData, generateShareableUrl, getCardDataFromUrl } from '../urlEncoder';
import type { CardData } from '../../types';

describe('urlEncoder', () => {
  const mockCardData: CardData = {
    title: 'Test Bingo Card',
    terms: [
      'synergy', 'paradigm', 'leverage', 'optimize', 'streamline',
      'innovative', 'disruptive', 'scalable', 'agile', 'robust',
      'seamless', 'cutting-edge', 'best-practice', 'game-changer', 'value-add',
      'low-hanging-fruit', 'circle-back', 'touch-base', 'deep-dive', 'pivot',
      'bandwidth', 'deliverable', 'actionable', 'holistic'
    ],
    freeSpaceImage: 'https://example.com/image.jpg',
    arrangement: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23]
  };

  describe('encodeCardData', () => {
    it('should encode card data to a base64 string', () => {
      const encoded = encodeCardData(mockCardData);
      expect(typeof encoded).toBe('string');
      expect(encoded.length).toBeGreaterThan(0);
      // Should not contain base64 padding or unsafe URL characters
      expect(encoded).not.toMatch(/[+=/]/);
    });

    it('should handle card data without optional fields', () => {
      const minimalCard: CardData = {
        title: 'Minimal Card',
        terms: ['term1', 'term2', 'term3']
      };
      const encoded = encodeCardData(minimalCard);
      expect(typeof encoded).toBe('string');
      expect(encoded.length).toBeGreaterThan(0);
    });

    it('should throw error for invalid input', () => {
      // Create an object that will cause JSON.stringify to throw
      const circularObj = {} as Record<string, unknown>;
      circularObj.self = circularObj;
      expect(() => encodeCardData(circularObj)).toThrow('Failed to encode card data');
    });
  });

  describe('decodeCardData', () => {
    it('should decode encoded card data back to original', () => {
      const encoded = encodeCardData(mockCardData);
      const decoded = decodeCardData(encoded);
      
      expect(decoded).toEqual(mockCardData);
    });

    it('should handle minimal card data', () => {
      const minimalCard: CardData = {
        title: 'Minimal Card',
        terms: ['term1', 'term2', 'term3']
      };
      const encoded = encodeCardData(minimalCard);
      const decoded = decodeCardData(encoded);
      
      expect(decoded).toEqual(minimalCard);
    });

    it('should throw error for invalid encoded data', () => {
      expect(() => decodeCardData('invalid-data')).toThrow('Failed to decode card data');
    });

    it('should throw error for malformed JSON', () => {
      const invalidBase64 = btoa('invalid json');
      expect(() => decodeCardData(invalidBase64)).toThrow('Failed to decode card data');
    });

    it('should throw error for missing required fields', () => {
      const invalidData = { title: 'Test' }; // Missing terms array
      const encoded = btoa(JSON.stringify(invalidData));
      expect(() => decodeCardData(encoded)).toThrow('Failed to decode card data');
    });
  });

  describe('generateShareableUrl', () => {
    beforeEach(() => {
      // Mock window.location
      Object.defineProperty(window, 'location', {
        value: {
          origin: 'https://example.com',
          pathname: '/bingo'
        },
        writable: true
      });
    });

    it('should generate a valid shareable URL', () => {
      const url = generateShareableUrl(mockCardData);
      
      expect(url).toMatch(/^https:\/\/example\.com\/bingo#\/play\?data=.+/);
      expect(url).toContain('#/play?data=');
    });

    it('should generate different URLs for different card data', () => {
      const card1: CardData = { title: 'Card 1', terms: ['a', 'b', 'c'] };
      const card2: CardData = { title: 'Card 2', terms: ['x', 'y', 'z'] };
      
      const url1 = generateShareableUrl(card1);
      const url2 = generateShareableUrl(card2);
      
      expect(url1).not.toEqual(url2);
    });
  });

  describe('getCardDataFromUrl', () => {
    let originalLocation: Location;

    beforeEach(() => {
      originalLocation = window.location;
    });

    afterEach(() => {
      Object.defineProperty(window, 'location', {
        value: originalLocation,
        writable: true
      });
    });

    it('should extract card data from URL hash', () => {
      const encoded = encodeCardData(mockCardData);
      
      Object.defineProperty(window, 'location', {
        value: {
          ...originalLocation,
          hash: `#/play?data=${encoded}`
        },
        writable: true
      });

      const extracted = getCardDataFromUrl();
      expect(extracted).toEqual(mockCardData);
    });

    it('should return null when no data parameter exists', () => {
      Object.defineProperty(window, 'location', {
        value: {
          ...originalLocation,
          hash: '#/play'
        },
        writable: true
      });

      const extracted = getCardDataFromUrl();
      expect(extracted).toBeNull();
    });

    it('should return null for invalid encoded data', () => {
      Object.defineProperty(window, 'location', {
        value: {
          ...originalLocation,
          hash: '#/play?data=invalid-data'
        },
        writable: true
      });

      const extracted = getCardDataFromUrl();
      expect(extracted).toBeNull();
    });

    it('should return null when no hash exists', () => {
      Object.defineProperty(window, 'location', {
        value: {
          ...originalLocation,
          hash: ''
        },
        writable: true
      });

      const extracted = getCardDataFromUrl();
      expect(extracted).toBeNull();
    });
  });
});