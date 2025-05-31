
interface RetryOptions {
  maxAttempts: number;
  baseDelay: number;
  backoffFactor?: number;
  maxDelay?: number;
  onRetry?: (attempt: number) => void;
}

/**
 * Retry a function with exponential backoff
 * @param fn Function to retry
 * @param options Retry options
 * @returns Promise resolving to the function result or rejecting with the final error
 */
export const retry = async <T>(
  fn: () => Promise<T>, 
  options: RetryOptions
): Promise<T> => {
  const {
    maxAttempts,
    baseDelay,
    backoffFactor = 2,
    maxDelay = 30000,
    onRetry
  } = options;
  
  let attempt = 1;
  let lastError: any;
  
  while (attempt <= maxAttempts) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (attempt >= maxAttempts) {
        break;
      }
      
      // Calculate delay with exponential backoff
      const delay = Math.min(
        baseDelay * Math.pow(backoffFactor, attempt - 1),
        maxDelay
      );
      
      // Add some jitter to prevent thundering herd
      const jitteredDelay = delay * (0.8 + Math.random() * 0.4);
      
      // Notify caller of retry
      if (onRetry) {
        onRetry(attempt);
      }
      
      // Wait before next attempt
      await new Promise(resolve => setTimeout(resolve, jitteredDelay));
      
      attempt++;
    }
  }
  
  throw lastError;
};

/**
 * Retry with timeout
 * @param fn Function to retry
 * @param options Retry options
 * @param timeout Overall timeout in milliseconds
 * @returns Promise resolving to the function result or rejecting with timeout error
 */
export const retryWithTimeout = async <T>(
  fn: () => Promise<T>,
  options: RetryOptions,
  timeout: number
): Promise<T> => {
  return Promise.race([
    retry(fn, options),
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error("Operation timed out")), timeout);
    })
  ]);
};

/**
 * Run multiple functions in parallel with retry
 * @param fns Array of functions to run
 * @param options Retry options
 * @param minSuccesses Minimum number of successes required
 * @returns Promise resolving to array of results (successes only)
 */
export const parallelRetry = async <T>(
  fns: Array<() => Promise<T>>,
  options: RetryOptions,
  minSuccesses: number = 1
): Promise<T[]> => {
  // Define the explicit type for the Promise.allSettled result to ensure proper typing
  const results = await Promise.allSettled(
    fns.map(fn => retry(fn, options))
  );
  
  // Create a proper type guard function that satisfies TypeScript
  function isFulfilled<T>(result: PromiseSettledResult<T>): result is PromiseFulfilledResult<T> {
    return result.status === 'fulfilled';
  }
  
  // Use the type guard to filter and map results
  const successes = results.filter(isFulfilled).map(result => result.value);
  
  if (successes.length >= minSuccesses) {
    return successes;
  }
  
  throw new Error(`Expected at least ${minSuccesses} successes, but got ${successes.length}`);
};

