
import { useEffect, useRef, useState, useCallback } from "react";

type UseInfiniteScrollOptions = {
  threshold?: number;
  initialLoad?: boolean;
  disabled?: boolean;
};

export const useInfiniteScroll = (
  onLoadMore: () => void,
  { threshold = 200, initialLoad = true, disabled = false }: UseInfiniteScrollOptions = {}
) => {
  const [loading, setLoading] = useState(initialLoad);
  const [hasMore, setHasMore] = useState(true);
  const observer = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [target] = entries;
      if (target.isIntersecting && hasMore && !loading && !disabled) {
        setLoading(true);
        onLoadMore();
      }
    },
    [onLoadMore, hasMore, loading, disabled]
  );

  useEffect(() => {
    const options = {
      root: null,
      rootMargin: `0px 0px ${threshold}px 0px`,
      threshold: 0.1,
    };

    observer.current = new IntersectionObserver(handleObserver, options);

    if (loadMoreRef.current && !disabled) {
      observer.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observer.current) {
        observer.current.disconnect();
      }
    };
  }, [handleObserver, threshold, disabled]);

  // This is the function we're returning, which should match FeedList's prop type
  const setLoadMoreRef = useCallback((node: HTMLDivElement | null) => {
    loadMoreRef.current = node;
    if (node && observer.current && !disabled) {
      observer.current.observe(node);
    }
  }, [disabled]);

  return {
    loadMoreRef: setLoadMoreRef,
    loading,
    setLoading,
    hasMore,
    setHasMore,
  };
};
