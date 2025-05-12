
/**
 * Retry a function with exponential backoff
 * @param fn Function to retry
 * @param options Retry options
 * @returns Result of the function or null if max attempts exceeded
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: {
    maxAttempts?: number;
    baseDelay?: number;
    factor?: number;
    onRetry?: (attempt: number) => void;
  } = {}
): Promise<T> {
  const { 
    maxAttempts = 3, 
    baseDelay = 1000, 
    factor = 2,
    onRetry = () => {} 
  } = options;
  
  let attempt = 0;
  
  while (attempt < maxAttempts) {
    try {
      return await fn();
    } catch (err) {
      attempt++;
      
      // If we've reached max attempts, throw the error
      if (attempt >= maxAttempts) {
        throw err;
      }
      
      // Call the onRetry callback
      onRetry(attempt);
      
      // Calculate exponential backoff delay
      const delay = baseDelay * Math.pow(factor, attempt - 1);
      
      // Wait before next attempt
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw new Error(`Max retry attempts (${maxAttempts}) exceeded`);
}
