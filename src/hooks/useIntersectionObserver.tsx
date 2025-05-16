
import { useRef, useEffect, useState, useCallback } from 'react';

interface UseIntersectionObserverProps {
  onIntersect: () => void;
  options?: IntersectionObserverInit;
  enabled?: boolean;
}

export function useIntersectionObserver({
  onIntersect,
  options = {},
  enabled = true,
}: UseIntersectionObserverProps) {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const elementRef = useRef<HTMLDivElement | null>(null);
  const [isIntersecting, setIsIntersecting] = useState(false);

  // Set the observed element
  const setObservedRef = useCallback((element: HTMLDivElement | null) => {
    if (elementRef.current) {
      // Disconnect from previous element
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    }

    // Update the element ref
    elementRef.current = element;

    // Connect to new element if it exists and we're enabled
    if (element && enabled && observerRef.current) {
      observerRef.current.observe(element);
    }
  }, [enabled]);

  // Effect to set up and tear down the observer
  useEffect(() => {
    // Default options
    const defaultOptions: IntersectionObserverInit = {
      root: null,
      rootMargin: '0px',
      threshold: 0,
    };

    // Merge default options with provided options
    const finalOptions = { ...defaultOptions, ...options };

    // Create the observer
    observerRef.current = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        setIsIntersecting(entry.isIntersecting);
        
        if (entry.isIntersecting) {
          onIntersect();
        }
      },
      finalOptions
    );

    // Observe the element if it exists and we're enabled
    if (elementRef.current && enabled) {
      observerRef.current.observe(elementRef.current);
    }

    // Clean up on unmount
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [onIntersect, options, enabled]);

  return { observedRef: setObservedRef, isIntersecting };
}
