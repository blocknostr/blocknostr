
/**
 * src/lib/storage.ts
 * Safely interact with localStorage, including automatic JSON parsing
 */

// Safely get a raw string from localStorage
export const safeLocalStorageGet = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch (error) {
    console.warn(`Error reading from localStorage (${key}):`, error);
    return null;
  }
};

// Safely set a raw string into localStorage
export const safeLocalStorageSet = (key: string, value: string): boolean => {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (error) {
    console.warn(`Error writing to localStorage (${key}):`, error);
    return false;
  }
};

// Safely remove a key from localStorage
export const safeLocalStorageRemove = (key: string): boolean => {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.warn(`Error removing from localStorage (${key}):`, error);
    return false;
  }
};

/**
 * Safely parse JSON out of localStorage, clearing the key on parse errors.
 * @param key Storage key
 * @returns The parsed object, or undefined if missing or invalid
 */
export function safeLocalStorageGetJson<T = any>(key: string): T | undefined {
  const raw = safeLocalStorageGet(key);
  if (raw === null) return undefined;

  try {
    return JSON.parse(raw) as T;
  } catch (err) {
    console.warn(`Invalid JSON in localStorage[${key}], clearing it:`, err);
    safeLocalStorageRemove(key);
    return undefined;
  }
}

/**
 * Safely save JSON to localStorage, with proper stringification.
 * @param key Storage key
 * @param value Value to store
 * @returns Boolean indicating success
 */
export function safeLocalStorageSetJson<T = any>(key: string, value: T): boolean {
  try {
    const json = JSON.stringify(value);
    return safeLocalStorageSet(key, json);
  } catch (err) {
    console.warn(`Error stringifying to localStorage[${key}]:`, err);
    return false;
  }
}
