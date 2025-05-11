
import { useEffect, useRef, useState, useCallback } from "react";

type UseInfiniteScrollOptions = {
  threshold?: number;
  initialLoad?: boolean;
  maintainScrollPosition?: boolean;
};

export const useInfiniteScroll = (
  onLoadMore: () => void,
  { threshold = 200, initialLoad = true, maintainScrollPosition = true }: UseInfiniteScrollOptions = {}
) => {
  const [loading, setLoading] = useState(initialLoad);
  const [hasMore, setHasMore] = useState(true);
  const observer = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const scrollPositionRef = useRef<number>(0);

  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [target] = entries;
      if (target.isIntersecting && hasMore && !loading) {
        // Store current scroll position before loading more
        if (maintainScrollPosition) {
          scrollPositionRef.current = window.scrollY;
        }
        
        setLoading(true);
        onLoadMore();
      }
    },
    [onLoadMore, hasMore, loading, maintainScrollPosition]
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
      if (observer.current) {
        observer.current.disconnect();
      }
    };
  }, [handleObserver, threshold]);

  // This effect restores scroll position after loading new content
  useEffect(() => {
    if (!loading && maintainScrollPosition && scrollPositionRef.current > 0) {
      window.scrollTo({
        top: scrollPositionRef.current,
        behavior: 'auto'
      });
    }
  }, [loading, maintainScrollPosition]);

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
    scrollPosition: scrollPositionRef.current,
  };
};
