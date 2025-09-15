import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CardElementDetector } from '../cardElementDetector';

// Mock DOM methods
const mockGetBoundingClientRect = vi.fn();
const mockGetComputedStyle = vi.fn();

// Setup DOM mocks
beforeEach(() => {
  // Mock getBoundingClientRect
  Element.prototype.getBoundingClientRect = mockGetBoundingClientRect;
  
  // Mock getComputedStyle
  Object.defineProperty(window, 'getComputedStyle', {
    value: mockGetComputedStyle,
    writable: true
  });

  // Reset mocks
  mockGetBoundingClientRect.mockReturnValue({
    width: 300,
    height: 400,
    top: 0,
    left: 0,
    bottom: 400,
    right: 300
  });

  mockGetComputedStyle.mockReturnValue({
    display: 'block',
    visibility: 'visible',
    opacity: '1',
    fontFamily: 'Arial, sans-serif'
  });
});

afterEach(() => {
  vi.clearAllMocks();
  
  // Clean up any card elements that might have been left in the DOM
  const cardElements = document.querySelectorAll('[data-card-element]');
  cardElements.forEach(element => {
    if (element.parentNode) {
      element.parentNode.removeChild(element);
    }
  });
});

describe('CardElementDetector', () => {
  describe('validateCardElement', () => {
    it('should validate a properly structured card element', () => {
      // Create a mock card element
      const cardElement = document.createElement('div');
      cardElement.setAttribute('data-card-element', '');
      
      // Add title
      const title = document.createElement('h2');
      title.textContent = 'Test Bingo Card';
      cardElement.appendChild(title);
      
      // Add grid
      const grid = document.createElement('div');
      grid.className = 'grid';
      
      // Add 25 squares
      for (let i = 0; i < 25; i++) {
        const square = document.createElement('div');
        square.className = 'square';
        square.textContent = `Term ${i + 1}`;
        grid.appendChild(square);
      }
      
      cardElement.appendChild(grid);
      document.body.appendChild(cardElement);

      const validation = CardElementDetector.validateCardElement(cardElement);

      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
      expect(validation.contentInfo.hasTitle).toBe(true);
      expect(validation.contentInfo.hasGrid).toBe(true);
      expect(validation.contentInfo.hasTerms).toBe(true);
      expect(validation.contentInfo.termCount).toBe(25);

      document.body.removeChild(cardElement);
    });

    it('should fail validation for null element', () => {
      const validation = CardElementDetector.validateCardElement(null as unknown as HTMLElement);

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Element is null or undefined');
    });

    it('should fail validation for element not in DOM', () => {
      const cardElement = document.createElement('div');
      cardElement.setAttribute('data-card-element', '');

      const validation = CardElementDetector.validateCardElement(cardElement);

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Element is not attached to the document');
    });

    it('should fail validation for hidden element', () => {
      const cardElement = document.createElement('div');
      cardElement.setAttribute('data-card-element', '');
      document.body.appendChild(cardElement);

      mockGetComputedStyle.mockReturnValue({
        display: 'none',
        visibility: 'visible',
        opacity: '1',
        fontFamily: 'Arial, sans-serif'
      });

      const validation = CardElementDetector.validateCardElement(cardElement);

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Card element is hidden (display: none)');

      document.body.removeChild(cardElement);
    });

    it('should fail validation for element with small dimensions', () => {
      const cardElement = document.createElement('div');
      cardElement.setAttribute('data-card-element', '');
      document.body.appendChild(cardElement);

      mockGetBoundingClientRect.mockReturnValue({
        width: 50,
        height: 50,
        top: 0,
        left: 0,
        bottom: 50,
        right: 50
      });

      const validation = CardElementDetector.validateCardElement(cardElement);

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Card dimensions too small: 50x50px (minimum: 200x200px)');

      document.body.removeChild(cardElement);
    });

    it('should warn about missing grid structure', () => {
      const cardElement = document.createElement('div');
      cardElement.setAttribute('data-card-element', '');
      cardElement.textContent = 'Some content';
      document.body.appendChild(cardElement);

      const validation = CardElementDetector.validateCardElement(cardElement);

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Card is missing the bingo grid structure');

      document.body.removeChild(cardElement);
    });
  });

  describe('findCardElements', () => {
    it('should find all card elements in document', () => {
      // Create multiple card elements
      const card1 = document.createElement('div');
      card1.setAttribute('data-card-element', '');
      const card2 = document.createElement('div');
      card2.setAttribute('data-card-element', '');
      
      document.body.appendChild(card1);
      document.body.appendChild(card2);

      const elements = CardElementDetector.findCardElements();

      expect(elements).toHaveLength(2);
      expect(elements).toContain(card1);
      expect(elements).toContain(card2);

      document.body.removeChild(card1);
      document.body.removeChild(card2);
    });

    it('should find card elements in specific container', () => {
      const container = document.createElement('div');
      const card1 = document.createElement('div');
      card1.setAttribute('data-card-element', '');
      const card2 = document.createElement('div');
      card2.setAttribute('data-card-element', '');
      
      container.appendChild(card1);
      container.appendChild(card2);
      document.body.appendChild(container);

      const elements = CardElementDetector.findCardElements(container);

      expect(elements).toHaveLength(2);
      expect(elements).toContain(card1);
      expect(elements).toContain(card2);

      document.body.removeChild(container);
    });
  });

  describe('detectAndValidateCardElements', () => {
    it('should detect and validate multiple card elements', () => {
      // Create valid card elements
      const card1 = createValidCardElement('Card 1');
      const card2 = createValidCardElement('Card 2');
      
      document.body.appendChild(card1);
      document.body.appendChild(card2);

      const result = CardElementDetector.detectAndValidateCardElements();

      expect(result.totalFound).toBe(2);
      expect(result.totalValid).toBe(2);
      expect(result.validElements).toHaveLength(2);
      expect(result.errors).toHaveLength(0);

      document.body.removeChild(card1);
      document.body.removeChild(card2);
    });

    it('should handle mix of valid and invalid elements', () => {
      const validCard = createValidCardElement('Valid Card');
      const invalidCard = document.createElement('div');
      invalidCard.setAttribute('data-card-element', '');
      // Invalid card has no content
      
      document.body.appendChild(validCard);
      document.body.appendChild(invalidCard);

      const result = CardElementDetector.detectAndValidateCardElements();

      expect(result.totalFound).toBe(2);
      expect(result.totalValid).toBe(1);
      expect(result.validElements).toHaveLength(1);
      expect(result.validElements[0]).toBe(validCard);
      expect(result.errors.length).toBeGreaterThan(0);

      document.body.removeChild(validCard);
      document.body.removeChild(invalidCard);
    });
  });

  describe('waitForCardElementsReady', () => {
    it('should resolve when valid elements are found', async () => {
      const card = createValidCardElement('Test Card');
      document.body.appendChild(card);

      const result = await CardElementDetector.waitForCardElementsReady(document, 1, 1000);

      expect(result.totalValid).toBe(1);
      expect(result.validElements[0]).toBe(card);

      document.body.removeChild(card);
    });

    it('should timeout when elements are not found', async () => {
      await expect(
        CardElementDetector.waitForCardElementsReady(document, 1, 100)
      ).rejects.toThrow(/Timeout waiting for card elements/);
    });

    it('should wait for elements to become valid', async () => {
      const card = document.createElement('div');
      card.setAttribute('data-card-element', '');
      document.body.appendChild(card);

      // Initially invalid (no content)
      const result = CardElementDetector.detectAndValidateCardElements();
      expect(result.totalValid).toBe(0);

      // Make it valid after a delay
      setTimeout(() => {
        const title = document.createElement('h2');
        title.textContent = 'Test Card';
        card.appendChild(title);
        
        const grid = document.createElement('div');
        grid.className = 'grid';
        for (let i = 0; i < 25; i++) {
          const square = document.createElement('div');
          square.className = 'square';
          square.textContent = `Term ${i + 1}`;
          grid.appendChild(square);
        }
        card.appendChild(grid);
      }, 50);

      const finalResult = await CardElementDetector.waitForCardElementsReady(document, 1, 1000);

      expect(finalResult.totalValid).toBe(1);

      document.body.removeChild(card);
    });
  });

  describe('getCardElementsForExport', () => {
    it('should return valid elements for export', async () => {
      const card1 = createValidCardElement('Card 1');
      const card2 = createValidCardElement('Card 2');
      
      document.body.appendChild(card1);
      document.body.appendChild(card2);

      const elements = await CardElementDetector.getCardElementsForExport(document, {
        expectedCount: 2,
        timeout: 1000
      });

      expect(elements).toHaveLength(2);
      expect(elements).toContain(card1);
      expect(elements).toContain(card2);

      document.body.removeChild(card1);
      document.body.removeChild(card2);
    });

    it('should throw error when no valid elements found', async () => {
      await expect(
        CardElementDetector.getCardElementsForExport(document, {
          expectedCount: 1,
          timeout: 100
        })
      ).rejects.toThrow(/Failed to get card elements for export/);
    });

    it('should throw error when expected count not met', async () => {
      const card = createValidCardElement('Single Card');
      document.body.appendChild(card);

      await expect(
        CardElementDetector.getCardElementsForExport(document, {
          expectedCount: 2,
          timeout: 100
        })
      ).rejects.toThrow(/Failed to get card elements for export/);

      document.body.removeChild(card);
    });
  });

  describe('validateCardElementsMatchData', () => {
    it('should validate elements match card data', () => {
      const card = createValidCardElement('Test Card');
      document.body.appendChild(card);

      const cardData = [{
        id: '1',
        title: 'Test Card',
        terms: Array.from({ length: 24 }, (_, i) => `Term ${i + 1}`),
        createdAt: new Date(),
        updatedAt: new Date()
      }];

      const validation = CardElementDetector.validateCardElementsMatchData([card], cardData);

      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);

      document.body.removeChild(card);
    });

    it('should detect count mismatch', () => {
      const card = createValidCardElement('Test Card');
      document.body.appendChild(card);

      const cardData = [
        { id: '1', title: 'Card 1', terms: [], createdAt: new Date(), updatedAt: new Date() },
        { id: '2', title: 'Card 2', terms: [], createdAt: new Date(), updatedAt: new Date() }
      ];

      const validation = CardElementDetector.validateCardElementsMatchData([card], cardData);

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Element count mismatch: found 1 elements but have 2 card data objects');

      document.body.removeChild(card);
    });
  });

  describe('getDebugInfo', () => {
    it('should return debug information', () => {
      // Clean up any existing card elements first
      const existingCards = document.querySelectorAll('[data-card-element]');
      existingCards.forEach(card => card.remove());

      const card = createValidCardElement('Debug Card');
      document.body.appendChild(card);

      const debugInfo = CardElementDetector.getDebugInfo();

      expect(debugInfo.cardElements).toBe(1);
      expect(debugInfo.validCardElements).toBe(1);
      expect(debugInfo.elementDetails).toHaveLength(1);
      expect(debugInfo.elementDetails[0].isValid).toBe(true);

      document.body.removeChild(card);
    });
  });
});

// Helper function to create a valid card element
function createValidCardElement(title: string): HTMLElement {
  const cardElement = document.createElement('div');
  cardElement.setAttribute('data-card-element', '');
  
  // Add title
  const titleElement = document.createElement('h2');
  titleElement.textContent = title;
  cardElement.appendChild(titleElement);
  
  // Add grid
  const grid = document.createElement('div');
  grid.className = 'grid';
  
  // Add 25 squares
  for (let i = 0; i < 25; i++) {
    const square = document.createElement('div');
    square.className = 'square';
    square.textContent = `Term ${i + 1}`;
    grid.appendChild(square);
  }
  
  cardElement.appendChild(grid);
  
  return cardElement;
}