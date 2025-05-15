
import { toast } from '@/components/ui/sonner';

export interface ErrorConfig {
  toastMessage?: string;
  logMessage?: string;
  retry?: () => Promise<void>;
  maxRetries?: number;
  duration?: number;
  type?: 'error' | 'warning' | 'info';
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
    duration = 5000,
    type = 'error'
  } = config;
  
  // Log the error
  console.error(`${logMessage}:`, error);
  
  // Show toast if enabled
  if (toastMessage) {
    if (type === 'error') {
      toast.error(toastMessage, { duration });
    } else if (type === 'warning') {
      toast.warning(toastMessage, { duration });
    } else if (type === 'info') {
      toast.info(toastMessage, { duration });
    }
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
        // Show success toast after successful retry
        if (retryCount > 1) {
          toast.success(`Succeeded after ${retryCount} ${retryCount === 1 ? 'attempt' : 'attempts'}`);
        }
      } catch (retryError) {
        console.warn(`Retry attempt ${retryCount}/${maxRetries} failed:`, retryError);
        
        // Wait with exponential backoff before retrying
        const delay = Math.min(1000 * Math.pow(2, retryCount - 1), 8000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    // If we exhaust all retries
    if (!success) {
      toast.error(`Failed after ${maxRetries} attempts`, {
        description: "Please try again later or contact support.",
        duration: 6000
      });
    }
  }
}
