
import { useEffect, useRef, useCallback } from "react";

interface UseIntersectionObserverProps {
  target?: React.RefObject<Element>;
  onIntersect: () => void;
  threshold?: number;
  rootMargin?: string;
  enabled?: boolean;
  options?: IntersectionObserverInit;
}

export function useIntersectionObserver({
  target,
  onIntersect,
  threshold = 0.1,
  rootMargin = "0px",
  enabled = true,
  options = {},
}: UseIntersectionObserverProps) {
  const savedCallback = useRef(onIntersect);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const elementRef = useRef<HTMLDivElement | null>(null);

  // Remember the latest callback
  useEffect(() => {
    savedCallback.current = onIntersect;
  }, [onIntersect]);

  // Function to set the observed element
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

  useEffect(() => {
    if (!enabled) return;

    // Use either the provided target or create our own ref
    const targetElement = target?.current || elementRef.current;
    if (!targetElement) return;

    // Merge default options with provided options
    const observerOptions = {
      rootMargin,
      threshold,
      ...options,
    };

    // Create the observer
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            savedCallback.current();
          }
        });
      },
      observerOptions
    );

    // Observe the element
    observerRef.current.observe(targetElement);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [target, enabled, rootMargin, threshold, options]);

  // If a target is provided, use that. Otherwise, return the ref setter
  return target ? { isIntersecting: false } : { observedRef: setObservedRef };
}
