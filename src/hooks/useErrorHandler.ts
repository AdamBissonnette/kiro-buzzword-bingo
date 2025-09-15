import { useState, useCallback } from 'react';
import type { AppError, ErrorState } from '../types';
import { AppErrorHandler, RetryHandler } from '../utils/errorHandler';

interface UseErrorHandlerOptions {
  maxRetries?: number;
  retryDelay?: number;
  onError?: (error: AppError) => void;
}

export function useErrorHandler(options: UseErrorHandlerOptions = {}) {
  const { maxRetries = 3, retryDelay = 1000, onError } = options;
  
  const [errorState, setErrorState] = useState<ErrorState>({
    error: null,
    isLoading: false,
    retryCount: 0
  });

  const clearError = useCallback(() => {
    setErrorState(prev => ({
      ...prev,
      error: null,
      retryCount: 0
    }));
  }, []);

  const setError = useCallback((error: AppError) => {
    setErrorState(prev => ({
      ...prev,
      error,
      isLoading: false
    }));
    onError?.(error);
  }, [onError]);

  const setLoading = useCallback((isLoading: boolean) => {
    setErrorState(prev => ({
      ...prev,
      isLoading
    }));
  }, []);

  const executeWithErrorHandling = useCallback(async <T>(
    operation: () => Promise<T>,
    errorHandler: (error: unknown) => AppError = AppErrorHandler.handleUnknownError
  ): Promise<T | null> => {
    clearError();
    setLoading(true);

    try {
      const result = await operation();
      setLoading(false);
      return result;
    } catch (error) {
      const appError = errorHandler(error);
      setError(appError);
      return null;
    }
  }, [clearError, setError, setLoading]);

  const executeWithRetry = useCallback(async <T>(
    operation: () => Promise<T>,
    errorHandler: (error: unknown) => AppError = AppErrorHandler.handleUnknownError
  ): Promise<T | null> => {
    clearError();
    setLoading(true);

    try {
      const result = await RetryHandler.withRetry(
        operation,
        maxRetries,
        retryDelay,
        (attempt, error) => {
          setErrorState(prev => ({
            ...prev,
            retryCount: attempt
          }));
          console.log(`Retry attempt ${attempt} after error:`, error.message);
        }
      );
      
      setLoading(false);
      return result;
    } catch (error) {
      const appError = errorHandler(error);
      setError(appError);
      return null;
    }
  }, [clearError, setError, setLoading, maxRetries, retryDelay]);

  const retry = useCallback(async <T>(
    operation: () => Promise<T>,
    errorHandler: (error: unknown) => AppError = AppErrorHandler.handleUnknownError
  ): Promise<T | null> => {
    if (!errorState.error?.retryable) {
      return null;
    }

    return executeWithErrorHandling(operation, errorHandler);
  }, [errorState.error, executeWithErrorHandling]);

  return {
    error: errorState.error,
    isLoading: errorState.isLoading,
    retryCount: errorState.retryCount,
    clearError,
    setError,
    setLoading,
    executeWithErrorHandling,
    executeWithRetry,
    retry,
    canRetry: errorState.error?.retryable === true
  };
}

export default useErrorHandler;