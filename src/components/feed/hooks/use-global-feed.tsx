
import { useState, useEffect, useCallback, useRef } from "react";
import { NostrEvent, nostrService } from "@/lib/nostr";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";
import { useFeedEvents } from "./use-feed-events";

interface UseGlobalFeedProps {
  activeHashtag?: string;
  initialEvents?: NostrEvent[];
  initialProfiles?: Record<string, any>;
  initialRepostData?: Record<string, { pubkey: string, original: NostrEvent }>;
  initialHasMore?: boolean;
}

export function useGlobalFeed({ 
  activeHashtag,
  initialEvents = [],
  initialProfiles = {},
  initialRepostData = {},
  initialHasMore = true
}: UseGlobalFeedProps) {
  const [since, setSince] = useState<number | undefined>(undefined);
  const [until, setUntil] = useState(Math.floor(Date.now() / 1000));
  const [loadingMore, setLoadingMore] = useState(false);
  const [minLoadingTimeMet, setMinLoadingTimeMet] = useState(false);
  const [retryAttempt, setRetryAttempt] = useState(0);
  const loadMoreTimeoutRef = useRef<number | null>(null);
  const minLoadingTimeRef = useRef<number | null>(null);
  
  // If we're provided with initial state, use it
  const initialState = initialEvents.length > 0;
  
  const { 
    events, 
    profiles, 
    repostData, 
    subId, 
    setSubId, 
    setupSubscription, 
    setEvents,
    refreshFeed,
    setProfiles,
    repostData: hookRepostData
  } = useFeedEvents({
    since,
    until,
    activeHashtag,
    limit: 20, // Initial load of 20 posts
    initialEvents: initialEvents,
    initialProfiles: initialProfiles,
    initialRepostData: initialRepostData
  });
  
  // Function to retry loading posts with exponential backoff
  const retryLoadPosts = useCallback(() => {
    if (retryAttempt >= 2 || events.length > 0) return; // Max 3 attempts (0, 1, 2)
    
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
      // Get older posts from the last 48 hours instead of 24 for more aggressive loading
      const newSince = newUntil - 48 * 60 * 60; 
      
      setSince(newSince);
      setUntil(newUntil);
      
      // Start the new subscription with the older timestamp range
      const newSubId = setupSubscription(newSince, newUntil);
      setSubId(newSubId);
    } else {
      // We already have a since value, so use it to get older posts
      const newUntil = since;
      // Get older posts from the last 48 hours instead of 24 for more aggressive loading
      const newSince = newUntil - 48 * 60 * 60;
      
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
    }, 1500);  // Reduced from 2000ms to 1500ms
  }, [subId, events, since, until, setupSubscription, loadingMore]);
  
  const {
    loadMoreRef,
    loading,
    setLoading,
    hasMore,
    setHasMore,
    loadingMore: scrollLoadingMore
  } = useInfiniteScroll(loadMoreEvents, { 
    initialLoad: !initialState, // Only do initial load if we don't have cached data
    threshold: 800,
    aggressiveness: 'high',
    preservePosition: true
  });

  // Set up minimum loading time of 6 seconds
  useEffect(() => {
    if (!initialState) {
      // Set minimum loading time for better UX
      minLoadingTimeRef.current = window.setTimeout(() => {
        setMinLoadingTimeMet(true);
      }, 6000); // 6 second minimum loading time
    } else {
      // If we have initial state, we can consider minimum loading time met
      setMinLoadingTimeMet(true);
    }
    
    return () => {
      if (minLoadingTimeRef.current) {
        clearTimeout(minLoadingTimeRef.current);
      }
    };
  }, [activeHashtag, initialState]);

  useEffect(() => {
    const initFeed = async () => {
      // If we already have cached data, don't reload everything
      if (initialState) {
        setHasMore(initialHasMore || true);
        setLoading(false);
        return;
      }
      
      // Connect to relays
      await nostrService.connectToUserRelays();
      
      // Reset state when filter changes
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
      
      // Start a new subscription
      const newSubId = setupSubscription(currentTime - 24 * 60 * 60, currentTime);
      setSubId(newSubId);
    };
    
    initFeed();
    
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
    };
  }, [activeHashtag, initialState]);

  // Schedule retries if no events are loaded yet
  useEffect(() => {
    if (events.length === 0 && loading && minLoadingTimeMet && !initialState) {
      const retryTimeout = setTimeout(() => {
        retryLoadPosts();
      }, 3000 + retryAttempt * 2000); // Exponential backoff
      
      return () => clearTimeout(retryTimeout);
    }
  }, [events.length, loading, minLoadingTimeMet, retryAttempt, retryLoadPosts, initialState]);

  // Only turn off loading when we have events or minimum loading time has elapsed
  useEffect(() => {
    if ((events.length > 0 || (minLoadingTimeMet && retryAttempt >= 2)) && loading) {
      setLoading(false);
    }
  }, [events, loading, minLoadingTimeMet, retryAttempt]);

  return {
    events,
    profiles,
    repostData: { ...repostData, ...hookRepostData },
    loadMoreRef,
    loading,
    hasMore,
    loadMoreEvents,
    loadingMore: loadingMore || scrollLoadingMore,
    minLoadingTimeMet,
    setEvents,
    setProfiles,
    setRepostData: () => {}, // This is populated from the hook
  };
}
