
import { useState, useEffect } from 'react';

type HapticType = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' | 'selection';

export function useHapticFeedback() {
  const [isHapticSupported, setIsHapticSupported] = useState(false);
  
  // Check if the device supports haptic feedback
  useEffect(() => {
    if ('vibrate' in navigator) {
      setIsHapticSupported(true);
    }
    
    // Check for iOS specific haptics in window.navigator
    if (typeof window !== 'undefined' && 
        window.navigator && 
        ('vibrate' in window.navigator)) {
      setIsHapticSupported(true);
    }
  }, []);
  
  // Function to trigger vibration based on pattern
  const triggerHaptic = (type: HapticType = 'light') => {
    if (!isHapticSupported) return;
    
    try {
      switch (type) {
        case 'light':
          navigator.vibrate(10);
          break;
        case 'medium':
          navigator.vibrate([15, 10, 15]);
          break;
        case 'heavy':
          navigator.vibrate([20, 20, 20]);
          break;
        case 'success':
          navigator.vibrate([10, 15, 30]);
          break;
        case 'warning':
          navigator.vibrate([30, 50, 30]);
          break;
        case 'error':
          navigator.vibrate([50, 30, 50, 30, 50]);
          break;
        case 'selection':
          navigator.vibrate([8]);
          break;
        default:
          navigator.vibrate(10);
      }
    } catch (error) {
      console.error('Error triggering haptic feedback:', error);
    }
  };
  
  return {
    isHapticSupported,
    triggerHaptic
  };
}
