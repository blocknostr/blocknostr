
import { useState, useEffect, useCallback, useRef } from "react";
import { nostrService } from "@/lib/nostr";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";
import { useFeedEvents } from "./use-feed-events";

interface UseGlobalFeedProps {
  activeHashtag?: string;
}

export function useGlobalFeed({ activeHashtag }: UseGlobalFeedProps) {
  const [since, setSince] = useState<number | undefined>(undefined);
  const [until, setUntil] = useState(Math.floor(Date.now() / 1000));
  const [loadingMore, setLoadingMore] = useState(false);
  const [eagerEvents, setEagerEvents] = useState<any[]>([]);
  const [partialLoaded, setPartialLoaded] = useState(false);
  const loadMoreTimeoutRef = useRef<number | null>(null);
  const initialLoadTimestampRef = useRef<number>(Date.now());
  const timedWindowsRef = useRef<{completed: boolean, running: boolean}>({
    completed: false,
    running: false
  });
  
  // Progressive time windows for better loading experience
  const timeWindows = [
    { hours: 6, label: 'recent' },    // Most recent 6 hours first
    { hours: 24, label: '24h' },      // Then last 24 hours
    { hours: 72, label: '3d' }        // Then last 3 days
  ];
  
  const { 
    events, 
    profiles, 
    repostData, 
    subId, 
    setSubId, 
    setupSubscription, 
    setEvents,
    cacheHit
  } = useFeedEvents({
    since,
    until,
    activeHashtag,
    limit: 15 // Reduced from 20 for even better initial performance/bandwidth
  });
  
  // Load different time windows progressively
  const loadTimeWindow = useCallback(async (windowIndex: number) => {
    if (windowIndex >= timeWindows.length || timedWindowsRef.current.completed) {
      timedWindowsRef.current.completed = true;
      timedWindowsRef.current.running = false;
      return;
    }
    
    timedWindowsRef.current.running = true;
    const currentTime = Math.floor(Date.now() / 1000);
    const window = timeWindows[windowIndex];
    const newSince = currentTime - (window.hours * 60 * 60);
    
    // Close previous subscription if exists
    if (subId) {
      nostrService.unsubscribe(subId);
    }
    
    // Set up new subscription with this window
    setSince(newSince);
    setUntil(currentTime);
    
    // Wait a bit before loading the next window
    setTimeout(() => {
      if (!timedWindowsRef.current.completed) {
        loadTimeWindow(windowIndex + 1);
      }
    }, 3000);
  }, [subId, timeWindows]);
  
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
      // Get older posts from the last 48 hours
      const newSince = newUntil - 48 * 60 * 60; 
      
      setSince(newSince);
      setUntil(newUntil);
      
      // Start the new subscription with the older timestamp range
      const newSubId = setupSubscription(newSince, newUntil);
      setSubId(newSubId);
    } else {
      // We already have a since value, so use it to get older posts
      const newUntil = since;
      // Get older posts from the last 48 hours for more reasonable loading
      const newSince = newUntil - 48 * 60 * 60;
      
      setSince(newSince);
      setUntil(newUntil);
      
      // Start the new subscription with the older timestamp range
      const newSubId = setupSubscription(newSince, newUntil);
      setSubId(newSubId);
    }
    
    // Set loading more to false after a delay
    loadMoreTimeoutRef.current = window.setTimeout(() => {
      setLoadingMore(false);
      loadMoreTimeoutRef.current = null;
    }, 2000); 
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
    aggressiveness: 'high', // Changed back to high for more proactive loading
    preservePosition: true // Enable scroll position preservation
  });

  // Implement eager loading for faster initial display
  useEffect(() => {
    // Save some events for eager loading
    if (events.length > 0 && loading) {
      setEagerEvents(events.slice(0, 5)); // Just show first 5 for eager loading
    }
    
    // Set partial loaded flag
    if (events.length > 0 && !cacheHit && !timedWindowsRef.current.completed) {
      setPartialLoaded(true);
    } else if (timedWindowsRef.current.completed || cacheHit) {
      setPartialLoaded(false);
    }
  }, [events, loading, cacheHit]);

  useEffect(() => {
    const initFeed = async () => {
      initialLoadTimestampRef.current = Date.now();
      // Reset time window tracking
      timedWindowsRef.current = { completed: false, running: false };
      setPartialLoaded(false);
      
      // Connect to best performing relays first
      await nostrService.connectToUserRelays();
      
      // Reset state when filter changes
      setEvents([]);
      setEagerEvents([]);
      setHasMore(true);
      setLoading(true);
      
      // Reset the timestamp range and start progressive loading
      if (!timedWindowsRef.current.running) {
        loadTimeWindow(0);
      }
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
    };
  }, [activeHashtag]);

  // Mark the loading as finished when we get events
  useEffect(() => {
    if (events.length > 0 && loading) {
      // If we get events within 1.5 seconds, finish loading early
      const timeSinceInit = Date.now() - initialLoadTimestampRef.current;
      if (timeSinceInit > 1500 || events.length >= 10) {
        setLoading(false);
      }
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
    eagerEvents,
    partialLoaded
  };
}
