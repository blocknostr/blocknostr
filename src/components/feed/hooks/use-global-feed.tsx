
import { useState, useEffect, useCallback, useRef } from "react";
import { nostrService } from "@/lib/nostr";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";
import { useFeedEvents } from "./use-feed-events";
import { cacheManager } from "@/lib/utils/cacheManager";

interface UseGlobalFeedProps {
  activeHashtag?: string;
}

export function useGlobalFeed({ activeHashtag }: UseGlobalFeedProps) {
  const [since, setSince] = useState<number | undefined>(undefined);
  const [until, setUntil] = useState(Math.floor(Date.now() / 1000));
  const [loadingMore, setLoadingMore] = useState(false);
  const [minLoadingTimeMet, setMinLoadingTimeMet] = useState(false);
  const [retryAttempt, setRetryAttempt] = useState(0);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const loadMoreTimeoutRef = useRef<number | null>(null);
  const minLoadingTimeRef = useRef<number | null>(null);
  const mountTimeRef = useRef<number>(Date.now());
  
  const { 
    events, 
    profiles, 
    repostData, 
    subId, 
    setSubId, 
    setupSubscription, 
    setEvents,
    refreshFeed,
    cacheHit 
  } = useFeedEvents({
    since,
    until,
    activeHashtag,
    limit: 25, // Increased from 20 for better initial load experience
    feedType: 'global'
  });
  
  // Function to retry loading posts with exponential backoff
  const retryLoadPosts = useCallback(() => {
    if (retryAttempt >= 3 || events.length > 0) return; // Max 4 attempts (0, 1, 2, 3)
    
    const newRetryAttempt = retryAttempt + 1;
    setRetryAttempt(newRetryAttempt);
    
    // Close previous subscription
    if (subId) {
      nostrService.unsubscribe(subId);
    }
    
    // Set up a new subscription with a larger time window for each retry
    const currentTime = Math.floor(Date.now() / 1000);
    const timeWindow = 24 * 60 * 60 * (newRetryAttempt + 1); // Increase time window with each retry
    const newSince = currentTime - timeWindow;
    
    console.log(`Retry attempt ${newRetryAttempt}: Fetching posts from the last ${timeWindow / (24 * 60 * 60)} days`);
    
    setSince(undefined);
    setUntil(currentTime);
    
    const newSubId = setupSubscription(newSince, currentTime);
    setSubId(newSubId);
  }, [retryAttempt, events.length, subId, setupSubscription]);
  
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

    // Create new subscription with older timestamp range
    if (!since) {
      // If no since value yet, get the oldest post timestamp
      const oldestEvent = events.length > 0 ? 
        events.reduce((oldest, current) => oldest.created_at < current.created_at ? oldest : current) : 
        null;
      
      const newUntil = oldestEvent ? oldestEvent.created_at - 1 : until - 24 * 60 * 60;
      // Get older posts from the last 72 hours instead of 48 for more aggressive loading
      const newSince = newUntil - 72 * 60 * 60; 
      
      setSince(newSince);
      setUntil(newUntil);
      
      // Start the new subscription with the older timestamp range
      const newSubId = setupSubscription(newSince, newUntil);
      setSubId(newSubId);
    } else {
      // We already have a since value, so use it to get older posts
      const newUntil = since;
      // Get older posts from the last 72 hours instead of 48 for more aggressive loading
      const newSince = newUntil - 72 * 60 * 60;
      
      setSince(newSince);
      setUntil(newUntil);
      
      // Start the new subscription with the older timestamp range
      const newSubId = setupSubscription(newSince, newUntil);
      setSubId(newSubId);
    }
    
    // Set loading more to false after a shorter delay to be more responsive
    loadMoreTimeoutRef.current = window.setTimeout(() => {
      setLoadingMore(false);
      loadMoreTimeoutRef.current = null;
    }, 1200);  // Reduced from 1500ms to 1200ms
  }, [subId, events, since, until, setupSubscription, loadingMore]);
  
  const {
    loadMoreRef,
    loading,
    setLoading,
    hasMore,
    setHasMore,
    loadingMore: scrollLoadingMore
  } = useInfiniteScroll(loadMoreEvents, { 
    initialLoad: true,
    threshold: 800,
    aggressiveness: 'high',
    preservePosition: true
  });

  // Cache scroll position for this feed
  const cacheScrollPosition = useCallback(() => {
    if (typeof window !== 'undefined') {
      const scrollY = window.scrollY;
      sessionStorage.setItem('global_feed_scroll_position', scrollY.toString());
    }
  }, []);
  
  // Restore scroll position if returning within a short time
  const restoreScrollPosition = useCallback(() => {
    if (typeof window !== 'undefined' && !isFirstLoad) {
      const cachedPosition = sessionStorage.getItem('global_feed_scroll_position');
      if (cachedPosition) {
        const position = parseInt(cachedPosition, 10);
        window.scrollTo({ top: position });
      }
    }
    setIsFirstLoad(false);
  }, [isFirstLoad]);

  // Set up minimum loading time (reduced from 6 to 2.5 seconds)
  useEffect(() => {
    // Set minimum loading time for better UX
    minLoadingTimeRef.current = window.setTimeout(() => {
      setMinLoadingTimeMet(true);
    }, 2500); // 2.5 second minimum loading time (reduced from 6s)
    
    return () => {
      if (minLoadingTimeRef.current) {
        clearTimeout(minLoadingTimeRef.current);
      }
    };
  }, [activeHashtag]);

  // Save scroll position when unmounting
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        cacheScrollPosition();
      }
    };
    
    window.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      cacheScrollPosition();
    };
  }, [cacheScrollPosition]);

  // Main effect to initialize the feed
  useEffect(() => {
    const initFeed = async () => {
      mountTimeRef.current = Date.now();
      
      // Connect to relays
      await nostrService.connectToUserRelays();
      
      // Reset state when filter changes
      if (!cacheHit) {
        setEvents([]);
      }
      setHasMore(true);
      setLoading(true);
      setMinLoadingTimeMet(false);
      setRetryAttempt(0);

      // Reset the timestamp range for new subscription
      const currentTime = Math.floor(Date.now() / 1000);
      setSince(undefined);
      setUntil(currentTime);

      // Close previous subscription if exists
      if (subId) {
        nostrService.unsubscribe(subId);
      }
      
      // Start a new subscription - pull from the last 36 hours instead of 24
      const newSubId = setupSubscription(currentTime - 36 * 60 * 60, currentTime);
      setSubId(newSubId);
      
      // Check if we need to restore scroll position
      if (cacheHit) {
        setTimeout(restoreScrollPosition, 100);
      }
      
      // Prefetch some common profiles in the background to speed up rendering
      setTimeout(() => {
        const popularKeys = [
          "32e1827635450ebb3c5a7d12c1f8e7b2b514439ac10a67eef3d9fd9c5c68e245", // alby
          "3bf0c63fcb93463407af97a5e5ee64fa883d107ef9e558472c4eb9aaaefa459d" // jack
        ];
        
        popularKeys.forEach(key => {
          nostrService.getProfileByPubkey(key);
        });
      }, 500);
    };
    
    initFeed();
    
    // Background refresh interval - check for new posts every 30 seconds
    let backgroundRefreshInterval: ReturnType<typeof setInterval>;
    const startBackgroundRefresh = () => {
      backgroundRefreshInterval = setInterval(() => {
        // Only refresh if we haven't refreshed in the last 5 minutes
        const lastRefresh = Number(cacheManager.get('global_feed_last_refresh') || '0');
        const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
        
        if (lastRefresh < fiveMinutesAgo && document.visibilityState !== 'hidden') {
          console.log("Background refresh: Checking for new posts");
          refreshFeed();
          cacheManager.set('global_feed_last_refresh', Date.now().toString());
        }
      }, 30000); // Every 30 seconds
    };
    
    // Start background refresh after initial load
    setTimeout(startBackgroundRefresh, 10000);
    
    // Cleanup subscription and timeout when component unmounts
    return () => {
      if (subId) {
        nostrService.unsubscribe(subId);
      }
      if (loadMoreTimeoutRef.current) {
        clearTimeout(loadMoreTimeoutRef.current);
      }
      if (minLoadingTimeRef.current) {
        clearTimeout(minLoadingTimeRef.current);
      }
      if (backgroundRefreshInterval) {
        clearInterval(backgroundRefreshInterval);
      }
      cacheScrollPosition();
    };
  }, [activeHashtag, cacheHit, setupSubscription, setEvents, setSubId, subId, setHasMore, setLoading, restoreScrollPosition, cacheScrollPosition, refreshFeed]);

  // Schedule retries if no events are loaded yet
  useEffect(() => {
    if (events.length === 0 && loading && minLoadingTimeMet) {
      const retryTimeout = setTimeout(() => {
        retryLoadPosts();
      }, 2000 + retryAttempt * 1500); // Faster exponential backoff
      
      return () => clearTimeout(retryTimeout);
    }
  }, [events.length, loading, minLoadingTimeMet, retryAttempt, retryLoadPosts]);

  // Only turn off loading when we have events or minimum loading time has elapsed
  useEffect(() => {
    if ((events.length > 0 || (minLoadingTimeMet && retryAttempt >= 2)) && loading) {
      setLoading(false);
      
      // Cache the timestamp when load completes
      if (events.length > 0) {
        cacheManager.set('global_feed_last_refresh', Date.now().toString());
      }
      
      // Check how long the initial load took
      const loadTime = Date.now() - mountTimeRef.current;
      if (events.length > 0 && loadTime < 1000) {
        console.log(`GlobalFeed loaded quickly (${loadTime}ms), likely from cache`);
      }
    }
  }, [events, loading, minLoadingTimeMet, retryAttempt]);

  return {
    events,
    profiles,
    repostData,
    loadMoreRef,
    loading,
    hasMore,
    loadMoreEvents,
    loadingMore: loadingMore || scrollLoadingMore,
    minLoadingTimeMet,
    refreshFeed
  };
}
