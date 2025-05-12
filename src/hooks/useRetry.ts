
import { useRef, useCallback } from 'react';

interface UseRetryOptions {
  maxRetries?: number;
}

export function useRetry({ maxRetries = 3 }: UseRetryOptions = {}) {
  const retryRef = useRef<number>(0);
  
  const resetRetry = useCallback(() => {
    retryRef.current = 0;
  }, []);
  
  const scheduleRetry = useCallback((callback: () => void): number | null => {
    if (retryRef.current < maxRetries) {
      retryRef.current++;
      const delay = Math.min(1000 * Math.pow(2, retryRef.current), 8000);
      console.log(`Retry attempt ${retryRef.current}/${maxRetries} in ${delay}ms`);
      
      return window.setTimeout(() => {
        callback();
      }, delay);
    }
    return null;
  }, [maxRetries]);
  
  const canRetry = useCallback(() => {
    return retryRef.current < maxRetries;
  }, [maxRetries]);
  
  return {
    currentRetry: retryRef.current,
    resetRetry,
    scheduleRetry,
    canRetry,
    maxRetries
  };
}
