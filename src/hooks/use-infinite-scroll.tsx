
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
    threshold = 800, // Increased from 400 to 800
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
  
  // Store the document height before loading new content
  const prevDocumentHeightRef = useRef<number>(0);
  // Store the scroll position before loading new content
  const scrollPositionRef = useRef<number>(0);

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
        
        // Store current scroll position and document height before loading more content
        if (preservePosition) {
          scrollPositionRef.current = window.scrollY;
          prevDocumentHeightRef.current = document.body.scrollHeight;
        }
        
        try {
          await onLoadMore();
          
          // After new content is loaded, we need to adjust the scroll position
          if (preservePosition) {
            // Use requestAnimationFrame to ensure DOM has updated
            requestAnimationFrame(() => {
              // Calculate how much the document height has changed
              const newDocumentHeight = document.body.scrollHeight;
              const heightDifference = newDocumentHeight - prevDocumentHeightRef.current;
              
              // Only adjust if the height actually changed and we're not at the top
              if (heightDifference > 0 && scrollPositionRef.current > 0) {
                // Restore the scroll position plus the height difference
                window.scrollTo(0, scrollPositionRef.current + heightDifference);
                
                // Debug log
                console.log("[InfiniteScroll] Preserved scroll position:", {
                  before: scrollPositionRef.current,
                  after: scrollPositionRef.current + heightDifference,
                  heightDiff: heightDifference
                });
              }
            });
          }
        } finally {
          // Reset the fetching flag after a shorter delay (reduced from 500ms to 300ms)
          setTimeout(() => {
            isFetchingRef.current = false;
            setLoadingMore(false);
          }, 300);
        }
      }
    },
    [onLoadMore, hasMore, disabled, preservePosition]
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
