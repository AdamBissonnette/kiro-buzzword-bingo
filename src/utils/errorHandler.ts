import type { AppError, ErrorType } from '../types';

export class AppErrorHandler {
  /**
   * Creates a standardized error object
   */
  static createError(
    type: ErrorType,
    message: string,
    details?: string,
    retryable: boolean = false
  ): AppError {
    return {
      code: type,
      message,
      details,
      retryable
    };
  }

  /**
   * Handles PDF export errors with user-friendly messages
   */
  static handlePDFError(error: unknown): AppError {
    console.error('PDF Export Error:', error);
    
    if (error instanceof Error) {
      // Check for specific error types
      if (error.message.includes('canvas')) {
        return this.createError(
          'PDF_EXPORT_ERROR',
          'Failed to capture card image for PDF export',
          'The card content could not be converted to an image. This may be due to browser security restrictions or missing content.',
          true
        );
      }
      
      if (error.message.includes('jsPDF')) {
        return this.createError(
          'PDF_EXPORT_ERROR',
          'Failed to generate PDF document',
          'There was an issue creating the PDF file. Please check your browser compatibility.',
          true
        );
      }

      if (error.message.includes('memory') || error.message.includes('quota')) {
        return this.createError(
          'PDF_EXPORT_ERROR',
          'Insufficient memory to generate PDF',
          'The PDF is too large to generate. Try reducing the quality or number of cards.',
          false
        );
      }
    }

    return this.createError(
      'PDF_EXPORT_ERROR',
      'Failed to export PDF',
      'An unexpected error occurred during PDF generation. Please try again.',
      true
    );
  }

  /**
   * Handles URL parsing errors with user-friendly messages
   */
  static handleURLError(error: unknown): AppError {
    console.error('URL Parsing Error:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('Invalid card data structure')) {
        return this.createError(
          'URL_PARSING_ERROR',
          'Invalid shared card link',
          'The shared link appears to be corrupted or incomplete. Please check the URL or request a new share link.',
          false
        );
      }

      if (error.message.includes('decode') || error.message.includes('base64')) {
        return this.createError(
          'URL_PARSING_ERROR',
          'Unable to decode shared card data',
          'The shared link format is not recognized. This may be from an older version or corrupted link.',
          false
        );
      }
    }

    return this.createError(
      'URL_PARSING_ERROR',
      'Failed to load shared card',
      'The shared card link could not be processed. Please verify the link is complete and try again.',
      false
    );
  }

  /**
   * Handles validation errors
   */
  static handleValidationError(field: string, message: string): AppError {
    return this.createError(
      'VALIDATION_ERROR',
      `${field}: ${message}`,
      undefined,
      false
    );
  }

  /**
   * Handles network errors
   */
  static handleNetworkError(error: unknown): AppError {
    console.error('Network Error:', error);
    
    return this.createError(
      'NETWORK_ERROR',
      'Network connection failed',
      'Please check your internet connection and try again.',
      true
    );
  }

  /**
   * Handles browser compatibility errors
   */
  static handleCompatibilityError(feature: string): AppError {
    return this.createError(
      'BROWSER_COMPATIBILITY_ERROR',
      `${feature} is not supported`,
      'This feature requires a modern browser. Please update your browser or try a different one.',
      false
    );
  }

  /**
   * Handles unknown errors with fallback messaging
   */
  static handleUnknownError(error: unknown): AppError {
    console.error('Unknown Error:', error);
    
    const message = 'An unexpected error occurred';
    let details = 'Please try again. If the problem persists, try refreshing the page.';
    
    if (error instanceof Error) {
      details = `Error: ${error.message}`;
    }

    return this.createError(
      'UNKNOWN_ERROR',
      message,
      details,
      true
    );
  }

  /**
   * Determines if an error should allow retry
   */
  static isRetryable(error: AppError): boolean {
    return error.retryable === true;
  }

  /**
   * Gets user-friendly error message for display
   */
  static getDisplayMessage(error: AppError): string {
    return error.message;
  }

  /**
   * Gets detailed error information for debugging
   */
  static getErrorDetails(error: AppError): string | undefined {
    return error.details;
  }
}

/**
 * Retry utility for failed operations
 */
export class RetryHandler {
  static async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000,
    onRetry?: (attempt: number, error: Error) => void
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (attempt === maxRetries) {
          throw lastError;
        }
        
        onRetry?.(attempt + 1, lastError);
        
        // Exponential backoff
        const waitTime = delay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
    
    throw lastError!;
  }
}

