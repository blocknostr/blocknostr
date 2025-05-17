
import { Event, Filter } from "nostr-tools";

/**
 * Convert a Filter object to the format expected by the nostr-tools library
 */
export function convertToFilter(filter: Filter): any {
  if (!filter) return {};
  
  // Deep clone to avoid modifying the original
  const converted = { ...filter };
  
  // Convert nested arrays like tags
  for (const key in converted) {
    if (Array.isArray(converted[key])) {
      converted[key] = [...converted[key]];
    }
  }
  
  // Remove undefined values
  for (const key in converted) {
    if (converted[key] === undefined) {
      delete converted[key];
    }
  }
  
  return converted;
}

/**
 * Flatten an array of promises
 */
export async function flattenPromises<T>(promises: Promise<T[]>[]): Promise<T[]> {
  const results = await Promise.all(promises);
  return results.flat();
}

/**
 * A polyfill for Promise.any that works in older browsers
 * Returns the value of the first resolved promise or an AggregateError if all promises reject
 */
export async function promiseAny<T>(promises: Promise<T>[]): Promise<T> {
  if (!promises.length) {
    throw new Error("No promises provided to promiseAny");
  }
  
  // Use native Promise.any if available
  if (typeof Promise.any === 'function') {
    return Promise.any(promises);
  }
  
  // Polyfill implementation
  return new Promise((resolve, reject) => {
    let errors: Error[] = [];
    let pending = promises.length;
    
    if (pending === 0) {
      reject(new Error("All promises rejected"));
      return;
    }
    
    promises.forEach((promise, i) => {
      Promise.resolve(promise)
        .then(value => {
          resolve(value);
        })
        .catch(error => {
          errors[i] = error;
          pending--;
          if (pending === 0) {
            // Create an error that contains all rejection reasons
            const aggregateError = new Error("All promises rejected");
            (aggregateError as any).errors = errors;
            reject(aggregateError);
          }
        });
    });
  });
}

/**
 * Converts event IDs to hex format if needed
 */
export function normalizeEventIds(ids: string[]): string[] {
  return ids.map(id => {
    // If it's a note1... format, convert to hex
    if (id.startsWith('note1')) {
      try {
        // This would need the actual implementation
        // For now we'll return the original ID
        return id;
      } catch (e) {
        console.error("Failed to convert note1 ID", e);
        return id;
      }
    }
    return id;
  });
}

/**
 * Ensures a value is an array
 */
export function ensureArray<T>(value: T | T[]): T[] {
  return Array.isArray(value) ? value : [value];
}

/**
 * Safely parse JSON with fallback
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T;
  } catch (e) {
    console.error("Failed to parse JSON", e);
    return fallback;
  }
}
