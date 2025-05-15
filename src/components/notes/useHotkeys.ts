
import { useEffect, DependencyList } from 'react';

type KeyHandler = (e: KeyboardEvent) => void;

/**
 * A hook to register keyboard shortcuts
 * 
 * @param key The key combination (e.g. 'ctrl+s', 'shift+a')
 * @param callback The function to call when the key combination is pressed
 * @param deps Dependencies array (similar to useEffect)
 */
export function useHotkeys(key: string, callback: KeyHandler, deps: DependencyList = []) {
  useEffect(() => {
    // Parse the key combination
    const keys = key.toLowerCase().split('+');
    const hasCtrl = keys.includes('ctrl');
    const hasShift = keys.includes('shift');
    const hasAlt = keys.includes('alt');
    const targetKey = keys.filter(k => !['ctrl', 'shift', 'alt'].includes(k))[0];

    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if modifier keys match
      const ctrlMatch = hasCtrl === (e.ctrlKey || e.metaKey); // Support both Ctrl and Cmd (Mac)
      const shiftMatch = hasShift === e.shiftKey;
      const altMatch = hasAlt === e.altKey;
      
      // Check if the key matches
      const keyMatch = e.key.toLowerCase() === targetKey;
      
      // If all conditions match, execute callback
      if (ctrlMatch && shiftMatch && altMatch && keyMatch) {
        callback(e);
      }
    };

    // Add event listener
    window.addEventListener('keydown', handleKeyDown);

    // Clean up
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [key, callback, ...deps]);
}
