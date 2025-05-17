
/**
 * Utility functions for DAO operations
 */

/**
 * Polyfill for Promise.any
 * This is needed for browsers/environments that don't support Promise.any natively
 */
export function promiseAny<T>(promises: Promise<T>[]): Promise<T> {
  return new Promise((resolve, reject) => {
    if (promises.length === 0) {
      reject(new Error('No promises provided'));
      return;
    }

    let rejectedCount = 0;
    const errors: Error[] = [];

    promises.forEach((promise, index) => {
      Promise.resolve(promise)
        .then(value => {
          resolve(value);
        })
        .catch(error => {
          errors[index] = error;
          rejectedCount++;
          if (rejectedCount === promises.length) {
            reject(new AggregateError(
              errors,
              'All promises were rejected'
            ));
          }
        });
    });
  });
}

/**
 * Custom AggregateError implementation for environments that don't support it natively
 */
class AggregateError extends Error {
  public errors: Error[];
  
  constructor(errors: Error[], message: string) {
    super(message);
    this.name = 'AggregateError';
    this.errors = errors;
  }
}

/**
 * Generate a unique DAO ID
 */
export function generateUniqueId(prefix: string = 'dao'): string {
  return `${prefix}_${Math.random().toString(36).substring(2, 10)}`;
}

/**
 * Format a timestamp for display (e.g., "2 hours ago")
 */
export function formatTimestamp(timestamp: number): string {
  const now = Math.floor(Date.now() / 1000);
  const diff = now - timestamp;
  
  if (diff < 60) {
    return `${diff} second${diff !== 1 ? 's' : ''} ago`;
  } else if (diff < 3600) {
    const minutes = Math.floor(diff / 60);
    return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  } else if (diff < 86400) {
    const hours = Math.floor(diff / 3600);
    return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  } else {
    const days = Math.floor(diff / 86400);
    return `${days} day${days !== 1 ? 's' : ''} ago`;
  }
}
