import { useState, useEffect } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
  // Get from local storage then
  // parse stored json or return initialValue
  const readValue = () => {
    // Prevent build error on server
    if (typeof window === 'undefined') {
      return initialValue;
    }

    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  };

  // State to store our value
  // Pass initial state function to useState so logic is only executed once
  const [storedValue, setStoredValue] = useState<T>(readValue);
  // Keep track if localStorage is available and has sufficient quota
  const [storageAvailable, setStorageAvailable] = useState<boolean>(true);

  // Test storage availability on mount
  useEffect(() => {
    try {
      // Test if localStorage is available at all
      const testKey = "__storage_test__";
      window.localStorage.setItem(testKey, testKey);
      window.localStorage.removeItem(testKey);
      setStorageAvailable(true);
    } catch (e) {
      console.warn("localStorage not available:", e);
      setStorageAvailable(false);
    }
  }, []);

  // Return a wrapped version of useState's setter function that persists the new value to localStorage
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      // Allow value to be a function so we have same API as useState
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      
      // Save state
      setStoredValue(valueToStore);
      
      // Only attempt to save to localStorage if it's available
      if (storageAvailable && typeof window !== 'undefined') {
        try {
          const serialized = JSON.stringify(valueToStore);
          window.localStorage.setItem(key, serialized);
        } catch (error) {
          console.warn(`Error setting localStorage key "${key}":`, error);
          // If it's a quota exceeded error, mark storage as unavailable
          if (error instanceof DOMException && 
              (error.name === 'QuotaExceededError' || 
               error.name === 'NS_ERROR_DOM_QUOTA_REACHED')) {
            setStorageAvailable(false);
            // We can still use the in-memory state
          }
        }
      }
    } catch (error) {
      console.warn(`Error saving value:`, error);
    }
  };

  useEffect(() => {
    setStoredValue(readValue());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return [storedValue, setValue];
}

export default useLocalStorage;

