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
  
  // Store visible post elements to use as anchors
  const visibleElementsRef = useRef<Element[]>([]);
  
  // Store the document height before loading new content
  const prevDocumentHeightRef = useRef<number>(0);
  // Store the scroll position before loading new content
  const scrollPositionRef = useRef<number>(0);
  // Store visual anchors position information
  const anchorInfoRef = useRef<{
    element: Element | null;
    relativeY: number;
    absoluteY: number;
  }>({
    element: null,
    relativeY: 0,
    absoluteY: 0
  });

  // Debounce function to limit how often a function can be called
  const debounce = useCallback((fn: Function, ms = 150) => {
    let timeoutId: ReturnType<typeof setTimeout>;
    return function(...args: any[]) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => fn.apply(null, args), ms);
    };
  }, []);

  // Get actual threshold based on aggressiveness setting
  const getActualThreshold = useCallback(() => {
    switch(aggressiveness) {
      case 'low': return 600;
      case 'high': return 1200;
      case 'medium':
      default: return threshold;
    }
  }, [aggressiveness, threshold]);
  
  // Find and save a reference to the most visible element for anchoring
  const updateVisualAnchor = useCallback(() => {
    if (!preservePosition) return;
    
    // Don't update anchors while loading to avoid position jumps
    if (isFetchingRef.current) return;
    
    // Get all post elements
    const postElements = document.querySelectorAll('[data-post-id]');
    if (postElements.length === 0) return;
    
    const viewportHeight = window.innerHeight;
    const scrollY = window.scrollY;
    
    let bestElement: Element | null = null;
    let bestVisibility = 0;
    
    // Find the element most visible in the viewport
    postElements.forEach((element) => {
      const rect = element.getBoundingClientRect();
      
      // Skip elements that are not in the viewport
      if (rect.bottom < 0 || rect.top > viewportHeight) return;
      
      // Calculate how much of the element is visible (0 to 1)
      const visibleTop = Math.max(0, rect.top);
      const visibleBottom = Math.min(viewportHeight, rect.bottom);
      const visibleHeight = Math.max(0, visibleBottom - visibleTop);
      const visibility = visibleHeight / rect.height;
      
      if (visibility > bestVisibility) {
        bestVisibility = visibility;
        bestElement = element;
      }
    });
    
    // If we found a good anchor element (at least 30% visible)
    if (bestElement && bestVisibility > 0.3) {
      const rect = bestElement.getBoundingClientRect();
      
      anchorInfoRef.current = {
        element: bestElement,
        relativeY: rect.top, // Position relative to viewport
        absoluteY: rect.top + scrollY // Absolute position in document
      };
      
      console.log('[InfiniteScroll] Updated anchor:', 
        bestElement.getAttribute('data-post-id'),
        `at position ${rect.top}px relative, ${anchorInfoRef.current.absoluteY}px absolute`
      );
    }
  }, [preservePosition]);

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
    
    // Use debounced version to update visual anchors while scrolling
    const debouncedAnchorUpdate = debounce(() => {
      updateVisualAnchor();
    }, 150);
    
    // Track scroll velocity with passive listener for performance
    window.addEventListener('scroll', trackScrollVelocity, { passive: true });
    
    // Update anchor points while scrolling (debounced)
    window.addEventListener('scroll', debouncedAnchorUpdate, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', trackScrollVelocity);
      window.removeEventListener('scroll', debouncedAnchorUpdate);
    };
  }, [hasMore, disabled, getActualThreshold, updateVisualAnchor, debounce]);

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
          
          // Update our anchor reference before loading
          updateVisualAnchor();
        }
        
        try {
          await onLoadMore();
          
          // After new content is loaded, we need to adjust the scroll position
          if (preservePosition) {
            // Use requestAnimationFrame to ensure DOM has updated
            requestAnimationFrame(() => {
              // First try to use the visual anchor if we have one
              if (anchorInfoRef.current.element) {
                const element = anchorInfoRef.current.element;
                const oldRelativeY = anchorInfoRef.current.relativeY;
                
                // Get the element's new position
                const newRect = element.getBoundingClientRect();
                const newRelativeY = newRect.top;
                
                // Calculate the difference in position
                const yDiff = newRelativeY - oldRelativeY;
                
                // Only adjust if the difference is significant
                if (Math.abs(yDiff) > 5) {
                  // Adjust the scroll position to keep the anchor at the same relative position
                  window.scrollTo({
                    top: window.scrollY + yDiff,
                    behavior: 'auto' // Use auto instead of smooth for immediate adjustment
                  });
                  
                  console.log('[InfiniteScroll] Restored position using anchor element, adjusted by', yDiff, 'px');
                }
              } 
              // Fall back to document height method if no anchor
              else {
                // Calculate how much the document height has changed
                const newDocumentHeight = document.body.scrollHeight;
                const heightDifference = newDocumentHeight - prevDocumentHeightRef.current;
                
                // Only adjust if the height actually changed and we're not at the top
                if (heightDifference > 0 && scrollPositionRef.current > 0) {
                  // Restore the scroll position plus the height difference
                  window.scrollTo(0, scrollPositionRef.current + heightDifference);
                  
                  console.log('[InfiniteScroll] Preserved scroll position:', {
                    before: scrollPositionRef.current,
                    after: scrollPositionRef.current + heightDifference,
                    heightDiff: heightDifference
                  });
                }
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
    [onLoadMore, hasMore, disabled, preservePosition, updateVisualAnchor]
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
