
/**
 * Utility for retrying async operations with exponential backoff
 */
export type RetryOptions = {
  maxAttempts?: number;
  baseDelay?: number;
  maxDelay?: number;
  shouldRetry?: (error: unknown) => boolean;
  onRetry?: (attempt: number, error: unknown) => void;
};

export async function retry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    shouldRetry = () => true,
    onRetry = () => {}
  } = options;

  let attempt = 0;
  
  while (true) {
    try {
      return await operation();
    } catch (error) {
      attempt++;
      
      if (attempt >= maxAttempts || !shouldRetry(error)) {
        throw error;
      }
      
      // Calculate exponential backoff delay
      const delayMs = Math.min(
        maxDelay, 
        baseDelay * Math.pow(2, attempt - 1) * (0.5 + Math.random() * 0.5)
      );
      
      // Notify about retry
      onRetry(attempt, error);
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
}
