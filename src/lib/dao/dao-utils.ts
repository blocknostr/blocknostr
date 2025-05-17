
import { Filter } from 'nostr-tools';

/**
 * Converts a Filter array to a single Filter object
 * This is needed because nostr-tools expects a single Filter object in some methods
 */
export function convertToFilter(filters: Filter | Filter[]): Filter {
  if (!Array.isArray(filters)) {
    return filters;
  }

  // Merge all filters into a single filter object
  const mergedFilter: Record<string, any> = {};
  
  for (const filter of filters) {
    for (const key in filter) {
      if (key.startsWith('#')) {
        // For tag filters like #e, #p, #d
        if (!mergedFilter[key]) {
          mergedFilter[key] = [];
        }
        mergedFilter[key] = [...(mergedFilter[key] || []), ...(filter[key as keyof Filter] as string[])];
      } else {
        // For standard filters like kinds, authors, etc.
        mergedFilter[key] = mergedFilter[key] || filter[key as keyof Filter];
      }
    }
  }
  
  return mergedFilter as Filter;
}

/**
 * Flattens nested arrays of promises
 */
export function flattenPromises<T>(promises: Promise<T>[][]): Promise<T>[] {
  return promises.flat();
}

/**
 * Like Promise.any but with better typing and fallback for older environments
 */
export function promiseAny<T>(promises: Promise<T>[]): Promise<T> {
  // Use Promise.prototype.then to handle Promise.any polyfill
  return new Promise((resolve, reject) => {
    let errors: Error[] = [];
    let rejected = 0;
    
    if (promises.length === 0) {
      reject(new Error("No promises to resolve"));
      return;
    }
    
    promises.forEach((promise, i) => {
      Promise.resolve(promise).then(resolve, (error) => {
        errors[i] = error;
        rejected++;
        if (rejected === promises.length) {
          reject(new Error("All promises were rejected: " + errors.map(e => e.message).join(', ')));
        }
      });
    });
  });
}
