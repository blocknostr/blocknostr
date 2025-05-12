
import { useState, useCallback } from 'react';

interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  factor?: number;
}

export function useRetry({
  maxRetries = 3,
  baseDelay = 1000,
  factor = 2
}: RetryOptions = {}) {
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  const retry = useCallback(
    async <T>(fn: () => Promise<T> | T): Promise<T | null> => {
      if (retryCount >= maxRetries) {
        console.warn(`Maximum retry count reached (${maxRetries})`);
        return null;
      }

      try {
        setIsRetrying(true);
        // Calculate exponential backoff delay
        const delay = baseDelay * Math.pow(factor, retryCount);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        
        setRetryCount(prev => prev + 1);
        return await fn();
      } catch (error) {
        console.error(`Error during retry (attempt ${retryCount + 1}/${maxRetries}):`, error);
        return retry(fn);
      } finally {
        setIsRetrying(false);
      }
    },
    [retryCount, maxRetries, baseDelay, factor]
  );

  const reset = useCallback(() => {
    setRetryCount(0);
    setIsRetrying(false);
  }, []);

  return {
    retry,
    reset,
    retryCount,
    isRetrying,
    hasRetriesLeft: retryCount < maxRetries
  };
}
