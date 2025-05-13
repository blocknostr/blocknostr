
import { useState, useEffect, useCallback, useRef } from 'react';

interface UseInViewProps {
  root?: Element | null;
  rootMargin?: string;
  threshold?: number | number[];
  triggerOnce?: boolean;
}

export function useInView({
  root = null,
  rootMargin = '0px',
  threshold = 0,
  triggerOnce = false
}: UseInViewProps = {}) {
  const [inView, setInView] = useState(false);
  const [hasTriggered, setHasTriggered] = useState(false);
  const observedRef = useRef<Element | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const setRef = useCallback((node: Element | null) => {
    if (observedRef.current) {
      // Cleanup previous observer
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
      observedRef.current = null;
    }

    if (node) {
      observedRef.current = node;
    }
  }, []);

  // Set up intersection observer
  useEffect(() => {
    if (!observedRef.current || (triggerOnce && hasTriggered)) return;

    const observer = new IntersectionObserver(
      entries => {
        const [entry] = entries;
        const isVisible = entry.isIntersecting;

        setInView(isVisible);

        if (isVisible && triggerOnce) {
          setHasTriggered(true);
          // Disconnect if we only need to trigger once
          observer.disconnect();
        }
      },
      { root, rootMargin, threshold }
    );

    observerRef.current = observer;

    if (observedRef.current) {
      observer.observe(observedRef.current);
    }

    return () => {
      if (observer) {
        observer.disconnect();
      }
    };
  }, [root, rootMargin, threshold, triggerOnce, hasTriggered]);

  return { ref: setRef, inView, observedRef };
}

