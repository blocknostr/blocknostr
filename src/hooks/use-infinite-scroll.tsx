
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
  // Add cooldown mechanism
  const cooldownTimerRef = useRef<number | null>(null);
  
  // Track scroll velocity for predictive loading
  const lastScrollY = useRef<number>(0);
  const lastScrollTime = useRef<number>(0);
  const scrollVelocity = useRef<number>(0);
  
  // Get actual threshold based on aggressiveness setting
  const getActualThreshold = useCallback(() => {
    switch(aggressiveness) {
      case 'low': return 400; // Reduced from 600
      case 'high': return 800; // Reduced from 1200
      case 'medium':
      default: return threshold;
    }
  }, [aggressiveness, threshold]);

  // Update scroll velocity tracking with throttling
  useEffect(() => {
    let scrollThrottleTimer: number | null = null;
    
    const trackScrollVelocity = () => {
      // Throttle scroll calculations to avoid excessive processing
      if (scrollThrottleTimer !== null) return;
      
      scrollThrottleTimer = window.setTimeout(() => {
        const now = Date.now();
        const timeDiff = now - lastScrollTime.current;
        if (timeDiff > 0) {
          const currentScrollY = window.scrollY;
          const distance = Math.abs(currentScrollY - lastScrollY.current);
          scrollVelocity.current = distance / timeDiff; // pixels per ms
          
          lastScrollY.current = currentScrollY;
          lastScrollTime.current = now;
          
          // Only trigger preloading if scrolling quickly AND we're not in cooldown AND near bottom
          // Reduced aggressiveness by requiring higher velocity
          if (scrollVelocity.current > 1.0 && 
              !isFetchingRef.current && 
              !cooldownTimerRef.current &&
              hasMore && 
              !disabled &&
              window.innerHeight + window.scrollY > document.body.offsetHeight - getActualThreshold() * 1.2) {
            handleObserver([{ isIntersecting: true } as IntersectionObserverEntry]);
          }
        }
        scrollThrottleTimer = null;
      }, 100); // Throttle to 100ms
    };
    
    window.addEventListener('scroll', trackScrollVelocity, { passive: true });
    return () => {
      window.removeEventListener('scroll', trackScrollVelocity);
      if (scrollThrottleTimer !== null) {
        clearTimeout(scrollThrottleTimer);
      }
    };
  }, [hasMore, disabled, getActualThreshold]);

  const handleObserver = useCallback(
    async (entries: IntersectionObserverEntry[]) => {
      const [target] = entries;
      if (target?.isIntersecting && hasMore && !disabled && !isFetchingRef.current && !cooldownTimerRef.current) {
        isFetchingRef.current = true;
        setLoadingMore(true);
        
        try {
          await onLoadMore();
          // Completely removed scroll position restoration logic
        } finally {
          // Set cooldown timer to prevent rapid consecutive loads
          cooldownTimerRef.current = window.setTimeout(() => {
            cooldownTimerRef.current = null;
          }, 3000); // 3 second cooldown between load operations
          
          // Reset the fetching flag after a shorter delay
          setTimeout(() => {
            isFetchingRef.current = false;
            setLoadingMore(false);
          }, 500);
        }
      }
    },
    [onLoadMore, hasMore, disabled]
  );

  useEffect(() => {
    const actualThreshold = getActualThreshold();
    
    const options = {
      root: null,
      rootMargin: `0px 0px ${actualThreshold}px 0px`,
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
      if (cooldownTimerRef.current) {
        clearTimeout(cooldownTimerRef.current);
      }
    };
  }, [handleObserver, getActualThreshold, disabled]);

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
    loadingMore,
  };
};
