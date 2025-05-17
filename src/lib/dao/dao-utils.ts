
/**
 * Utility functions for the DAO module
 */
import { Filter } from 'nostr-tools';

/**
 * Generate a random ID for use in Nostr events
 * @returns A random string ID
 */
export function generateRandomId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

/**
 * Wait for multiple promises to settle and return the successful ones
 * This is a replacement for Promise.any which might not be available in all environments
 * @param promises Array of promises to wait for
 * @returns Promise that resolves when any of the input promises resolves
 */
export async function settlePromises<T>(promises: Promise<T>[]): Promise<T> {
  return new Promise((resolve, reject) => {
    let resolved = false;
    let rejectedCount = 0;
    
    promises.forEach(promise => {
      promise.then(result => {
        if (!resolved) {
          resolved = true;
          resolve(result);
        }
      }).catch(() => {
        rejectedCount++;
        if (rejectedCount === promises.length) {
          reject(new Error('All promises were rejected'));
        }
      });
    });
    
    // Fallback if all promises hang
    setTimeout(() => {
      if (!resolved) {
        reject(new Error('Promises timed out'));
      }
    }, 15000);
  });
}

/**
 * Convert a filter object to a format compatible with the SimplePool API
 * @param filter The filter object to convert
 * @returns A filter object compatible with nostr-tools
 */
export function convertToFilter(filter: any): Filter {
  // SimplePool expects filters in a specific format
  return filter as Filter;
}

/**
 * Flattens an array of promises into a single promise
 * @param promiseArrays An array of promise arrays
 * @returns A single promise with the combined results
 */
export function flattenPromises<T>(promiseArrays: Promise<T>[][]): Promise<T[]> {
  // Flatten the array of promise arrays into a single array of promises
  const flattenedPromises = promiseArrays.reduce((acc, arr) => [...acc, ...arr], []);
  
  // Return a promise that resolves when all promises are settled
  return Promise.all(flattenedPromises);
}

/**
 * Wait for any of the promises to resolve and return the first successful result
 * This is a safe implementation of Promise.any for environments that don't support it
 * @param promises Array of promises to wait for
 * @returns Promise that resolves with the first successful result
 */
export async function promiseAny<T>(promises: Promise<T>[]): Promise<T> {
  return new Promise((resolve, reject) => {
    let rejectedCount = 0;
    
    promises.forEach(promise => {
      promise.then(result => {
        resolve(result);
      }).catch(() => {
        rejectedCount++;
        if (rejectedCount === promises.length) {
          reject(new Error('All promises were rejected'));
        }
      });
    });
  });
}
