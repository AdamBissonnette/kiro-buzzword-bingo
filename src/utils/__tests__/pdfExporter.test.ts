import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PDFExporter } from '../pdfExporter';
import type { CardData } from '../../types';

// Mock jsPDF
vi.mock('jspdf', () => ({
  default: vi.fn().mockImplementation(() => ({
    internal: {
      pageSize: {
        getWidth: () => 210, // A4 width in mm
        getHeight: () => 297 // A4 height in mm
      }
    },
    addImage: vi.fn(),
    addPage: vi.fn(),
    save: vi.fn()
  }))
}));

// Mock html2canvas
vi.mock('html2canvas', () => ({
  default: vi.fn().mockImplementation(() => {
    const mockCanvas = {
      width: 800,
      height: 600,
      toDataURL: vi.fn().mockReturnValue('data:image/png;base64,mockImageData'),
      getContext: vi.fn().mockReturnValue({
        clearRect: vi.fn()
      })
    };
    return Promise.resolve(mockCanvas);
  })
}));

describe('PDFExporter', () => {
  const mockCardData: CardData = {
    id: 'test-id',
    title: 'Test Bingo Card',
    terms: ['term1', 'term2', 'term3'],
    freeSpaceImage: 'test-image.jpg',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  let mockElement: HTMLElement;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock canvas functionality for jsdom
    const mockCanvas = {
      width: 800,
      height: 600,
      toDataURL: vi.fn().mockReturnValue('data:image/png;base64,mockImageData'),
      getContext: vi.fn().mockReturnValue({
        clearRect: vi.fn()
      })
    };
    
    // Mock document.createElement for canvas
    const originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      if (tagName === 'canvas') {
        return mockCanvas as unknown as HTMLCanvasElement;
      }
      return originalCreateElement(tagName);
    });
    
    // Create a proper mock element with required card structure
    mockElement = createValidCardElement('Test Bingo Card');
    
    // Mock getBoundingClientRect
    vi.spyOn(mockElement, 'getBoundingClientRect').mockReturnValue({
      width: 400,
      height: 300,
      top: 0,
      left: 0,
      bottom: 300,
      right: 400,
      x: 0,
      y: 0,
      toJSON: () => ({})
    });
    
    // Mock getComputedStyle
    vi.spyOn(window, 'getComputedStyle').mockReturnValue({
      display: 'block',
      visibility: 'visible',
      opacity: '1',
      fontFamily: 'Arial, sans-serif'
    } as CSSStyleDeclaration);
    
    // Add element to document body
    document.body.appendChild(mockElement);
    
    // Reset logging and set short timeouts for testing
    PDFExporter.setLogging(false);
  });

  afterEach(() => {
    // Clean up DOM
    if (mockElement.parentNode) {
      mockElement.parentNode.removeChild(mockElement);
    }
    
    // Force cleanup any pending canvases
    PDFExporter.forceCleanupAll();
    
    // Restore mocks
    vi.restoreAllMocks();
  });

  describe('generateFilename', () => {
    it('should generate filename from card title', () => {
      const filename = PDFExporter.generateFilename(mockCardData);
      expect(filename).toMatch(/^test-bingo-card-\d{4}-\d{2}-\d{2}\.pdf$/);
    });

    it('should generate filename for multiple cards', () => {
      const filename = PDFExporter.generateFilename(mockCardData, true);
      expect(filename).toMatch(/^test-bingo-card-variants-\d{4}-\d{2}-\d{2}\.pdf$/);
    });

    it('should sanitize special characters in title', () => {
      const cardWithSpecialChars: CardData = {
        ...mockCardData,
        title: 'Test@#$%^&*()Card!'
      };
      const filename = PDFExporter.generateFilename(cardWithSpecialChars);
      expect(filename).toMatch(/^testcard-\d{4}-\d{2}-\d{2}\.pdf$/);
    });

    it('should use default name for empty title', () => {
      const cardWithEmptyTitle: CardData = {
        ...mockCardData,
        title: ''
      };
      const filename = PDFExporter.generateFilename(cardWithEmptyTitle);
      expect(filename).toMatch(/^bingo-card-\d{4}-\d{2}-\d{2}\.pdf$/);
    });
  });

  describe('isSupported', () => {
    it('should return true when browser supports required features', () => {
      expect(PDFExporter.isSupported()).toBe(true);
    });

    it('should return false when canvas toDataURL is not available', () => {
      const originalToDataURL = HTMLCanvasElement.prototype.toDataURL;
      delete (HTMLCanvasElement.prototype as unknown).toDataURL;
      
      expect(PDFExporter.isSupported()).toBe(false);
      
      HTMLCanvasElement.prototype.toDataURL = originalToDataURL;
    });
  });

  describe('getBrowserSupportInfo', () => {
    it('should return detailed browser support information', () => {
      const info = PDFExporter.getBrowserSupportInfo();
      
      expect(info).toHaveProperty('isSupported');
      expect(info).toHaveProperty('features');
      expect(info).toHaveProperty('limitations');
      expect(typeof info.isSupported).toBe('boolean');
      expect(typeof info.features).toBe('object');
      expect(Array.isArray(info.limitations)).toBe(true);
    });
  });

  describe('setLogging', () => {
    it('should enable and disable logging', () => {
      PDFExporter.setLogging(true);
      const stats = PDFExporter.getExportStats();
      expect(stats.defaultOptions.enableLogging).toBe(true);
      
      PDFExporter.setLogging(false);
      const statsAfter = PDFExporter.getExportStats();
      expect(statsAfter.defaultOptions.enableLogging).toBe(false);
    });
  });

  describe('getExportStats', () => {
    it('should return current export statistics', () => {
      const stats = PDFExporter.getExportStats();
      
      expect(stats).toHaveProperty('canvasCleanupQueueSize');
      expect(stats).toHaveProperty('defaultOptions');
      expect(stats).toHaveProperty('browserSupport');
      expect(typeof stats.canvasCleanupQueueSize).toBe('number');
    });
  });

  describe('exportCard', () => {
    it('should handle null element', async () => {
      await expect(
        PDFExporter.exportCard(null as unknown, 'test.pdf', { maxRetries: 0 })
      ).rejects.toThrow('No card element provided for export');
    });

    it('should handle element not in DOM', async () => {
      const detachedElement = document.createElement('div');
      detachedElement.textContent = 'Test';
      
      vi.spyOn(detachedElement, 'getBoundingClientRect').mockReturnValue({
        width: 400,
        height: 300,
        top: 0,
        left: 0,
        bottom: 300,
        right: 400,
        x: 0,
        y: 0,
        toJSON: () => ({})
      });

      await expect(
        PDFExporter.exportCard(detachedElement, 'test.pdf', { maxRetries: 0 })
      ).rejects.toThrow('Failed to export PDF');
    });

    it('should handle element with zero dimensions', async () => {
      vi.spyOn(mockElement, 'getBoundingClientRect').mockReturnValue({
        width: 0,
        height: 0,
        top: 0,
        left: 0,
        bottom: 0,
        right: 0,
        x: 0,
        y: 0,
        toJSON: () => ({})
      });

      await expect(
        PDFExporter.exportCard(mockElement, 'test.pdf', { maxRetries: 0 })
      ).rejects.toThrow('Failed to export PDF');
    });

    it('should export single card successfully with proper validation', async () => {
      const { default: html2canvas } = await import('html2canvas');
      const { default: jsPDF } = await import('jspdf');
      
      const progressCallback = vi.fn();
      await PDFExporter.exportCard(mockElement, 'test.pdf', { maxRetries: 0 }, progressCallback);

      expect(html2canvas).toHaveBeenCalledWith(mockElement, expect.objectContaining({
        scale: 1.0,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false
      }));
      expect(jsPDF).toHaveBeenCalledWith({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      expect(progressCallback).toHaveBeenCalledWith(
        expect.objectContaining({ stage: 'complete' })
      );
    });

    it('should use custom options', async () => {
      const { default: html2canvas } = await import('html2canvas');
      const { default: jsPDF } = await import('jspdf');
      
      const options = {
        format: 'letter' as const,
        orientation: 'landscape' as const,
        quality: 2.0,
        enableLogging: true,
        maxRetries: 0
      };

      await PDFExporter.exportCard(mockElement, 'test.pdf', options);

      expect(html2canvas).toHaveBeenCalledWith(mockElement, expect.objectContaining({
        scale: 2.0,
        logging: true
      }));
      expect(jsPDF).toHaveBeenCalledWith({
        orientation: 'landscape',
        unit: 'mm',
        format: 'letter'
      });
    });
  });

  describe('exportMultipleCards', () => {
    let mockElements: HTMLElement[];

    beforeEach(() => {
      const secondElement = document.createElement('div');
      secondElement.id = 'test-card-2';
      secondElement.textContent = 'Test card 2 content';
      
      vi.spyOn(secondElement, 'getBoundingClientRect').mockReturnValue({
        width: 400,
        height: 300,
        top: 0,
        left: 0,
        bottom: 300,
        right: 400,
        x: 0,
        y: 0,
        toJSON: () => ({})
      });
      
      document.body.appendChild(secondElement);
      mockElements = [mockElement, secondElement];
    });

    it('should throw error for empty card array', async () => {
      await expect(
        PDFExporter.exportMultipleCards([], 'test.pdf', { maxRetries: 0 })
      ).rejects.toThrow('No cards provided for export');
    });

    it('should validate all elements before processing', async () => {
      const invalidElement = document.createElement('div');
      // Don't add to DOM to make it invalid
      
      vi.spyOn(invalidElement, 'getBoundingClientRect').mockReturnValue({
        width: 400,
        height: 300,
        top: 0,
        left: 0,
        bottom: 300,
        right: 400,
        x: 0,
        y: 0,
        toJSON: () => ({})
      });

      await expect(
        PDFExporter.exportMultipleCards([mockElement, invalidElement], 'test.pdf', { maxRetries: 0 })
      ).rejects.toThrow('Failed to export PDF');
    });

    it('should export multiple cards successfully', async () => {
      const { default: html2canvas } = await import('html2canvas');
      
      const progressCallback = vi.fn();
      await PDFExporter.exportMultipleCards(mockElements, 'test.pdf', { maxRetries: 0 }, progressCallback);

      expect(html2canvas).toHaveBeenCalledTimes(2);
      expect(progressCallback).toHaveBeenCalledWith(
        expect.objectContaining({ stage: 'complete' })
      );
    });
  });

  describe('forceCleanupAll', () => {
    it('should cleanup all pending canvases', () => {
      // This test verifies the cleanup functionality exists
      expect(() => PDFExporter.forceCleanupAll()).not.toThrow();
    });
  });

  describe('findCardElementsForExport', () => {
    beforeEach(() => {
      // Add data-card-element attribute to mock elements
      mockElement.setAttribute('data-card-element', '');
      
      // Add required card structure
      const title = document.createElement('h2');
      title.textContent = mockCardData.title;
      mockElement.appendChild(title);
      
      const grid = document.createElement('div');
      grid.className = 'grid';
      for (let i = 0; i < 25; i++) {
        const square = document.createElement('div');
        square.className = 'square';
        square.textContent = `Term ${i + 1}`;
        grid.appendChild(square);
      }
      mockElement.appendChild(grid);
    });

    it('should find and validate card elements in container', async () => {
      const elements = await PDFExporter.findCardElementsForExport(document, 1, [mockCardData]);
      
      expect(elements).toHaveLength(1);
      expect(elements[0]).toBe(mockElement);
    });

    it('should throw error when no valid elements found', async () => {
      // Remove the card element
      document.body.removeChild(mockElement);
      
      await expect(
        PDFExporter.findCardElementsForExport(document, 1, [mockCardData])
      ).rejects.toThrow('Unable to find valid card elements for export');
    }, 1000);

    it('should handle expected count mismatch', async () => {
      await expect(
        PDFExporter.findCardElementsForExport(document, 2, [mockCardData])
      ).rejects.toThrow('Expected 2 card elements but only found 1');
    }, 1000);
  });

  describe('exportCardsFromContainer', () => {
    beforeEach(() => {
      // Setup valid card element
      mockElement.setAttribute('data-card-element', '');
      
      const title = document.createElement('h2');
      title.textContent = mockCardData.title;
      mockElement.appendChild(title);
      
      const grid = document.createElement('div');
      grid.className = 'grid';
      for (let i = 0; i < 25; i++) {
        const square = document.createElement('div');
        square.className = 'square';
        square.textContent = `Term ${i + 1}`;
        grid.appendChild(square);
      }
      mockElement.appendChild(grid);
    });

    it('should export single card from container', async () => {
      const { default: html2canvas } = await import('html2canvas');
      
      await PDFExporter.exportCardsFromContainer(
        document,
        [mockCardData],
        'auto-detected.pdf',
        { maxRetries: 0 }
      );

      expect(html2canvas).toHaveBeenCalledWith(mockElement, expect.any(Object));
    });

    it('should export multiple cards from container', async () => {
      // Create second card element
      const secondElement = document.createElement('div');
      secondElement.setAttribute('data-card-element', '');
      
      const title2 = document.createElement('h2');
      title2.textContent = 'Second Card';
      secondElement.appendChild(title2);
      
      const grid2 = document.createElement('div');
      grid2.className = 'grid';
      for (let i = 0; i < 25; i++) {
        const square = document.createElement('div');
        square.className = 'square';
        square.textContent = `Term ${i + 1}`;
        grid2.appendChild(square);
      }
      secondElement.appendChild(grid2);
      
      vi.spyOn(secondElement, 'getBoundingClientRect').mockReturnValue({
        width: 400,
        height: 300,
        top: 0,
        left: 0,
        bottom: 300,
        right: 400,
        x: 0,
        y: 0,
        toJSON: () => ({})
      });
      
      document.body.appendChild(secondElement);

      const { default: html2canvas } = await import('html2canvas');
      
      const cardData2 = { ...mockCardData, id: 'test-id-2', title: 'Second Card' };
      
      await PDFExporter.exportCardsFromContainer(
        document,
        [mockCardData, cardData2],
        'multi-auto-detected.pdf',
        { maxRetries: 0 }
      );

      expect(html2canvas).toHaveBeenCalledTimes(2);
      
      document.body.removeChild(secondElement);
    });

    it('should throw error when no card data provided', async () => {
      await expect(
        PDFExporter.exportCardsFromContainer(document, [], 'test.pdf')
      ).rejects.toThrow('No card data provided for export');
    });

    it('should generate filename when not provided', async () => {
      const { default: jsPDF } = await import('jspdf');
      
      await PDFExporter.exportCardsFromContainer(
        document,
        [mockCardData],
        undefined,
        { maxRetries: 0 }
      );

      // Verify jsPDF was called (indicating successful export)
      expect(jsPDF).toHaveBeenCalled();
    });
  });

  describe('exportSingleCardFromContainer', () => {
    beforeEach(() => {
      // Setup valid card element
      mockElement.setAttribute('data-card-element', '');
      
      const title = document.createElement('h2');
      title.textContent = mockCardData.title;
      mockElement.appendChild(title);
      
      const grid = document.createElement('div');
      grid.className = 'grid';
      for (let i = 0; i < 25; i++) {
        const square = document.createElement('div');
        square.className = 'square';
        square.textContent = `Term ${i + 1}`;
        grid.appendChild(square);
      }
      mockElement.appendChild(grid);
    });

    it('should export single card using container detection', async () => {
      const { default: html2canvas } = await import('html2canvas');
      
      await PDFExporter.exportSingleCardFromContainer(
        document,
        mockCardData,
        'single-auto.pdf',
        { maxRetries: 0 }
      );

      expect(html2canvas).toHaveBeenCalledWith(mockElement, expect.any(Object));
    });
  });

  describe('getCardElementDebugInfo', () => {
    it('should return debug information about card elements', () => {
      mockElement.setAttribute('data-card-element', '');
      
      const debugInfo = PDFExporter.getCardElementDebugInfo(document);
      
      expect(debugInfo).toHaveProperty('detectorInfo');
      expect(debugInfo).toHaveProperty('exporterInfo');
      expect(debugInfo.detectorInfo).toHaveProperty('cardElements');
      expect(debugInfo.exporterInfo).toHaveProperty('canvasCleanupQueueSize');
    });
  });
});

// Helper function to create a valid card element for testing
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