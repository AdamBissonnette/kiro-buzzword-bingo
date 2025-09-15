import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import type { CardData } from '../types';
import { AppErrorHandler, RetryHandler } from './errorHandler';
import { CardElementDetector } from './cardElementDetector';

export interface PDFExportOptions {
  format?: 'a4' | 'letter';
  orientation?: 'portrait' | 'landscape';
  quality?: number;
  margin?: number;
  enableLogging?: boolean;
  maxRetries?: number;
  retryDelay?: number;
}

export interface PDFExportProgress {
  current: number;
  total: number;
  stage: 'validation' | 'rendering' | 'generating' | 'complete';
  message?: string;
}

export interface PDFExportController {
  cancel: () => void;
  isCancelled: () => boolean;
}

export class ExportCancellationError extends Error {
  constructor(message: string = 'Export was cancelled by user') {
    super(message);
    this.name = 'ExportCancellationError';
  }
}

export interface CanvasValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  dimensions: { width: number; height: number };
}

export class PDFExporter {
  private static readonly DEFAULT_OPTIONS: Required<PDFExportOptions> = {
    format: 'a4',
    orientation: 'portrait',
    quality: 1.0,
    margin: 20,
    enableLogging: false,
    maxRetries: 3,
    retryDelay: 1000
  };

  private static readonly CANVAS_CLEANUP_TIMEOUT = 5000; // 5 seconds
  private static readonly MAX_CANVAS_SIZE = 32767; // Browser limit for canvas dimensions
  private static readonly MIN_ELEMENT_SIZE = 10; // Minimum element size in pixels
  
  private static canvasCleanupQueue: HTMLCanvasElement[] = [];
  private static logger = {
    debug: (message: string, data?: unknown) => {
      if (PDFExporter.DEFAULT_OPTIONS.enableLogging) {
        console.debug(`[PDFExporter] ${message}`, data);
      }
    },
    info: (message: string, data?: unknown) => {
      if (PDFExporter.DEFAULT_OPTIONS.enableLogging) {
        console.info(`[PDFExporter] ${message}`, data);
      }
    },
    warn: (message: string, data?: unknown) => {
      console.warn(`[PDFExporter] ${message}`, data);
    },
    error: (message: string, data?: unknown) => {
      console.error(`[PDFExporter] ${message}`, data);
    }
  };

  /**
   * Validates a DOM element before PDF export (legacy method - use CardElementDetector for new code)
   */
  private static validateElement(element: HTMLElement): CanvasValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Check if element exists and is in DOM
    if (!element) {
      errors.push('Element is null or undefined');
      return { isValid: false, errors, warnings, dimensions: { width: 0, height: 0 } };
    }
    
    if (!document.body.contains(element)) {
      errors.push('Element is not attached to the document');
    }
    
    // Check element visibility and dimensions
    const rect = element.getBoundingClientRect();
    const computedStyle = window.getComputedStyle(element);
    
    if (rect.width < this.MIN_ELEMENT_SIZE || rect.height < this.MIN_ELEMENT_SIZE) {
      errors.push(`Element dimensions too small: ${rect.width}x${rect.height}px (minimum: ${this.MIN_ELEMENT_SIZE}px)`);
    }
    
    if (rect.width > this.MAX_CANVAS_SIZE || rect.height > this.MAX_CANVAS_SIZE) {
      errors.push(`Element dimensions exceed canvas limits: ${rect.width}x${rect.height}px (maximum: ${this.MAX_CANVAS_SIZE}px)`);
    }
    
    if (computedStyle.display === 'none') {
      errors.push('Element is hidden (display: none)');
    }
    
    if (computedStyle.visibility === 'hidden') {
      warnings.push('Element visibility is hidden');
    }
    
    if (parseFloat(computedStyle.opacity) === 0) {
      warnings.push('Element opacity is 0');
    }
    
    // Check for content
    const hasTextContent = element.textContent && element.textContent.trim().length > 0;
    const hasChildElements = element.children.length > 0;
    
