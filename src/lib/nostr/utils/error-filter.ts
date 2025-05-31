/**
 * Error filtering utilities for NOSTR operations
 * Helps distinguish between critical errors and expected issues (like paid relays)
 */

export interface ErrorClassification {
  type: 'critical' | 'warning' | 'info';
  userMessage: string;
  shouldDisplay: boolean;
  shouldRetry: boolean;
}

/**
 * Classifies NOSTR-related errors for better user experience
 */
export function classifyError(error: Error | string): ErrorClassification {
  const errorMessage = typeof error === 'string' ? error : error.message || '';
  const lowerMessage = errorMessage.toLowerCase();

  // ✅ ENHANCED: Paid relay restrictions - not critical errors
  if (lowerMessage.includes('restricted') || 
      lowerMessage.includes('not an active paid member') ||
      lowerMessage.includes('pay on') ||
      lowerMessage.includes('paid') ||
      lowerMessage.includes('membership') ||
      lowerMessage.includes('subscription required') ||
      lowerMessage.includes('premium') ||
      lowerMessage.includes('upgrade required')) {
    return {
      type: 'info',
      userMessage: 'Some premium relays were skipped (operation likely succeeded on free relays)',
      shouldDisplay: false, // Don't show as error to user
      shouldRetry: false
    };
  }

  // Extension permission issues
  if (lowerMessage.includes('user rejected') || 
      lowerMessage.includes('denied') ||
      lowerMessage.includes('permission')) {
    return {
      type: 'warning',
      userMessage: 'Please approve the request in your NOSTR extension',
      shouldDisplay: true,
      shouldRetry: true
    };
  }

  // Authentication issues
  if (lowerMessage.includes('not authenticated') ||
      lowerMessage.includes('login') ||
      lowerMessage.includes('public key')) {
    return {
      type: 'warning',
      userMessage: 'Please log in with your NOSTR account first',
      shouldDisplay: true,
      shouldRetry: false
    };
  }

  // Network timeouts
  if (lowerMessage.includes('timeout') ||
      lowerMessage.includes('network')) {
    return {
      type: 'warning',
      userMessage: 'Network timeout - please try again',
      shouldDisplay: true,
      shouldRetry: true
    };
  }

  // ✅ NEW: Relay connection issues
  if (lowerMessage.includes('websocket') ||
      lowerMessage.includes('connection refused') ||
      lowerMessage.includes('relay') && lowerMessage.includes('failed')) {
    return {
      type: 'warning',
      userMessage: 'Relay connection issue - trying backup relays',
      shouldDisplay: false, // Handle silently
      shouldRetry: true
    };
  }

  // Critical errors
  return {
    type: 'critical',
    userMessage: errorMessage || 'An unexpected error occurred',
    shouldDisplay: true,
    shouldRetry: false
  };
}

/**
 * Logs errors appropriately based on their classification
 */
export function logClassifiedError(error: Error | string, context: string = 'NOSTR Operation') {
  const classification = classifyError(error);
  const errorMessage = typeof error === 'string' ? error : error.message || '';

  switch (classification.type) {
    case 'info':
      console.info(`[${context}] ${errorMessage}`);
      break;
    case 'warning':
      console.warn(`[${context}] ${errorMessage}`);
      break;
    case 'critical':
      console.error(`[${context}] ${errorMessage}`);
      break;
  }

  return classification;
}

/**
 * Gracefully handles errors from async operations
 */
export async function handleAsyncOperation<T>(
  operation: () => Promise<T>,
  context: string = 'Operation'
): Promise<{ success: boolean; data?: T; error?: ErrorClassification }> {
  try {
    const data = await operation();
    return { success: true, data };
  } catch (error) {
    const classification = logClassifiedError(error, context);
    return { success: false, error: classification };
  }
} 