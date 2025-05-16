
import { useEffect, useRef, useState, useCallback } from "react";

type UseInfiniteScrollOptions = {
  threshold?: number;
  initialLoad?: boolean;
  disabled?: boolean;
  aggressiveness?: 'low' | 'medium' | 'high';
  preservePosition?: boolean;
};

export const useInfiniteScroll = (
  onLoadMore: () => void,
  { 
    threshold = 800,
    initialLoad = true, 
    disabled = false,
    aggressiveness = 'medium',
    preservePosition = true
  }: UseInfiniteScrollOptions = {}
) => {
  const [loading, setLoading] = useState(initialLoad);
  const [hasMore, setHasMore] = useState(true);
  const observer = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  // Track if we're currently fetching more items
  const isFetchingRef = useRef(false);
  // Track scroll velocity for predictive loading
  const lastScrollY = useRef<number>(0);
  const lastScrollTime = useRef<number>(0);
  const scrollVelocity = useRef<number>(0);
  
  // Get actual threshold based on aggressiveness setting
  const getActualThreshold = useCallback(() => {
    switch(aggressiveness) {
      case 'low': return 600;
      case 'high': return 1200;
      case 'medium':
      default: return threshold;
    }
  }, [aggressiveness, threshold]);

  // Update scroll velocity tracking
  useEffect(() => {
    const trackScrollVelocity = () => {
      const now = Date.now();
      const timeDiff = now - lastScrollTime.current;
      if (timeDiff > 0) {
        const currentScrollY = window.scrollY;
        const distance = Math.abs(currentScrollY - lastScrollY.current);
        scrollVelocity.current = distance / timeDiff; // pixels per ms
        
        lastScrollY.current = currentScrollY;
        lastScrollTime.current = now;
        
        // If scrolling quickly and near bottom, preload more aggressively
        if (scrollVelocity.current > 0.5 && 
            window.innerHeight + window.scrollY > document.body.offsetHeight - getActualThreshold() * 1.5) {
          if (!isFetchingRef.current && hasMore && !disabled) {
            handleObserver([{ isIntersecting: true } as IntersectionObserverEntry]);
          }
        }
      }
    };
    
    window.addEventListener('scroll', trackScrollVelocity, { passive: true });
    return () => {
      window.removeEventListener('scroll', trackScrollVelocity);
    };
  }, [hasMore, disabled, getActualThreshold]);

  const handleObserver = useCallback(
    async (entries: IntersectionObserverEntry[]) => {
      const [target] = entries;
      if (target?.isIntersecting && hasMore && !disabled && !isFetchingRef.current) {
        isFetchingRef.current = true;
        setLoadingMore(true);
        console.log("[useInfiniteScroll] Intersection detected, loading more...");
        
        try {
          await onLoadMore();
          // Debug output for verification
          console.log("[useInfiniteScroll] onLoadMore completed");
        } catch (error) {
          console.error("[useInfiniteScroll] Error in onLoadMore:", error);
        } finally {
          // CRITICAL FIX: Use a longer timeout to allow more time for data to arrive
          setTimeout(() => {
            console.log("[useInfiniteScroll] Resetting loading flags");
            isFetchingRef.current = false;
            setLoadingMore(false);
          }, 5000); // Increased from 300ms to 5000ms to prevent rapid retriggering
        }
      }
    },
    [onLoadMore, hasMore, disabled]
  );

  useEffect(() => {
    const actualThreshold = getActualThreshold();
    console.log("[useInfiniteScroll] Setting up observer with threshold:", actualThreshold);
    
    const options = {
      root: null,
      rootMargin: `0px 0px ${actualThreshold}px 0px`,
      threshold: 0.1,
    };

    observer.current = new IntersectionObserver(handleObserver, options);

    if (loadMoreRef.current && !disabled) {
      observer.current.observe(loadMoreRef.current);
      console.log("[useInfiniteScroll] Observer attached to load more element");
    }

    return () => {
      if (observer.current) {
        observer.current.disconnect();
        console.log("[useInfiniteScroll] Observer disconnected");
      }
    };
  }, [handleObserver, getActualThreshold, disabled]);

  // This is the function we're returning, which should match FeedList's prop type
  const setLoadMoreRef = useCallback((node: HTMLDivElement | null) => {
    if (node !== loadMoreRef.current) {
      console.log("[useInfiniteScroll] Load more ref element changed");
      loadMoreRef.current = node;
      
      if (observer.current) {
        observer.current.disconnect(); // Disconnect from old element
      }
      
      if (node && observer.current && !disabled) {
        observer.current.observe(node);
        console.log("[useInfiniteScroll] Observer attached to new load more element");
      }
    }
  }, [disabled]);

  return {
    loadMoreRef: setLoadMoreRef,
    loading,
    setLoading,
    hasMore,
    setHasMore,
    loadingMore,
  };
};
