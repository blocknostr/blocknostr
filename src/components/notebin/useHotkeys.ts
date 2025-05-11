
import { useEffect, DependencyList } from 'react';

type KeyHandler = (e: KeyboardEvent) => void;

export function useHotkeys(
  keyCombo: string,
  callback: KeyHandler,
  deps: DependencyList = []
) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const keys = keyCombo.toLowerCase().split('+');
      const key = event.key.toLowerCase();
      
      // Check if all modifier keys in the combo are pressed
      const ctrlRequired = keys.includes('ctrl');
      const shiftRequired = keys.includes('shift');
      const altRequired = keys.includes('alt');
      const metaRequired = keys.includes('meta');
      
      // Check if modifiers match
      const ctrlMatch = ctrlRequired === event.ctrlKey;
      const shiftMatch = shiftRequired === event.shiftKey;
      const altMatch = altRequired === event.altKey;
      const metaMatch = metaRequired === event.metaKey;
      
      // Get the actual key (last part of combo)
      const targetKey = keys.filter(k => !['ctrl', 'shift', 'alt', 'meta'].includes(k))[0];
      
      // Execute callback if everything matches
      if (
        ctrlMatch && shiftMatch && altMatch && metaMatch && 
        key === targetKey
      ) {
        callback(event);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.addEventListener('keydown', handleKeyDown);
    };
  }, [keyCombo, callback, ...deps]);
}
