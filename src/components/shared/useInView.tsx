
import { useState, useEffect, useRef, RefCallback } from 'react';

interface UseInViewOptions {
  /**
   * The element that is used as the viewport for checking visibility
   */
  root?: Element | null;
  /**
   * Margin around the root
   */
  rootMargin?: string;
  /**
   * Number between 0 and 1 indicating the percentage that should be visible
   */
  threshold?: number | number[];
  /**
   * Only trigger the inView callback once
   */
  triggerOnce?: boolean;
  /**
   * Skip observation when the component mounts
   */
  skip?: boolean;
}

interface UseInViewResult {
  ref: RefCallback<Element>;
  inView: boolean;
  entry: IntersectionObserverEntry | null;
}

export function useInView({
  root = null,
  rootMargin = '0px',
  threshold = 0,
  triggerOnce = false,
  skip = false,
}: UseInViewOptions = {}): UseInViewResult {
  const [inView, setInView] = useState<boolean>(false);
  const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null);
  const observer = useRef<IntersectionObserver | null>(null);
  const currentElement = useRef<Element | null>(null);

  const unobserve = () => {
    if (observer.current && currentElement.current) {
      observer.current.unobserve(currentElement.current);
      observer.current.disconnect();
      observer.current = null;
    }
  };

  useEffect(() => {
    // Skip creating the observer if the component should not observe
    if (skip) {
      return;
    }

    // Cleanup the previous observer
    unobserve();

    // Create a new observer with the provided options
    observer.current = new IntersectionObserver(
      ([newEntry]) => {
        setEntry(newEntry);
        setInView(newEntry.isIntersecting);

        // Unobserve after it becomes visible if triggerOnce is set
        if (newEntry.isIntersecting && triggerOnce && observer.current && currentElement.current) {
          observer.current.unobserve(currentElement.current);
        }
      },
      { root, rootMargin, threshold }
    );

    // Observe the current element if it exists
    if (currentElement.current) {
      observer.current.observe(currentElement.current);
    }

    return () => {
      unobserve();
    };
  }, [root, rootMargin, threshold, triggerOnce, skip]);

  // The ref callback that will set the element to observe
  const ref = (element: Element | null) => {
    if (element !== currentElement.current) {
      // Disconnect the old observer from the previous element
      unobserve();

      // Update the current element
      currentElement.current = element;

      // Connect the new observer to the new element
      if (!skip && element && observer.current) {
        observer.current.observe(element);
      }
    }
  };

  return { ref, inView, entry };
}
