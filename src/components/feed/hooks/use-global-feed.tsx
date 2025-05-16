
import { useState, useEffect, useCallback, useRef } from "react";
import { nostrService } from "@/lib/nostr";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";
import { useFeedEvents } from "./use-feed-events";

interface UseGlobalFeedProps {
  activeHashtag?: string;
  defaultHashtags?: string[];
}

export function useGlobalFeed({ activeHashtag, defaultHashtags = [] }: UseGlobalFeedProps) {
  const [since, setSince] = useState<number | undefined>(undefined);
  const [until, setUntil] = useState(Math.floor(Date.now() / 1000));
  const [loadingMore, setLoadingMore] = useState(false);
  const loadMoreTimeoutRef = useRef<number | null>(null);
  
  // Determine which hashtags to use - prioritize activeHashtag if it exists
  const hashtagsToUse = activeHashtag ? [activeHashtag] : defaultHashtags;
  
  const { 
    events, 
    profiles, 
    repostData, 
    subId, 
    setSubId, 
    setupSubscription, 
    setEvents,
    refreshFeed
  } = useFeedEvents({
    since,
    until,
    activeHashtag: activeHashtag || undefined,
    hashtags: !activeHashtag && defaultHashtags.length > 0 ? defaultHashtags : undefined,
    limit: 20 // Reduced from 30 for better performance/bandwidth
  });
  
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
      // Get older posts from the last 48 hours instead of 72 for more reasonable loading
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
    threshold: 800, // Reduced from 1200 to 800 for less aggressive loading
    aggressiveness: 'medium', // Changed from 'high' to 'medium'
    preservePosition: true // Enable scroll position preservation
  });

  useEffect(() => {
    const initFeed = async () => {
      // Connect to relays
      await nostrService.connectToUserRelays();
      
      // Reset state when filter changes
      setEvents([]);
      setHasMore(true);
      setLoading(true);

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
      setLoading(false);
    };
    
    initFeed();
    
    // Setup listener for manual refresh requests from global event
    const handleRefreshRequest = () => {
      initFeed();
    };
    window.addEventListener('refetch-global-feed', handleRefreshRequest);
    
    // Cleanup subscription and timeout when component unmounts
    return () => {
      window.removeEventListener('refetch-global-feed', handleRefreshRequest);
      if (subId) {
        nostrService.unsubscribe(subId);
      }
      if (loadMoreTimeoutRef.current) {
        clearTimeout(loadMoreTimeoutRef.current);
      }
    };
  }, [activeHashtag, defaultHashtags]); // Added defaultHashtags as dependency

  // Mark the loading as finished when we get events
  useEffect(() => {
    if (events.length > 0 && loading) {
      setLoading(false);
    }
  }, [events, loading]);

  // Function to refresh the feed manually
  const refresh = useCallback(() => {
    // Reset state
    setEvents([]);
    setHasMore(true);
    setLoading(true);

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
    
    // If we have a refreshFeed implementation from useFeedEvents, use it
    if (refreshFeed) {
      refreshFeed();
    }
  }, [subId, setEvents, setHasMore, setLoading, setupSubscription, refreshFeed]);

  return {
    events,
    profiles,
    repostData,
    loadMoreRef,
    loading,
    hasMore,
    loadMoreEvents,
    loadingMore: loadingMore || scrollLoadingMore,
    refresh
  };
}
