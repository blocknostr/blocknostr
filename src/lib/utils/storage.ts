
/**
 * Safely get an item from localStorage with error handling
 * @param key Storage key
 * @returns Stored value or null if not found/error
 */
export const safeLocalStorageGet = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch (error) {
    console.warn(`Error reading from localStorage (${key}):`, error);
    return null;
  }
};

/**
 * Safely set an item in localStorage with error handling
 * @param key Storage key
 * @param value Value to store
 * @returns Boolean indicating success
 */
export const safeLocalStorageSet = (key: string, value: string): boolean => {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (error) {
    console.warn(`Error writing to localStorage (${key}):`, error);
    return false;
  }
};

/**
 * Safely remove an item from localStorage with error handling
 * @param key Storage key
 * @returns Boolean indicating success
 */
export const safeLocalStorageRemove = (key: string): boolean => {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.warn(`Error removing from localStorage (${key}):`, error);
    return false;
  }
};
