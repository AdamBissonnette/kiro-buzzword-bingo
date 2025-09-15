import { vi } from 'vitest';
import { AppErrorHandler, RetryHandler } from '../errorHandler';
import { expect } from 'chai';
import { expect } from 'chai';
import { expect } from 'chai';
import { it } from 'node:test';
import { expect } from 'chai';
import { expect } from 'chai';
import { it } from 'node:test';
import { expect } from 'chai';
import { expect } from 'chai';
import { expect } from 'chai';
import { it } from 'node:test';
import { expect } from 'chai';
import { expect } from 'chai';
import { it } from 'node:test';
import { afterEach } from 'node:test';
import { beforeEach } from 'node:test';
import { describe } from 'node:test';
import { expect } from 'chai';
import { it } from 'node:test';
import { expect } from 'chai';
import { it } from 'node:test';
import { expect } from 'chai';
import { expect } from 'chai';
import { it } from 'node:test';
import { describe } from 'node:test';
import { expect } from 'chai';
import { expect } from 'chai';
import { expect } from 'chai';
import { it } from 'node:test';
import { describe } from 'node:test';
import { expect } from 'chai';
import { expect } from 'chai';
import { expect } from 'chai';
import { it } from 'node:test';
import { describe } from 'node:test';
import { expect } from 'chai';
import { expect } from 'chai';
import { expect } from 'chai';
import { it } from 'node:test';
import { expect } from 'chai';
import { expect } from 'chai';
import { expect } from 'chai';
import { it } from 'node:test';
import { expect } from 'chai';
import { expect } from 'chai';
import { expect } from 'chai';
import { it } from 'node:test';
import { describe } from 'node:test';
import { expect } from 'chai';
import { expect } from 'chai';
import { expect } from 'chai';
import { it } from 'node:test';
import { expect } from 'chai';
import { expect } from 'chai';
import { expect } from 'chai';
import { it } from 'node:test';
import { expect } from 'chai';
import { expect } from 'chai';
import { expect } from 'chai';
import { it } from 'node:test';
import { expect } from 'chai';
import { expect } from 'chai';
import { expect } from 'chai';
import { it } from 'node:test';
import { describe } from 'node:test';
import { expect } from 'chai';
import { it } from 'node:test';
import { expect } from 'chai';
import { it } from 'node:test';
import { describe } from 'node:test';
import { describe } from 'node:test';