    if (!hasTextContent && !hasChildElements) {
      warnings.push('Element appears to have no visible content');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      dimensions: { width: rect.width, height: rect.height }
    };
  }

  /**
   * Enhanced card element detection and validation using CardElementDetector
   */
  private static async validateCardElementForExport(element: HTMLElement): Promise<void> {
    const validation = CardElementDetector.validateCardElement(element);
    
    if (!validation.isValid) {
      throw new Error(`Card element validation failed: ${validation.errors.join(', ')}`);
    }

    if (validation.warnings.length > 0) {
      this.logger.warn('Card element validation warnings:', validation.warnings);
    }

    this.logger.debug('Card element validated successfully', {
      dimensions: validation.dimensions,
      contentInfo: validation.contentInfo
    });
  }

  /**
   * Finds and validates card elements for export
   */
  static async findCardElementsForExport(
    container: HTMLElement | Document = document,
    expectedCount?: number,
    cardData?: CardData[]
  ): Promise<HTMLElement[]> {
    this.logger.info('Finding card elements for export', { 
      expectedCount, 
      hasCardData: !!cardData,
      cardDataCount: cardData?.length 
    });

    try {
      // Use CardElementDetector to find and validate elements
      const elements = await CardElementDetector.getCardElementsForExport(container, {
        expectedCount,
        timeout: 10000, // 10 second timeout for export
        requireAllValid: true
      });

      this.logger.info(`Found ${elements.length} valid card elements for export`);

      // If card data is provided, validate that elements match the data
      if (cardData && cardData.length > 0) {
        const matchValidation = CardElementDetector.validateCardElementsMatchData(elements, cardData);
        
        if (!matchValidation.isValid) {
          this.logger.warn('Card elements do not match provided data:', matchValidation.errors);
          // Don't throw error for mismatches, just log warnings
        }

        if (matchValidation.warnings.length > 0) {
          this.logger.warn('Card element data match warnings:', matchValidation.warnings);
        }
      }

      return elements;
    } catch (error) {
      this.logger.error('Failed to find card elements for export:', error);
      throw new Error(
        `Unable to find valid card elements for export: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Validates a canvas element after html2canvas generation
   */
  private static validateCanvas(canvas: HTMLCanvasElement): CanvasValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    if (!canvas) {
      errors.push('Canvas is null or undefined');
      return { isValid: false, errors, warnings, dimensions: { width: 0, height: 0 } };
    }
    
    if (canvas.width === 0 || canvas.height === 0) {
      errors.push(`Canvas has invalid dimensions: ${canvas.width}x${canvas.height}`);
    }
    
    if (canvas.width > this.MAX_CANVAS_SIZE || canvas.height > this.MAX_CANVAS_SIZE) {
      errors.push(`Canvas dimensions exceed browser limits: ${canvas.width}x${canvas.height} (max: ${this.MAX_CANVAS_SIZE})`);
    }
    
    // Try to get image data to verify canvas content
    try {
      const imageData = canvas.toDataURL('image/png');
      if (!imageData || imageData === 'data:,' || imageData.length < 100) {
        errors.push('Canvas appears to be empty or corrupted');
      }
    } catch (error) {
      errors.push(`Cannot extract image data from canvas: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      dimensions: { width: canvas.width, height: canvas.height }
    };
  }

  /**
   * Schedules canvas cleanup to prevent memory leaks
   */
  private static scheduleCanvasCleanup(canvas: HTMLCanvasElement): void {
    this.canvasCleanupQueue.push(canvas);
    
    setTimeout(() => {
      const index = this.canvasCleanupQueue.indexOf(canvas);
      if (index > -1) {
        this.canvasCleanupQueue.splice(index, 1);
        this.cleanupCanvas(canvas);
      }
    }, this.CANVAS_CLEANUP_TIMEOUT);
  }

  /**
   * Cleans up canvas resources
   */
  private static cleanupCanvas(canvas: HTMLCanvasElement): void {
    try {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
      canvas.width = 0;
      canvas.height = 0;
      this.logger.debug('Canvas cleaned up successfully');
    } catch (error) {
      this.logger.warn('Failed to cleanup canvas:', error);
    }
  }

  /**
   * Creates canvas with enhanced error handling and validation
   */
  private static async createCanvasFromElement(
    element: HTMLElement,
    options: Required<PDFExportOptions>
  ): Promise<HTMLCanvasElement> {
    this.logger.debug('Starting canvas creation', { 
      elementTag: element.tagName,
      elementId: element.id,
      quality: options.quality 
    });

    // Validate element before processing
    const elementValidation = this.validateElement(element);
    if (!elementValidation.isValid) {
      throw new Error(`Element validation failed: ${elementValidation.errors.join(', ')}`);
    }

    if (elementValidation.warnings.length > 0) {
      this.logger.warn('Element validation warnings:', elementValidation.warnings);
    }

    const canvas = await html2canvas(element, {
      scale: options.quality,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: options.enableLogging,
      onclone: (clonedDoc) => {
        // Ensure fonts are loaded in cloned document
        const clonedElement = clonedDoc.querySelector('[data-card-element]');
        if (clonedElement) {
          (clonedElement as HTMLElement).style.fontFamily = 'Arial, sans-serif';
        }
      }
    });

    // Validate canvas after creation
    const canvasValidation = this.validateCanvas(canvas);
    if (!canvasValidation.isValid) {
      this.cleanupCanvas(canvas);
      throw new Error(`Canvas validation failed: ${canvasValidation.errors.join(', ')}`);
    }

    if (canvasValidation.warnings.length > 0) {
      this.logger.warn('Canvas validation warnings:', canvasValidation.warnings);
    }

    this.logger.info('Canvas created successfully', {
      dimensions: canvasValidation.dimensions,
      dataSize: canvas.toDataURL('image/png').length
    });

    // Schedule cleanup
    this.scheduleCanvasCleanup(canvas);

    return canvas;
  }

  /**
   * Export a single card to PDF
   */
  static async exportCard(
    cardElement: HTMLElement,
    filename: string,
    options: PDFExportOptions = {},
    onProgress?: (progress: PDFExportProgress) => void,
    controller?: PDFExportController
  ): Promise<void> {
    const opts = { ...this.DEFAULT_OPTIONS, ...options };
    
    this.logger.info('Starting single card PDF export', { filename, options: opts });
    
    if (!cardElement) {
      const error = AppErrorHandler.createError(
        'PDF_EXPORT_ERROR',
        'No card element provided for export',
        'The card content is not available. Please ensure the card is properly loaded.',
        false
      );
      this.logger.error('Export failed - no card element', error);
      throw error;
    }

    if (!this.isSupported()) {
      const error = AppErrorHandler.handleCompatibilityError('PDF export');
      this.logger.error('Export failed - browser not supported', error);
      throw error;
    }

    const exportOperation = async (): Promise<void> => {
      // Check for cancellation before starting
      if (controller?.isCancelled()) {
        throw new ExportCancellationError();
      }

      onProgress?.({ current: 1, total: 1, stage: 'validation', message: 'Validating card element...' });
      
      // Enhanced card element validation using CardElementDetector
      await this.validateCardElementForExport(cardElement);

      // Check for cancellation after validation
      if (controller?.isCancelled()) {
        throw new ExportCancellationError();
      }

      onProgress?.({ current: 1, total: 1, stage: 'rendering', message: 'Rendering card to canvas...' });
      
      // Create canvas with enhanced error handling
      const canvas = await this.createCanvasFromElement(cardElement, opts);

      // Check for cancellation after canvas creation
      if (controller?.isCancelled()) {
        this.cleanupCanvas(canvas);
        throw new ExportCancellationError();
      }
      
      try {
        // Check for cancellation before PDF generation
        if (controller?.isCancelled()) {
          throw new ExportCancellationError();
        }

        onProgress?.({ current: 1, total: 1, stage: 'generating', message: 'Generating PDF document...' });
        
        const imgData = canvas.toDataURL('image/png');
        if (!imgData || imgData === 'data:,' || imgData.length < 100) {
          throw new Error('Failed to convert canvas to image data - canvas appears empty');
        }

        // Check for cancellation before creating PDF
        if (controller?.isCancelled()) {
          throw new ExportCancellationError();
        }

        this.logger.debug('Canvas converted to image data', { 
          dataLength: imgData.length,
          canvasDimensions: { width: canvas.width, height: canvas.height }
        });

        const pdf = new jsPDF({
          orientation: opts.orientation,
          unit: 'mm',
          format: opts.format
        });

        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const availableWidth = pageWidth - (opts.margin * 2);
        const availableHeight = pageHeight - (opts.margin * 2);

        // Calculate dimensions to fit the card on the page while maintaining aspect ratio
        const imgWidth = canvas.width;
        const imgHeight = canvas.height;
        const aspectRatio = imgWidth / imgHeight;

        let finalWidth = availableWidth;
        let finalHeight = finalWidth / aspectRatio;

        // If height exceeds available space, scale by height instead
        if (finalHeight > availableHeight) {
          finalHeight = availableHeight;
          finalWidth = finalHeight * aspectRatio;
        }

        // Center the image on the page
        const x = (pageWidth - finalWidth) / 2;
        const y = (pageHeight - finalHeight) / 2;

        this.logger.debug('Adding image to PDF', {
          position: { x, y },
          dimensions: { width: finalWidth, height: finalHeight },
          pageSize: { width: pageWidth, height: pageHeight }
        });

        pdf.addImage(imgData, 'PNG', x, y, finalWidth, finalHeight);
        pdf.save(filename);
        
        onProgress?.({ current: 1, total: 1, stage: 'complete', message: 'PDF export completed successfully' });
        this.logger.info('Single card PDF export completed successfully', { filename });
        
      } finally {
        // Ensure canvas cleanup even if PDF generation fails
        this.cleanupCanvas(canvas);
      }
    };

    try {
      await RetryHandler.withRetry(
        exportOperation,
        opts.maxRetries,
        opts.retryDelay,
        (attempt, error) => {
          this.logger.warn(`PDF export attempt ${attempt} failed, retrying...`, { error: error.message });
          onProgress?.({ 
            current: 1, 
            total: 1, 
            stage: 'rendering', 
            message: `Retrying export (attempt ${attempt})...` 
          });
        }
      );
    } catch (error) {
      this.logger.error('PDF export failed after all retries', error);
      throw AppErrorHandler.handlePDFError(error);
    }
  }

  /**
   * Export multiple cards to a single PDF
   */
  static async exportMultipleCards(
    cardElements: HTMLElement[],
    filename: string,
    options: PDFExportOptions = {},
    onProgress?: (progress: PDFExportProgress) => void,
    controller?: PDFExportController
  ): Promise<void> {
    const opts = { ...this.DEFAULT_OPTIONS, ...options };
    
    this.logger.info('Starting multiple cards PDF export', { 
      filename, 
      cardCount: cardElements.length, 
      options: opts 
    });
    
    if (cardElements.length === 0) {
      const error = AppErrorHandler.createError(
        'PDF_EXPORT_ERROR',
        'No cards provided for export',
        'Please ensure at least one card is available before exporting.',
        false
      );
      this.logger.error('Export failed - no cards provided', error);
      throw error;
    }

    if (!this.isSupported()) {
      const error = AppErrorHandler.handleCompatibilityError('PDF export');
      this.logger.error('Export failed - browser not supported', error);
      throw error;
    }

    const exportOperation = async (): Promise<void> => {
      // Check for cancellation before starting
      if (controller?.isCancelled()) {
        throw new ExportCancellationError();
      }

      onProgress?.({ 
        current: 0, 
        total: cardElements.length, 
        stage: 'validation', 
        message: 'Validating card elements...' 
      });

      // Pre-validate all elements using enhanced validation
      for (let i = 0; i < cardElements.length; i++) {
        // Check for cancellation during validation
        if (controller?.isCancelled()) {
          throw new ExportCancellationError();
        }

        const element = cardElements[i];
        if (!element) {
          throw new Error(`Card element ${i + 1} is null or undefined`);
        }
        
        try {
          await this.validateCardElementForExport(element);
        } catch (error) {
          throw new Error(`Card ${i + 1} validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      const pdf = new jsPDF({
        orientation: opts.orientation,
        unit: 'mm',
        format: opts.format
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const availableWidth = pageWidth - (opts.margin * 2);
      const availableHeight = pageHeight - (opts.margin * 2);

      const canvases: HTMLCanvasElement[] = [];

      try {
        for (let i = 0; i < cardElements.length; i++) {
          // Check for cancellation before processing each card
          if (controller?.isCancelled()) {
            throw new ExportCancellationError();
          }

          onProgress?.({ 
            current: i + 1, 
            total: cardElements.length, 
            stage: 'rendering', 
            message: `Rendering card ${i + 1} of ${cardElements.length}...` 
          });

          if (i > 0) {
            pdf.addPage();
          }

          const cardElement = cardElements[i];
          this.logger.debug(`Processing card ${i + 1}`, { 
            elementTag: cardElement.tagName,
            elementId: cardElement.id 
          });

          // Create canvas with enhanced error handling
          const canvas = await this.createCanvasFromElement(cardElement, opts);
          canvases.push(canvas);

          // Check for cancellation after canvas creation
          if (controller?.isCancelled()) {
            throw new ExportCancellationError();
          }

          const imgData = canvas.toDataURL('image/png');
          if (!imgData || imgData === 'data:,' || imgData.length < 100) {
            throw new Error(`Failed to convert card ${i + 1} to image data - canvas appears empty`);
          }
          
          // Calculate dimensions to fit the card on the page
          const imgWidth = canvas.width;
          const imgHeight = canvas.height;
          const aspectRatio = imgWidth / imgHeight;

          let finalWidth = availableWidth;
          let finalHeight = finalWidth / aspectRatio;

          if (finalHeight > availableHeight) {
            finalHeight = availableHeight;
            finalWidth = finalHeight * aspectRatio;
          }

          // Center the image on the page
          const x = (pageWidth - finalWidth) / 2;
          const y = (pageHeight - finalHeight) / 2;

          this.logger.debug(`Adding card ${i + 1} to PDF`, {
            position: { x, y },
            dimensions: { width: finalWidth, height: finalHeight }
          });

          pdf.addImage(imgData, 'PNG', x, y, finalWidth, finalHeight);
        }

        // Check for cancellation before finalizing
        if (controller?.isCancelled()) {
          throw new ExportCancellationError();
        }

        onProgress?.({ 
          current: cardElements.length, 
          total: cardElements.length, 
          stage: 'generating', 
          message: 'Finalizing PDF document...' 
        });

        pdf.save(filename);
        
        onProgress?.({ 
          current: cardElements.length, 
          total: cardElements.length, 
          stage: 'complete', 
          message: 'PDF export completed successfully' 
        });
        
        this.logger.info('Multiple cards PDF export completed successfully', { 
          filename, 
          cardCount: cardElements.length 
        });

      } finally {
        // Cleanup all canvases
        canvases.forEach(canvas => this.cleanupCanvas(canvas));
      }
    };

    try {
      await RetryHandler.withRetry(
        exportOperation,
        opts.maxRetries,
        opts.retryDelay,
        (attempt, error) => {
          this.logger.warn(`Multiple cards PDF export attempt ${attempt} failed, retrying...`, { 
            error: error.message,
            cardCount: cardElements.length 
          });
          onProgress?.({ 
            current: 0, 
            total: cardElements.length, 
            stage: 'rendering', 
            message: `Retrying export (attempt ${attempt})...` 
          });
        }
      );
    } catch (error) {
      this.logger.error('Multiple cards PDF export failed after all retries', error);
      throw AppErrorHandler.handlePDFError(error);
    }
  }

  /**
   * Generate a filename based on card data
   */
  static generateFilename(cardData: CardData, isMultiple: boolean = false): string {
    const sanitizedTitle = cardData.title
      .replace(/[^a-zA-Z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .toLowerCase();
    
    const timestamp = new Date().toISOString().slice(0, 10);
    const suffix = isMultiple ? '-variants' : '';
    
    return `${sanitizedTitle || 'bingo-card'}${suffix}-${timestamp}.pdf`;
  }

  /**
   * Validate if PDF export is supported in the current browser
   */
  static isSupported(): boolean {
    try {
      const hasWindow = typeof window !== 'undefined';
      const hasDocument = typeof document !== 'undefined';
      const hasCanvas = 'toDataURL' in HTMLCanvasElement.prototype;
      const hasCreateElement = document && typeof document.createElement === 'function';
      
      if (!hasWindow || !hasDocument || !hasCanvas || !hasCreateElement) {
        return false;
      }

      // Test canvas creation and basic functionality
      const testCanvas = document.createElement('canvas');
      testCanvas.width = 1;
      testCanvas.height = 1;
      const ctx = testCanvas.getContext('2d');
      
      if (!ctx) {
        return false;
      }

      // Test toDataURL functionality
      const dataUrl = testCanvas.toDataURL('image/png');
      return Boolean(dataUrl && dataUrl.startsWith('data:image/png'));
      
    } catch (error) {
      this.logger.warn('Browser compatibility check failed:', error);
      return false;
    }
  }

  /**
   * Get detailed browser support information for debugging
   */
  static getBrowserSupportInfo(): {
    isSupported: boolean;
    features: Record<string, boolean>;
    limitations: string[];
  } {
    const features = {
      hasWindow: typeof window !== 'undefined',
      hasDocument: typeof document !== 'undefined',
      hasCanvas: typeof HTMLCanvasElement !== 'undefined',
      hasCanvasToDataURL: 'toDataURL' in HTMLCanvasElement.prototype,
      hasCreateElement: document && typeof document.createElement === 'function',
      hasGetContext: false,
      canCreateCanvas: false
    };

    const limitations: string[] = [];

    try {
      if (features.hasCreateElement) {
        const testCanvas = document.createElement('canvas');
        features.canCreateCanvas = true;
        
        const ctx = testCanvas.getContext('2d');
        features.hasGetContext = !!ctx;
        
        if (!ctx) {
          limitations.push('Cannot get 2D rendering context');
        }
      }
    } catch (error) {
      limitations.push(`Canvas creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Check for known limitations
    if (navigator.userAgent.includes('jsdom')) {
      limitations.push('Running in jsdom environment (testing)');
    }

    const isSupported = Object.values(features).every(Boolean) && limitations.length === 0;

    return { isSupported, features, limitations };
  }

  /**
   * Enable or disable detailed logging
   */
  static setLogging(enabled: boolean): void {
    this.DEFAULT_OPTIONS.enableLogging = enabled;
    this.logger.info(`Logging ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Get current export statistics for debugging
   */
  static getExportStats(): {
    canvasCleanupQueueSize: number;
    defaultOptions: Required<PDFExportOptions>;
    browserSupport: ReturnType<typeof PDFExporter.getBrowserSupportInfo>;
  } {
    return {
      canvasCleanupQueueSize: this.canvasCleanupQueue.length,
      defaultOptions: { ...this.DEFAULT_OPTIONS },
      browserSupport: this.getBrowserSupportInfo()
    };
  }

  /**
   * Force cleanup of all pending canvases (for testing/debugging)
   */
  static forceCleanupAll(): void {
    this.logger.info(`Force cleaning up ${this.canvasCleanupQueue.length} canvases`);
    
    while (this.canvasCleanupQueue.length > 0) {
      const canvas = this.canvasCleanupQueue.pop();
      if (canvas) {
        this.cleanupCanvas(canvas);
      }
    }
  }

  /**
   * Export cards with automatic element detection from container
   */
  static async exportCardsFromContainer(
    container: HTMLElement | Document,
    cardData: CardData[],
    filename?: string,
    options: PDFExportOptions = {},
    onProgress?: (progress: PDFExportProgress) => void,
    controller?: PDFExportController
  ): Promise<void> {
    this.logger.info('Starting export with automatic card element detection', {
      expectedCards: cardData.length,
      hasContainer: !!container
    });

    if (!this.isSupported()) {
      throw AppErrorHandler.handleCompatibilityError('PDF export');
    }

    if (cardData.length === 0) {
      throw AppErrorHandler.createError(
        'PDF_EXPORT_ERROR',
        'No card data provided for export',
        'Please ensure at least one card is created before exporting.',
        false
      );
    }

    try {
      // Find and validate card elements
      const cardElements = await this.findCardElementsForExport(
        container,
        cardData.length,
        cardData
      );

      // Generate filename if not provided
      const exportFilename = filename || this.generateFilename(cardData[0], cardData.length > 1);

      // Export based on number of cards
      if (cardElements.length === 1) {
        await this.exportCard(cardElements[0], exportFilename, options, onProgress, controller);
      } else {
        await this.exportMultipleCards(cardElements, exportFilename, options, onProgress, controller);
      }

      this.logger.info('Export completed successfully', {
        filename: exportFilename,
        cardCount: cardElements.length
      });

    } catch (error) {
      this.logger.error('Export with automatic detection failed:', error);
      throw AppErrorHandler.handlePDFError(error);
    }
  }

  /**
   * Export single card with automatic element detection
   */
  static async exportSingleCardFromContainer(
    container: HTMLElement | Document,
    cardData: CardData,
    filename?: string,
    options: PDFExportOptions = {},
    onProgress?: (progress: PDFExportProgress) => void,
    controller?: PDFExportController
  ): Promise<void> {
    return this.exportCardsFromContainer(
      container,
      [cardData],
      filename,
      options,
      onProgress,
      controller
    );
  }

  /**
   * Create a cancellation controller for export operations
   */
  static createExportController(): PDFExportController {
    let cancelled = false;

    return {
      cancel: () => {
        cancelled = true;
      },
      isCancelled: () => cancelled
    };
  }

  /**
   * Get debug information about card elements in container
   */
  static getCardElementDebugInfo(container: HTMLElement | Document = document): {
    detectorInfo: ReturnType<typeof CardElementDetector.getDebugInfo>;
    exporterInfo: ReturnType<typeof PDFExporter.getExportStats>;
  } {
    return {
      detectorInfo: CardElementDetector.getDebugInfo(container),
      exporterInfo: this.getExportStats()
    };
  }
}