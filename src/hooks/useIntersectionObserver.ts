
import { useEffect, useRef } from "react";

interface UseIntersectionObserverProps {
  target: React.RefObject<Element>;
  onIntersect: () => void;
  threshold?: number;
  rootMargin?: string;
  enabled?: boolean;
}

export function useIntersectionObserver({
  target,
  onIntersect,
  threshold = 0.1,
  rootMargin = "0px",
  enabled = true,
}: UseIntersectionObserverProps) {
  const savedCallback = useRef(onIntersect);

  // Remember the latest callback
  useEffect(() => {
    savedCallback.current = onIntersect;
  }, [onIntersect]);

  useEffect(() => {
    if (!enabled || !target.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            savedCallback.current();
          }
        });
      },
      {
        rootMargin,
        threshold,
      }
    );

    const element = target.current;
    observer.observe(element);

    return () => {
      if (element) {
        observer.unobserve(element);
      }
    };
  }, [target, enabled, rootMargin, threshold]);
}
