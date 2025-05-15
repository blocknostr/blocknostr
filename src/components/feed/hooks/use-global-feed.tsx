
import { useState, useEffect, useCallback, useRef } from "react";
import { nostrService } from "@/lib/nostr";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";
import { useFeedEvents } from "./use-feed-events";

interface UseGlobalFeedProps {
  activeHashtag?: string;
}

// Progressive time window constants
const TIME_WINDOWS = {
  INITIAL: 12 * 60 * 60, // 12 hours for initial fast load
  SECOND: 24 * 60 * 60,  // 24 hours (1 day)
  THIRD: 48 * 60 * 60,   // 48 hours (2 days)
  FOURTH: 7 * 24 * 60 * 60 // 1 week for deep historical content
};

// Smaller batch size for faster initial loading
const INITIAL_BATCH_SIZE = 15;

export function useGlobalFeed({ activeHashtag }: UseGlobalFeedProps) {
  const [since, setSince] = useState<number | undefined>(undefined);
  const [until, setUntil] = useState(Math.floor(Date.now() / 1000));
  const [loadingMore, setLoadingMore] = useState(false);
  const [timeWindowExpansion, setTimeWindowExpansion] = useState(0); // Track which time window we're on
  const [earlyEventsLoaded, setEarlyEventsLoaded] = useState(false); // Track if we have any events for immediate display
  const loadMoreTimeoutRef = useRef<number | null>(null);
  const parallelLoadRef = useRef<boolean>(false);
  
  const { 
    events, 
    profiles, 
    repostData, 
    subId, 
    setSubId, 
    setupSubscription, 
    setEvents,
    cacheHit,
    isRetrying
  } = useFeedEvents({
    since,
    until,
    activeHashtag,
    limit: INITIAL_BATCH_SIZE, // Reduced from 20 to 15 for better initial performance
    feedType: activeHashtag ? `hashtag-${activeHashtag}` : 'global'
  });
  
  // Handle parallel loading for better content discovery
  useEffect(() => {
    // If we already have some events and aren't already doing a parallel load
    if (events.length > 3 && !parallelLoadRef.current && !earlyEventsLoaded) {
      parallelLoadRef.current = true;
      setEarlyEventsLoaded(true);
      
      // Start a parallel subscription for a bit more historical data while user reads current content
      const currentTime = Math.floor(Date.now() / 1000);
      const parallelSince = currentTime - TIME_WINDOWS.SECOND; // Look back further
      const parallelUntil = currentTime - TIME_WINDOWS.INITIAL; // Start where initial window ends
      
      // Setup subscription in the background
      const parallelSubId = setupSubscription(parallelSince, parallelUntil);
      
      // Clean up the parallel subscription after some time
      setTimeout(() => {
        if (parallelSubId) {
          nostrService.unsubscribe(parallelSubId);
        }
        parallelLoadRef.current = false;
      }, 10000); // 10 seconds should be enough to get some additional events
    }
  }, [events, earlyEventsLoaded, setupSubscription]);
  
  const loadMoreEvents = useCallback(async () => {
    if (!subId || loadingMore) return;
    setLoadingMore(true);
    
    // Cancel any existing timeout
    if (loadMoreTimeoutRef.current) {
      clearTimeout(loadMoreTimeoutRef.current);
    }
    
    // Close previous subscription
    if (subId) {
      nostrService.unsubscribe(subId);
    }

    // Create new subscription with progressively larger time windows
    if (!since) {
      // First load - determine the next time window based on expansion level
      let timeWindow;
      let newTimeWindowExpansion = timeWindowExpansion;
      
      // Determine which time window to use next
      switch (timeWindowExpansion) {
        case 0:
          timeWindow = TIME_WINDOWS.SECOND; // 24 hours
          newTimeWindowExpansion = 1;
          break;
        case 1:
          timeWindow = TIME_WINDOWS.THIRD; // 48 hours
          newTimeWindowExpansion = 2;
          break;
        default:
          timeWindow = TIME_WINDOWS.FOURTH; // 1 week
          newTimeWindowExpansion = 3;
      }
      
      setTimeWindowExpansion(newTimeWindowExpansion);
      
      // Get the oldest post timestamp
      const oldestEvent = events.length > 0 ? 
        events.reduce((oldest, current) => oldest.created_at < current.created_at ? oldest : current) : 
        null;
      
      const newUntil = oldestEvent ? oldestEvent.created_at - 1 : until - TIME_WINDOWS.INITIAL;
      const newSince = newUntil - timeWindow;
      
      setSince(newSince);
      setUntil(newUntil);
      
      // Start the new subscription with the progressively larger timestamp range
      const newSubId = setupSubscription(newSince, newUntil);
      setSubId(newSubId);
    } else {
      // We already have a since value, so just expand the window further back
      const newUntil = since;
      
      // Determine time window based on expansion level
      let timeWindow;
      switch (timeWindowExpansion) {
        case 1:
          timeWindow = TIME_WINDOWS.SECOND; // 24h
          break;
        case 2:
          timeWindow = TIME_WINDOWS.THIRD; // 48h
          break;
        default:
          timeWindow = TIME_WINDOWS.FOURTH; // 1 week
      }
      
      const newSince = newUntil - timeWindow;
      
      setSince(newSince);
      setUntil(newUntil);
      
      // Start the new subscription with the older timestamp range
      const newSubId = setupSubscription(newSince, newUntil);
      setSubId(newSubId);
    }
    
    // Set loading more to false after a shorter delay (2s instead of previous longer timeouts)
    loadMoreTimeoutRef.current = window.setTimeout(() => {
      setLoadingMore(false);
      loadMoreTimeoutRef.current = null;
    }, 2000); 
  }, [subId, events, since, until, setupSubscription, loadingMore, timeWindowExpansion]);
  
  const {
    loadMoreRef,
    loading,
    setLoading,
    hasMore,
    setHasMore,
    loadingMore: scrollLoadingMore
  } = useInfiniteScroll(loadMoreEvents, { 
    initialLoad: true,
    threshold: 600, // Reduced from 800 for more responsive loading
    aggressiveness: 'medium',
    preservePosition: true
  });

  useEffect(() => {
    const initFeed = async () => {
      // Connect to relays - use optimized relay selection
      await nostrService.connectToUserRelays();
      
      // Reset state when filter changes
      setEvents([]);
      setHasMore(true);
      setLoading(true);
      setEarlyEventsLoaded(false);
      setTimeWindowExpansion(0);

      // Reset the timestamp range for new subscription - start with smaller window
      const currentTime = Math.floor(Date.now() / 1000);
      setSince(undefined);
      setUntil(currentTime);

      // Close previous subscription if exists
      if (subId) {
        nostrService.unsubscribe(subId);
      }
      
      // Start a new subscription with initial smaller window (12h)
      const initialSince = currentTime - TIME_WINDOWS.INITIAL; // 12 hours
      const newSubId = setupSubscription(initialSince, currentTime);
      setSubId(newSubId);
      
      // Set timeout to reduce initial loading wait time to 3 seconds
      setTimeout(() => {
        if (events.length === 0) {
          setLoading(false);
        }
      }, 3000); // Reduced from 7000 to 3000ms
    };
    
    // Listen for refresh events
    const handleRefresh = () => {
      initFeed();
    };
    
    window.addEventListener('refetch-global-feed', handleRefresh);
    
    initFeed();
    
    // Cleanup subscription and timeout when component unmounts
    return () => {
      if (subId) {
        nostrService.unsubscribe(subId);
      }
      if (loadMoreTimeoutRef.current) {
        clearTimeout(loadMoreTimeoutRef.current);
      }
      window.removeEventListener('refetch-global-feed', handleRefresh);
    };
  }, [activeHashtag]);

  // Mark the loading as finished when we get events - more eagerly now
  useEffect(() => {
    if (events.length > 0 && loading) {
      setLoading(false);
    }
  }, [events, loading]);

  return {
    events,
    profiles,
    repostData,
    loadMoreRef,
    loading,
    hasMore,
    loadMoreEvents,
    loadingMore: loadingMore || scrollLoadingMore,
    // Add new properties for optimization
    earlyEventsLoaded,
    cacheHit,
    isRetrying
  };
}
