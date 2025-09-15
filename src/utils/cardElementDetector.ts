import type { CardData } from '../types';

export interface CardElementValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  element: HTMLElement | null;
  dimensions: { width: number; height: number };
  contentInfo: {
    hasTitle: boolean;
    hasGrid: boolean;
    hasTerms: boolean;
    termCount: number;
  };
}

export interface CardElementsDetectionResult {
  elements: HTMLElement[];
  validElements: HTMLElement[];
  validationResults: CardElementValidation[];
  totalFound: number;
  totalValid: number;
  errors: string[];
  warnings: string[];
}

export class CardElementDetector {
  private static readonly CARD_SELECTOR = '[data-card-element]';
  private static readonly MIN_CARD_WIDTH = 200;
  private static readonly MIN_CARD_HEIGHT = 200;
  private static readonly MAX_WAIT_TIME = 5000; // 5 seconds
  private static readonly POLL_INTERVAL = 100; // 100ms

  /**
   * Validates a single card element for export readiness
   */
  static validateCardElement(element: HTMLElement): CardElementValidation {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Basic element validation
    if (!element) {
      return {
        isValid: false,
        errors: ['Element is null or undefined'],
        warnings: [],
        element: null,
        dimensions: { width: 0, height: 0 },
        contentInfo: {
          hasTitle: false,
          hasGrid: false,
          hasTerms: false,
          termCount: 0
        }
      };
    }

    // Check if element is in DOM
    if (!document.body.contains(element)) {
      errors.push('Element is not attached to the document');
    }

    // Check element dimensions
    const rect = element.getBoundingClientRect();
    const computedStyle = window.getComputedStyle(element);
    
    if (rect.width < this.MIN_CARD_WIDTH || rect.height < this.MIN_CARD_HEIGHT) {
      errors.push(`Card dimensions too small: ${rect.width}x${rect.height}px (minimum: ${this.MIN_CARD_WIDTH}x${this.MIN_CARD_HEIGHT}px)`);
    }

    // Check visibility
    if (computedStyle.display === 'none') {
      errors.push('Card element is hidden (display: none)');
    }

    if (computedStyle.visibility === 'hidden') {
      warnings.push('Card element visibility is hidden');
    }

    if (parseFloat(computedStyle.opacity) === 0) {
      warnings.push('Card element opacity is 0');
    }

    // Check for required card content
    const contentInfo = this.analyzeCardContent(element);
    
    if (!contentInfo.hasTitle) {
      warnings.push('Card appears to be missing a title');
    }

    if (!contentInfo.hasGrid) {
      errors.push('Card is missing the bingo grid structure');
    }

    if (!contentInfo.hasTerms) {
      errors.push('Card grid appears to have no terms');
    }

    if (contentInfo.termCount < 24) {
      warnings.push(`Card has fewer terms than expected: ${contentInfo.termCount} (expected: 24)`);
    }

    // Check if element is fully rendered
    if (!this.isElementFullyRendered(element)) {
      warnings.push('Card element may not be fully rendered');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      element,
      dimensions: { width: rect.width, height: rect.height },
      contentInfo
    };
  }

  /**
   * Analyzes the content structure of a card element
   */
  private static analyzeCardContent(element: HTMLElement): CardElementValidation['contentInfo'] {
    // Look for title element
    const titleElement = element.querySelector('h1, h2, h3, .title, [class*="title"]');
    const hasTitle = titleElement ? (titleElement.textContent?.trim().length ?? 0) > 0 : false;

    // Look for grid structure
    const gridElement = element.querySelector('.grid, [class*="grid"], table, .bingo-grid');
    const hasGrid = !!gridElement;

    // Count terms in grid
    let termCount = 0;
    let hasTerms = false;

    if (gridElement) {
      // Look for grid cells/squares
      const cells = gridElement.querySelectorAll(
        '.square, [class*="square"], td, .cell, [class*="cell"], .grid-item, [class*="grid-item"]'
      );
      
      termCount = cells.length;
      
      // Check if cells have content
      let cellsWithContent = 0;
      cells.forEach(cell => {
        const text = cell.textContent?.trim();
        if (text && text.length > 0) {
          cellsWithContent++;
        }
      });
      
      hasTerms = cellsWithContent > 0;
    }

    return {
      hasTitle: hasTitle,
      hasGrid,
      hasTerms,
      termCount
    };
  }

  /**
   * Checks if an element is fully rendered by looking for loaded images and computed styles
   */
  private static isElementFullyRendered(element: HTMLElement): boolean {
    // Check if all images are loaded
    const images = element.querySelectorAll('img');
    for (const img of images) {
      if (!img.complete || img.naturalHeight === 0) {
        return false;
      }
    }

    // Check if element has computed dimensions
    const rect = element.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) {
      return false;
    }

    // Check if fonts are loaded (basic check)
    const computedStyle = window.getComputedStyle(element);
    if (computedStyle.fontFamily === '') {
      return false;
    }

