
/**
 * Options for retry operation
 */
interface RetryOptions {
  maxAttempts?: number;
  baseDelay?: number;
  onRetry?: (attempt: number, error?: any) => void;
  shouldRetry?: (error: any) => boolean;
}

/**
 * Utility to retry an async operation multiple times with exponential backoff
 * 
 * @param operation The async function to retry
 * @param options RetryOptions including maxAttempts, baseDelay, etc.
 * @returns The result of the operation or throws the last error
 */
export async function retry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    baseDelay = 1000,
    onRetry = () => {},
    shouldRetry = () => true
  } = options;
  
  let lastError: any;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      // Attempt the operation
      const result = await operation();
      return result;
    } catch (error) {
      lastError = error;
      
      // Check if we should retry based on the error
      if (!shouldRetry(error)) {
        throw error;
      }
      
      // If this was the last attempt, throw the error
      if (attempt === maxAttempts) {
        throw error;
      }
      
      // Call the onRetry callback if provided
      onRetry(attempt, error);
      
      // Calculate exponential backoff delay
      // 1st retry: baseDelay, 2nd: baseDelay*2, 3rd: baseDelay*4, etc.
      const delay = baseDelay * Math.pow(2, attempt - 1);
      
      // Wait before the next attempt
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  // This should never be reached because we either return a result or throw an error
  // But TypeScript requires a return statement
  throw lastError;
}
