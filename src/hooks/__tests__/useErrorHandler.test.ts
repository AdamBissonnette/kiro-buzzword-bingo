import { renderHook, act } from '@testing-library/react';
import { vi } from 'vitest';
import { useErrorHandler } from '../useErrorHandler';
import { AppErrorHandler } from '../../utils/errorHandler';
import { expect } from 'chai';
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
import { expect } from 'chai';
import { it } from 'node:test';
import { expect } from 'chai';
import { it } from 'node:test';
import { expect } from 'chai';
import { expect } from 'chai';
import { expect } from 'chai';
import { expect } from 'chai';
import { it } from 'node:test';
import { expect } from 'chai';
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
import { expect } from 'chai';
import { expect } from 'chai';
import { it } from 'node:test';
import { afterEach } from 'node:test';
import { beforeEach } from 'node:test';
import { describe } from 'node:test';

describe('useErrorHandler', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('initializes with no error and not loading', () => {
    const { result } = renderHook(() => useErrorHandler());

    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.retryCount).toBe(0);
    expect(result.current.canRetry).toBe(false);
  });

  it('clears error when clearError is called', () => {
    const { result } = renderHook(() => useErrorHandler());

    const testError = AppErrorHandler.createError('PDF_EXPORT_ERROR', 'Test error');
    
    act(() => {
      result.current.setError(testError);
    });

    expect(result.current.error).toBe(testError);

    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBeNull();
    expect(result.current.retryCount).toBe(0);
  });

  it('sets loading state', () => {
    const { result } = renderHook(() => useErrorHandler());

    act(() => {
      result.current.setLoading(true);
    });

    expect(result.current.isLoading).toBe(true);

    act(() => {
      result.current.setLoading(false);
    });

    expect(result.current.isLoading).toBe(false);
  });

  it('executes operation successfully', async () => {
    const { result } = renderHook(() => useErrorHandler());
    const operation = vi.fn().mockResolvedValue('success');

    let operationResult: string | null = null;

    await act(async () => {
      operationResult = await result.current.executeWithErrorHandling(operation);
    });

    expect(operationResult).toBe('success');
    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(operation).toHaveBeenCalledTimes(1);
  });

  it('handles operation failure', async () => {
    const { result } = renderHook(() => useErrorHandler());
    const operation = vi.fn().mockRejectedValue(new Error('Test error'));

    let operationResult: string | null = 'initial';

    await act(async () => {
      operationResult = await result.current.executeWithErrorHandling(operation);
    });

    expect(operationResult).toBeNull();
    expect(result.current.error).toBeTruthy();
    expect(result.current.error?.code).toBe('UNKNOWN_ERROR');
    expect(result.current.isLoading).toBe(false);
  });

  it('uses custom error handler', async () => {
    const { result } = renderHook(() => useErrorHandler());
    const operation = vi.fn().mockRejectedValue(new Error('PDF error'));
    const customErrorHandler = AppErrorHandler.handlePDFError;

    await act(async () => {
      await result.current.executeWithErrorHandling(operation, customErrorHandler);
    });

    expect(result.current.error?.code).toBe('PDF_EXPORT_ERROR');
  });

  it('executes with retry on success', async () => {
    const { result } = renderHook(() => useErrorHandler({ maxRetries: 2, retryDelay: 100 }));
    const operation = vi.fn().mockResolvedValue('success');

    let operationResult: string | null = null;

    await act(async () => {
      operationResult = await result.current.executeWithRetry(operation);
    });

    expect(operationResult).toBe('success');
    expect(result.current.error).toBeNull();
    expect(result.current.retryCount).toBe(0);
    expect(operation).toHaveBeenCalledTimes(1);
  });

  it('executes with retry and eventually succeeds', async () => {
    const { result } = renderHook(() => useErrorHandler({ maxRetries: 2, retryDelay: 100 }));
    const operation = vi.fn()
      .mockRejectedValueOnce(new Error('fail 1'))
      .mockRejectedValueOnce(new Error('fail 2'))
      .mockResolvedValue('success');

    let operationResult: string | null = null;

    await act(async () => {
      const promise = result.current.executeWithRetry(operation);
      vi.runAllTimers(); // Fast-forward through retry delays
      operationResult = await promise;
    });

    expect(operationResult).toBe('success');
    expect(result.current.error).toBeNull();
    expect(operation).toHaveBeenCalledTimes(3);
  });

  it('executes with retry and fails after max attempts', async () => {
    const { result } = renderHook(() => useErrorHandler({ maxRetries: 1, retryDelay: 100 }));
    const operation = vi.fn().mockRejectedValue(new Error('persistent error'));

    let operationResult: string | null = 'initial';

    await act(async () => {
      const promise = result.current.executeWithRetry(operation);
      vi.runAllTimers(); // Fast-forward through retry delays
      operationResult = await promise;
    });

    expect(operationResult).toBeNull();
    expect(result.current.error).toBeTruthy();
    expect(operation).toHaveBeenCalledTimes(2); // Initial + 1 retry
  });

  it('indicates when error is retryable', () => {
    const { result } = renderHook(() => useErrorHandler());

    const retryableError = AppErrorHandler.createError('PDF_EXPORT_ERROR', 'Test', undefined, true);
    const nonRetryableError = AppErrorHandler.createError('VALIDATION_ERROR', 'Test', undefined, false);

    act(() => {
      result.current.setError(retryableError);
    });

    expect(result.current.canRetry).toBe(true);

    act(() => {
      result.current.setError(nonRetryableError);
    });

    expect(result.current.canRetry).toBe(false);
  });

  it('calls onError callback when error occurs', async () => {
    const onError = vi.fn();
    const { result } = renderHook(() => useErrorHandler({ onError }));
    const operation = vi.fn().mockRejectedValue(new Error('Test error'));

    await act(async () => {
      await result.current.executeWithErrorHandling(operation);
    });

    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 'UNKNOWN_ERROR',
        message: expect.any(String)
      })
    );
  });

  it('retry function works only for retryable errors', async () => {
    const { result } = renderHook(() => useErrorHandler());
    const operation = vi.fn().mockResolvedValue('success');

    // Set non-retryable error
    const nonRetryableError = AppErrorHandler.createError('VALIDATION_ERROR', 'Test', undefined, false);
    act(() => {
      result.current.setError(nonRetryableError);
    });

    const retryResult = await act(async () => {
      return await result.current.retry(operation);
    });

    expect(retryResult).toBeNull();
    expect(operation).not.toHaveBeenCalled();

    // Set retryable error
    const retryableError = AppErrorHandler.createError('PDF_EXPORT_ERROR', 'Test', undefined, true);
    act(() => {
      result.current.setError(retryableError);
    });

    const retryResult2 = await act(async () => {
      return await result.current.retry(operation);
    });

    expect(retryResult2).toBe('success');
    expect(operation).toHaveBeenCalledTimes(1);
  });
});