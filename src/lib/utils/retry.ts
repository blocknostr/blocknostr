
/**
 * Options for retry logic
 */
interface RetryOptions {
  maxAttempts?: number;
  baseDelay?: number;
  maxDelay?: number;
  backoffFactor?: number;
  onRetry?: (attempt: number, error: Error) => void;
}

/**
 * Retry a function with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    backoffFactor = 2,
    onRetry
  } = options;
  
  let attempts = 0;
  let lastError: Error;
  
  while (attempts < maxAttempts) {
    try {
      return await fn();
    } catch (error) {
      attempts++;
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // If we've used all attempts, throw the last error
      if (attempts >= maxAttempts) {
        throw lastError;
      }
      
      // Calculate delay with exponential backoff
      const delay = Math.min(
        baseDelay * Math.pow(backoffFactor, attempts - 1),
        maxDelay
      );
      
      // Call onRetry callback if provided
      if (onRetry) {
        onRetry(attempts, lastError);
      }
      
      // Wait before next attempt
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  // This should never happen due to the throw above, but TypeScript requires it
  throw lastError!;
}