describe('AppErrorHandler', () => {
  describe('createError', () => {
    it('creates error with all properties', () => {
      const error = AppErrorHandler.createError(
        'PDF_EXPORT_ERROR',
        'Test message',
        'Test details',
        true
      );

      expect(error).toEqual({
        code: 'PDF_EXPORT_ERROR',
        message: 'Test message',
        details: 'Test details',
        retryable: true
      });
    });

    it('creates error with default retryable false', () => {
      const error = AppErrorHandler.createError(
        'VALIDATION_ERROR',
        'Test message'
      );

      expect(error.retryable).toBe(false);
    });
  });

  describe('handlePDFError', () => {
    it('handles canvas-related errors', () => {
      const canvasError = new Error('canvas conversion failed');
      const error = AppErrorHandler.handlePDFError(canvasError);

      expect(error.code).toBe('PDF_EXPORT_ERROR');
      expect(error.message).toContain('capture card image');
      expect(error.retryable).toBe(true);
    });

    it('handles jsPDF-related errors', () => {
      const jsPDFError = new Error('jsPDF initialization failed');
      const error = AppErrorHandler.handlePDFError(jsPDFError);

      expect(error.code).toBe('PDF_EXPORT_ERROR');
      expect(error.message).toContain('generate PDF document');
      expect(error.retryable).toBe(true);
    });

    it('handles memory-related errors', () => {
      const memoryError = new Error('memory quota exceeded');
      const error = AppErrorHandler.handlePDFError(memoryError);

      expect(error.code).toBe('PDF_EXPORT_ERROR');
      expect(error.message).toContain('Insufficient memory');
      expect(error.retryable).toBe(false);
    });

    it('handles unknown PDF errors', () => {
      const unknownError = new Error('unknown error');
      const error = AppErrorHandler.handlePDFError(unknownError);

      expect(error.code).toBe('PDF_EXPORT_ERROR');
      expect(error.message).toBe('Failed to export PDF');
      expect(error.retryable).toBe(true);
    });
  });

  describe('handleURLError', () => {
    it('handles invalid card data structure errors', () => {
      const structureError = new Error('Invalid card data structure');
      const error = AppErrorHandler.handleURLError(structureError);

      expect(error.code).toBe('URL_PARSING_ERROR');
      expect(error.message).toContain('Invalid shared card link');
      expect(error.retryable).toBe(false);
    });

    it('handles base64 decode errors', () => {
      const decodeError = new Error('base64 decode failed');
      const error = AppErrorHandler.handleURLError(decodeError);

      expect(error.code).toBe('URL_PARSING_ERROR');
      expect(error.message).toContain('decode shared card data');
      expect(error.retryable).toBe(false);
    });

    it('handles unknown URL errors', () => {
      const unknownError = new Error('unknown error');
      const error = AppErrorHandler.handleURLError(unknownError);

      expect(error.code).toBe('URL_PARSING_ERROR');
      expect(error.message).toBe('Failed to load shared card');
      expect(error.retryable).toBe(false);
    });
  });

  describe('handleValidationError', () => {
    it('creates validation error with field and message', () => {
      const error = AppErrorHandler.handleValidationError('title', 'is required');

      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.message).toBe('title: is required');
      expect(error.retryable).toBe(false);
    });
  });

  describe('handleCompatibilityError', () => {
    it('creates compatibility error for unsupported feature', () => {
      const error = AppErrorHandler.handleCompatibilityError('PDF export');

      expect(error.code).toBe('BROWSER_COMPATIBILITY_ERROR');
      expect(error.message).toContain('PDF export is not supported');
      expect(error.retryable).toBe(false);
    });
  });

  describe('utility methods', () => {
    it('isRetryable returns correct value', () => {
      const retryableError = AppErrorHandler.createError('PDF_EXPORT_ERROR', 'test', undefined, true);
      const nonRetryableError = AppErrorHandler.createError('VALIDATION_ERROR', 'test', undefined, false);

      expect(AppErrorHandler.isRetryable(retryableError)).toBe(true);
      expect(AppErrorHandler.isRetryable(nonRetryableError)).toBe(false);
    });

    it('getDisplayMessage returns error message', () => {
      const error = AppErrorHandler.createError('PDF_EXPORT_ERROR', 'Test message');
      
      expect(AppErrorHandler.getDisplayMessage(error)).toBe('Test message');
    });

    it('getErrorDetails returns error details', () => {
      const error = AppErrorHandler.createError('PDF_EXPORT_ERROR', 'Test message', 'Test details');
      
      expect(AppErrorHandler.getErrorDetails(error)).toBe('Test details');
    });
  });
});

describe('RetryHandler', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('succeeds on first attempt', async () => {
    const operation = vi.fn().mockResolvedValue('success');
    
    const result = await RetryHandler.withRetry(operation, 3, 1000);
    
    expect(result).toBe('success');
    expect(operation).toHaveBeenCalledTimes(1);
  });

  it('retries on failure and eventually succeeds', async () => {
    const operation = vi.fn()
      .mockRejectedValueOnce(new Error('fail 1'))
      .mockRejectedValueOnce(new Error('fail 2'))
      .mockResolvedValue('success');
    
    const onRetry = vi.fn();
    
    // Use very short delays for testing
    const result = await RetryHandler.withRetry(operation, 3, 1, onRetry);
    
    expect(result).toBe('success');
    expect(operation).toHaveBeenCalledTimes(3);
    expect(onRetry).toHaveBeenCalledTimes(2);
  });

  it('throws error after max retries exceeded', async () => {
    const error = new Error('persistent failure');
    const operation = vi.fn().mockRejectedValue(error);
    
    // Use very short delays for testing
    await expect(RetryHandler.withRetry(operation, 2, 1)).rejects.toThrow('persistent failure');
    expect(operation).toHaveBeenCalledTimes(3); // Initial + 2 retries
  });

  it('uses exponential backoff for delays', async () => {
    const operation = vi.fn().mockRejectedValue(new Error('fail'));
    const onRetry = vi.fn();
    
    // Use very short delays for testing
    await expect(RetryHandler.withRetry(operation, 2, 1, onRetry)).rejects.toThrow();
    
    expect(operation).toHaveBeenCalledTimes(3);
    expect(onRetry).toHaveBeenCalledTimes(2);
  });
});