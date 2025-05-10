import { useEffect, useRef, useState, useCallback } from "react";

type UseInfiniteScrollOptions = {
  threshold?: number;
  initialLoad?: boolean;
  debounce?: number;
};

export const useInfiniteScroll = (
  onLoadMore: () => void,
  { threshold = 300, initialLoad = true, debounce = 500 }: UseInfiniteScrollOptions = {}
) => {
  const [loading, setLoading] = useState(initialLoad);
  const [hasMore, setHasMore] = useState(true);
  const observer = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const loadingRef = useRef(loading);

  // Keep the ref up to date with the state
  loadingRef.current = loading;

  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [target] = entries;
      
      // If target is intersecting and we have more content and we're not already loading
      if (target.isIntersecting && hasMore && !loadingRef.current) {
        setLoading(true);
        
        // Clear any existing timeout
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        
        // Debounce load more calls to prevent multiple rapid calls
        timeoutRef.current = setTimeout(() => {
          onLoadMore();
        }, debounce);
      }
    },
    [onLoadMore, hasMore, debounce]
  );

  useEffect(() => {
    const options = {
      root: null,
      rootMargin: `0px 0px ${threshold}px 0px`,
      threshold: 0.1,
    };

    observer.current = new IntersectionObserver(handleObserver, options);

    if (loadMoreRef.current) {
      observer.current.observe(loadMoreRef.current);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      if (observer.current) {
        observer.current.disconnect();
      }
    };
  }, [handleObserver, threshold]);

  const setLoadMoreRef = useCallback((node: HTMLDivElement | null) => {
    loadMoreRef.current = node;
    if (node && observer.current) {
      observer.current.observe(node);
    }
  }, []);

  return {
    loadMoreRef: setLoadMoreRef,
    loading,
    setLoading,
    hasMore,
    setHasMore,
  };
};
