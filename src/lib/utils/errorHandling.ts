
import { toast } from 'sonner';

export interface ErrorConfig {
  toastMessage?: string;
  logMessage?: string;
  retry?: () => Promise<void>;
  maxRetries?: number;
  silent?: boolean;
}

/**
 * Standardized error handling with optional retries and toast notifications
 */
export async function handleError(
  error: unknown, 
  config: ErrorConfig = {}
): Promise<void> {
  const {
    toastMessage = 'An error occurred',
    logMessage = 'Error',
    retry,
    maxRetries = 3,
    silent = false
  } = config;
  
  // Log the error
  console.error(`${logMessage}:`, error);
  
  // Show toast if enabled and not silent
  if (toastMessage && !silent) {
    toast.error(toastMessage);
  }
  
  // Handle retry logic if provided
  if (retry && maxRetries > 0) {
    let retryCount = 0;
    let success = false;
    
    while (!success && retryCount < maxRetries) {
      retryCount++;
      try {
        await retry();
        success = true;
      } catch (retryError) {
        console.warn(`Retry attempt ${retryCount}/${maxRetries} failed:`, retryError);
        
        // Wait with exponential backoff before retrying
        const delay = Math.min(1000 * Math.pow(2, retryCount - 1), 8000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    // If we exhaust all retries and not silent
    if (!success && !silent) {
      toast.error(`Failed after ${maxRetries} attempts`);
    }
  }
}

/**
 * Safely execute a function that might throw, returning a default value on error
 */
export function safeExecute<T>(
  fn: () => T,
  defaultValue: T,
  errorConfig: ErrorConfig = { silent: true }
): T {
  try {
    return fn();
  } catch (error) {
    handleError(error, errorConfig);
    return defaultValue;
  }
}

/**
 * Execute a function with proper error handling for UI operations
 */
export function tryCatchWithToast(
  fn: () => void,
  successMessage?: string,
  errorMessage = 'Operation failed'
): void {
  try {
    fn();
    if (successMessage) {
      toast.success(successMessage);
    }
  } catch (error) {
    console.error('Operation failed:', error);
    toast.error(errorMessage);
  }
}
