
import { useState, useEffect, useCallback, useRef } from "react";
import { nostrService } from "@/lib/nostr";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";
import { useFeedEvents } from "./use-feed-events";
import { useUserPreferences } from "@/hooks/useUserPreferences";

interface UseGlobalFeedProps {
  activeHashtag?: string;
}

export function useGlobalFeed({ activeHashtag }: UseGlobalFeedProps) {
  const { preferences } = useUserPreferences();
  const [since, setSince] = useState<number | undefined>(undefined);
  const [until, setUntil] = useState(Math.floor(Date.now() / 1000));
  const [loadingMore, setLoadingMore] = useState(false);
  const loadMoreTimeoutRef = useRef<number | null>(null);
  
  // Get the hashtags to filter by - either the active hashtag or the default ones
  const hashtags = activeHashtag 
    ? [activeHashtag] 
    : preferences.feedFilters.globalFeedTags;
  
  const { 
    events, 
    profiles, 
    repostData, 
    subId, 
    setSubId, 
    setupSubscription, 
    setEvents 
  } = useFeedEvents({
    since,
    until,
    hashtags,
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
      const newSubId = setupSubscription(newSince, newUntil, hashtags);
      setSubId(newSubId);
    } else {
      // We already have a since value, so use it to get older posts
      const newUntil = since;
      // Get older posts from the last 48 hours for more reasonable loading
      const newSince = newUntil - 48 * 60 * 60;
      
      setSince(newSince);
      setUntil(newUntil);
      
      // Start the new subscription with the older timestamp range
      const newSubId = setupSubscription(newSince, newUntil, hashtags);
      setSubId(newSubId);
    }
    
    // Set loading more to false after a delay
    loadMoreTimeoutRef.current = window.setTimeout(() => {
      setLoadingMore(false);
      loadMoreTimeoutRef.current = null;
    }, 2000); 
  }, [subId, events, since, until, setupSubscription, loadingMore, hashtags]);
  
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
      
      // Start a new subscription with the appropriate hashtags
      const newSubId = setupSubscription(currentTime - 24 * 60 * 60, currentTime, hashtags);
      setSubId(newSubId);
      setLoading(false);
    };
    
    initFeed();
    
    // Listen for refetch events
    const handleRefetch = () => {
      initFeed();
    };
    
    window.addEventListener('refetch-global-feed', handleRefetch);
    
    // Cleanup subscription and timeout when component unmounts
    return () => {
      if (subId) {
        nostrService.unsubscribe(subId);
      }
      if (loadMoreTimeoutRef.current) {
        clearTimeout(loadMoreTimeoutRef.current);
      }
      window.removeEventListener('refetch-global-feed', handleRefetch);
    };
  }, [activeHashtag, hashtags]);

  // Mark the loading as finished when we get events
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
    loadingMore: loadingMore || scrollLoadingMore
  };
}
