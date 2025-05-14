
import { useRef, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { SubscriptionTracker } from '@/lib/nostr/subscription-tracker';

/**
 * Hook to manage subscriptions in a component
 * This helps prevent memory leaks and browser crashes by ensuring
 * all subscriptions are properly cleaned up when components unmount
 */
export function useComponentSubscriptions() {
  // Generate a stable component ID
  const componentIdRef = useRef<string>(`component_${uuidv4().slice(0, 8)}`);
  const cleanupFunctionsRef = useRef<(() => void)[]>([]);
  
  // On unmount, clean up all subscriptions
  useEffect(() => {
    return () => {
      console.log(`Cleaning up subscriptions for component ${componentIdRef.current}`);
      
      // Execute all cleanup functions
      cleanupFunctionsRef.current.forEach(cleanup => {
        try {
          cleanup();
        } catch (error) {
          console.error(`Error during subscription cleanup:`, error);
        }
      });
      
      // Get the tracker instance and clean up by component ID
      const tracker = SubscriptionTracker.getInstance();
      tracker.cleanupForComponent(componentIdRef.current);
    };
  }, []);
  
  /**
   * Register a subscription with a cleanup function
   */
  const registerCleanup = (cleanup: () => void) => {
    cleanupFunctionsRef.current.push(cleanup);
  };
  
  /**
   * Get the component ID for use in subscription options
   */
  const getComponentId = (): string => {
    return componentIdRef.current;
  };
  
  return {
    componentId: getComponentId(),
    registerCleanup
  };
}
