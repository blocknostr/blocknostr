
import { useEffect, useRef, useState, useCallback } from "react";

type UseInfiniteScrollOptions = {
  threshold?: number;
  initialLoad?: boolean;
  rootMargin?: string;
  debounceMs?: number;
};

export const useInfiniteScroll = (
  onLoadMore: () => void,
  { 
    threshold = 200, 
    initialLoad = true, 
    rootMargin = "0px 0px 300px 0px",
    debounceMs = 500
  }: UseInfiniteScrollOptions = {}
) => {
  const [loading, setLoading] = useState(initialLoad);
  const [hasMore, setHasMore] = useState(true);
  const observer = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced version of onLoadMore to prevent rapid firing
  const debouncedLoadMore = useCallback(() => {
    if (loading || !hasMore) return;
    
    // Clear any existing timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    
    // Set loading state immediately
    setLoading(true);
    
    // Set a debounce timer before actually loading
    timerRef.current = setTimeout(() => {
      onLoadMore();
    }, debounceMs);
  }, [onLoadMore, loading, hasMore, debounceMs]);

  // Handle intersection observer
  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [target] = entries;
      if (target.isIntersecting && hasMore && !loading) {
        debouncedLoadMore();
      }
    },
    [debouncedLoadMore, hasMore, loading]
  );

  // Setup the observer
  useEffect(() => {
    const options = {
      root: null,
      rootMargin, // Use configured rootMargin for better control
      threshold: 0.1, // Less sensitive threshold
    };

    observer.current = new IntersectionObserver(handleObserver, options);

    if (loadMoreRef.current) {
      observer.current.observe(loadMoreRef.current);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      
      if (observer.current) {
        observer.current.disconnect();
      }
    };
  }, [handleObserver, rootMargin]);

  // This is the function we're returning, which should match FeedList's prop type
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
