
/**
 * Options for retry functionality
 */
interface RetryOptions {
  maxAttempts: number;
  baseDelay: number;
  backoffFactor?: number;
  onRetry?: (attempt: number) => void;
}

/**
 * Retry a function with exponential backoff
 * @param fn Function to retry
 * @param options Retry options
 * @returns Promise resolving to the function result
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: RetryOptions
): Promise<T> {
  const { maxAttempts, baseDelay, backoffFactor = 2, onRetry } = options;
  
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // If this is the last attempt, don't wait, just throw
      if (attempt === maxAttempts) {
        throw lastError;
      }
      
      // Calculate delay with exponential backoff
      const delay = baseDelay * Math.pow(backoffFactor, attempt - 1);
      
      // Call onRetry callback if provided
      if (onRetry) {
        onRetry(attempt);
      }
      
      // Wait before next retry
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  // This should never happen, but TypeScript needs it
  throw lastError || new Error('Retry failed');
}

/**
 * Execute multiple functions in parallel and succeed if at least minSuccess functions succeed
 * @param functions Array of functions to execute
 * @param options Retry options for individual functions
 * @param minSuccess Minimum number of successful executions required
 * @returns Promise resolving to array of results
 */
export async function parallelRetry<T>(
  functions: Array<() => Promise<T>>,
  options: RetryOptions,
  minSuccess: number
): Promise<T[]> {
  const results: T[] = [];
  const errors: Error[] = [];
  
  // Execute all functions and collect results or errors
  const promises = functions.map(async (fn) => {
    try {
      const result = await retry(fn, options);
      results.push(result);
      return result;
    } catch (error) {
      errors.push(error instanceof Error ? error : new Error(String(error)));
      return null;
    }
  });
  
  // Wait for all promises to resolve
  await Promise.all(promises);
  
  // Check if we have enough successes
  if (results.length >= minSuccess) {
    return results;
  }
  
  // If not enough successes, throw an error with details
  throw new Error(`ParallelRetry: Only ${results.length} of ${functions.length} succeeded, needed ${minSuccess}. Errors: ${errors.map(e => e.message).join(', ')}`);
}