    return true;
  }

  /**
   * Finds all card elements in a container
   */
  static findCardElements(container: HTMLElement | Document = document): HTMLElement[] {
    const elements = container.querySelectorAll(this.CARD_SELECTOR) as NodeListOf<HTMLElement>;
    return Array.from(elements);
  }

  /**
   * Finds and validates all card elements in a container
   */
  static detectAndValidateCardElements(
    container: HTMLElement | Document = document
  ): CardElementsDetectionResult {
    const elements = this.findCardElements(container);
    const validationResults: CardElementValidation[] = [];
    const validElements: HTMLElement[] = [];
    const allErrors: string[] = [];
    const allWarnings: string[] = [];

    elements.forEach((element, index) => {
      const validation = this.validateCardElement(element);
      validationResults.push(validation);

      if (validation.isValid) {
        validElements.push(element);
      }

      // Collect errors and warnings with element context
      validation.errors.forEach(error => {
        allErrors.push(`Card ${index + 1}: ${error}`);
      });

      validation.warnings.forEach(warning => {
        allWarnings.push(`Card ${index + 1}: ${warning}`);
      });
    });

    return {
      elements,
      validElements,
      validationResults,
      totalFound: elements.length,
      totalValid: validElements.length,
      errors: allErrors,
      warnings: allWarnings
    };
  }

  /**
   * Waits for card elements to be rendered and ready for export
   */
  static async waitForCardElementsReady(
    container: HTMLElement | Document = document,
    expectedCount?: number,
    timeout: number = this.MAX_WAIT_TIME
  ): Promise<CardElementsDetectionResult> {
    const startTime = Date.now();
    
    return new Promise((resolve, reject) => {
      const checkElements = () => {
        const result = this.detectAndValidateCardElements(container);
        
        // Check if we have the expected number of valid elements
        const hasExpectedCount = expectedCount === undefined || result.totalValid >= expectedCount;
        const hasValidElements = result.totalValid > 0;
        
        if (hasValidElements && hasExpectedCount) {
          resolve(result);
          return;
        }

        // Check timeout
        if (Date.now() - startTime > timeout) {
          reject(new Error(
            `Timeout waiting for card elements. Found ${result.totalFound} elements, ${result.totalValid} valid. ` +
            `Expected: ${expectedCount || 'at least 1'}. Errors: ${result.errors.join('; ')}`
          ));
          return;
        }

        // Continue polling
        setTimeout(checkElements, this.POLL_INTERVAL);
      };

      checkElements();
    });
  }

  /**
   * Gets card elements for export with proper validation and error handling
   */
  static async getCardElementsForExport(
    container: HTMLElement | Document = document,
    options: {
      expectedCount?: number;
      timeout?: number;
      requireAllValid?: boolean;
    } = {}
  ): Promise<HTMLElement[]> {
    const {
      expectedCount,
      timeout = this.MAX_WAIT_TIME,
      requireAllValid = true
    } = options;

    try {
      const result = await this.waitForCardElementsReady(container, expectedCount, timeout);
      
      if (result.totalValid === 0) {
        throw new Error(
          `No valid card elements found for export. Found ${result.totalFound} elements but none are valid. ` +
          `Errors: ${result.errors.join('; ')}`
        );
      }

      if (requireAllValid && result.totalValid < result.totalFound) {
        throw new Error(
          `Some card elements are not valid for export. Found ${result.totalFound} elements, ` +
          `${result.totalValid} valid. Errors: ${result.errors.join('; ')}`
        );
      }

      if (expectedCount && result.totalValid < expectedCount) {
        throw new Error(
          `Expected ${expectedCount} card elements but only found ${result.totalValid} valid elements. ` +
          `Errors: ${result.errors.join('; ')}`
        );
      }

      return result.validElements;
    } catch (error) {
      throw new Error(
        `Failed to get card elements for export: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Validates card elements match the provided card data
   */
  static validateCardElementsMatchData(
    elements: HTMLElement[],
    cardData: CardData[]
  ): { isValid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (elements.length !== cardData.length) {
      errors.push(
        `Element count mismatch: found ${elements.length} elements but have ${cardData.length} card data objects`
      );
    }

    elements.forEach((element, index) => {
      const data = cardData[index];
      if (!data) {
        errors.push(`No card data available for element ${index + 1}`);
        return;
      }

      const validation = this.validateCardElement(element);
      if (!validation.isValid) {
        errors.push(`Element ${index + 1} is not valid: ${validation.errors.join(', ')}`);
        return;
      }

      // Check if element content matches card data
      const titleElement = element.querySelector('h1, h2, h3, .title, [class*="title"]');
      const elementTitle = titleElement?.textContent?.trim();
      
      if (elementTitle !== data.title) {
        warnings.push(
          `Element ${index + 1} title mismatch: element shows "${elementTitle}" but data has "${data.title}"`
        );
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Gets debugging information about card element detection
   */
  static getDebugInfo(container: HTMLElement | Document = document): {
    totalElements: number;
    cardElements: number;
    validCardElements: number;
    elementDetails: Array<{
      index: number;
      tagName: string;
      id: string;
      className: string;
      isValid: boolean;
      dimensions: { width: number; height: number };
      errors: string[];
      warnings: string[];
    }>;
  } {
    const allElements = container.querySelectorAll('*').length;
    const result = this.detectAndValidateCardElements(container);
    
    const elementDetails = result.elements.map((element, index) => {
      const validation = result.validationResults[index];
      return {
        index,
        tagName: element.tagName,
        id: element.id || '',
        className: element.className || '',
        isValid: validation.isValid,
        dimensions: validation.dimensions,
        errors: validation.errors,
        warnings: validation.warnings
      };
    });

    return {
      totalElements: allElements,
      cardElements: result.totalFound,
      validCardElements: result.totalValid,
      elementDetails
    };
  }
}