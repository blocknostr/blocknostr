
import { toast } from 'sonner';

export interface ErrorConfig {
  toastMessage?: string;
  logMessage?: string;
  retry?: () => Promise<void>;
  maxRetries?: number;
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
    maxRetries = 3
  } = config;
  
  // Log the error
  console.error(`${logMessage}:`, error);
  
  // Show toast if enabled
  if (toastMessage) {
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
    
    // If we exhaust all retries
    if (!success) {
      toast.error(`Failed after ${maxRetries} attempts`);
    }
  }
}
