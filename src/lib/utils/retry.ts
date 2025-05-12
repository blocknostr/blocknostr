
/**
 * Options for retry function
 */
export interface RetryOptions {
  maxAttempts: number;
  baseDelay: number;
  onRetry?: (attempt: number) => void;
  shouldRetry?: (error: Error) => boolean;
}

/**
 * Retry a function with exponential backoff
 * 
 * @param fn Function to retry
 * @param options Retry options
 * @returns Promise that resolves with the function result
 */
export async function retry<T>(
  fn: () => Promise<T>, 
  options: RetryOptions
): Promise<T> {
  const { maxAttempts, baseDelay, onRetry, shouldRetry } = options;
  
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      // Check if we should retry this error
      if (shouldRetry && !shouldRetry(lastError)) {
        throw lastError;
      }
      
      // If we've reached max attempts, throw the error
      if (attempt >= maxAttempts) {
        throw lastError;
      }
      
      // Calculate delay with exponential backoff
      const delay = baseDelay * Math.pow(2, attempt - 1);
      
      // Notify about retry
      if (onRetry) {
        onRetry(attempt);
      }
      
      // Wait before next attempt
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  // This should never happen with the for loop condition, but TypeScript needs it
  throw lastError || new Error('Retry failed');
}
