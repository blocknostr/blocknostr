
import { useState, useEffect, useRef, RefCallback } from 'react';

interface UseInViewOptions {
  /**
   * The root element to use for intersection
   */
  root?: Element | null;
  
  /**
   * Margin around the root element
   */
  rootMargin?: string;
  
  /**
   * Threshold at which to trigger intersection
   */
  threshold?: number | number[];
  
  /**
   * Only trigger the intersection once
   */
  triggerOnce?: boolean;
  
  /**
   * Start observing immediately
   */
  initialObserve?: boolean;
}

export function useInView({
  root = null,
  rootMargin = '0px',
  threshold = 0,
  triggerOnce = false,
  initialObserve = true,
}: UseInViewOptions = {}) {
  const [inView, setInView] = useState(false);
  const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null);
  const observed = useRef(false);
  const elementRef = useRef<Element | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  
  const setRef: RefCallback<Element> = (element) => {
    if (elementRef.current) {
      unobserve();
    }
    
    if (element) {
      observe(element);
    }
    
    elementRef.current = element;
  };
  
  const observe = (element: Element) => {
    if (observerRef.current === null) {
      observerRef.current = new IntersectionObserver(
        ([entry]) => {
          setEntry(entry);
          setInView(entry.isIntersecting);
          
          if (entry.isIntersecting && triggerOnce) {
            unobserve();
            observed.current = true;
          }
        },
        { root, rootMargin, threshold }
      );
    }
    
    if (element && initialObserve) {
      observerRef.current.observe(element);
    }
  };
  
  const unobserve = () => {
    if (observerRef.current && elementRef.current) {
      observerRef.current.unobserve(elementRef.current);
    }
  };
  
  // Start/stop observing when initialObserve changes
  useEffect(() => {
    if (elementRef.current) {
      if (initialObserve && !observed.current) {
        observe(elementRef.current);
      } else if (!initialObserve) {
        unobserve();
      }
    }
    
    return () => {
      unobserve();
    };
  }, [initialObserve, root, rootMargin, threshold]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);
  
  return {
    ref: setRef,
    inView,
    entry,
    observe: () => elementRef.current && observe(elementRef.current),
    unobserve
  };
}
