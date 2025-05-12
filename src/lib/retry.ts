
import { useState, useCallback } from 'react';

interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  backoffFactor?: number;
  onRetry?: (attempt: number) => void;
}

/**
 * Custom hook for handling retries with exponential backoff
 * @param options Retry configuration options
 * @returns Object containing retry function and state
 */
export function useRetry(options: RetryOptions = {}) {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    backoffFactor = 2,
    onRetry
  } = options;
  
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const [lastError, setLastError] = useState<Error | null>(null);
  
  const reset = useCallback(() => {
    setRetryCount(0);
    setIsRetrying(false);
    setLastError(null);
  }, []);
  
  const retry = useCallback(async <T>(fn: () => Promise<T> | T): Promise<T | null> => {
    // Don't retry if we've hit the maximum
    if (retryCount >= maxRetries) {
      console.warn(`Maximum retries (${maxRetries}) reached`);
      return null;
    }
    
    try {
      setIsRetrying(true);
      
      // Calculate delay with exponential backoff
      const delay = baseDelay * Math.pow(backoffFactor, retryCount);
      
      // Wait before retrying
      if (retryCount > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      
      // Call the function
      const result = await fn();
      
      // Success, reset retry count
      reset();
      return result;
    } catch (error) {
      // Increment retry count
      const newRetryCount = retryCount + 1;
      setRetryCount(newRetryCount);
      setLastError(error as Error);
      
      // Call onRetry callback
      if (onRetry) {
        onRetry(newRetryCount);
      }
      
      // If we haven't hit max retries yet, retry again
      if (newRetryCount < maxRetries) {
        console.log(`Retry attempt ${newRetryCount}/${maxRetries}`);
        return retry(fn);
      } else {
        setIsRetrying(false);
        console.error('All retry attempts failed', error);
        return null;
      }
    }
  }, [retryCount, maxRetries, baseDelay, backoffFactor, onRetry, reset]);
  
  return {
    retry,
    isRetrying,
    retryCount,
    lastError,
    reset
  };
}
