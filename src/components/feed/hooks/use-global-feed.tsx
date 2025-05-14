
import { useState, useEffect, useCallback, useRef } from "react";
import { nostrService } from "@/lib/nostr";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";
import { useFeedEvents } from "./use-feed-events";
import { toast } from "sonner";
import { retry } from "@/lib/utils/retry";

interface UseGlobalFeedProps {
  activeHashtag?: string;
}

export function useGlobalFeed({ activeHashtag }: UseGlobalFeedProps) {
  const [since, setSince] = useState<number | undefined>(undefined);
  const [until, setUntil] = useState(Math.floor(Date.now() / 1000));
  const [loadingMore, setLoadingMore] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [isInitialLoadingTimeout, setIsInitialLoadingTimeout] = useState(true);
  const [isRetrying, setIsRetrying] = useState(false);
  const loadMoreTimeoutRef = useRef<number | null>(null);
  const minimumLoadingTimeRef = useRef<number | null>(null);
  
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
    activeHashtag,
    limit: 20 // Initial load of 20 posts
  });
  
  // Function to handle retrying when no posts are loaded
  const retryLoadingPosts = useCallback(async () => {
    if (events.length === 0 && !isRetrying && retryCount < 2) {
      setIsRetrying(true);
      
      // Close previous subscription
      if (subId) {
        nostrService.unsubscribe(subId);
      }
      
      // Create new subscription with slightly extended time range
      const currentTime = Math.floor(Date.now() / 1000);
      const threeWeeksAgo = currentTime - 24 * 60 * 60 * 21; // 3 weeks for retry
      
      setSince(threeWeeksAgo);
      setUntil(currentTime);
      
      // Start the new subscription with the extended timestamp range
      const newSubId = setupSubscription(threeWeeksAgo, currentTime);
      setSubId(newSubId);
      
      setRetryCount(prevCount => prevCount + 1);
      
      // End retry state after a delay
      setTimeout(() => setIsRetrying(false), 3000);
    }
  }, [events, isRetrying, retryCount, subId, setupSubscription]);
  
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
    initialLoad: true,
    threshold: 800, // Increased from 400 to 800 for earlier loading
    aggressiveness: 'high', // Set to high for the most aggressive loading
    preservePosition: true // Enable scroll position preservation
  });

  useEffect(() => {
    const initFeed = async () => {
      // Set initial loading timeout
      setIsInitialLoadingTimeout(true);
      
      // Set a minimum loading time (6 seconds) before showing empty state
      minimumLoadingTimeRef.current = window.setTimeout(() => {
        setIsInitialLoadingTimeout(false);
        minimumLoadingTimeRef.current = null;
      }, 6000);
      
      // Connect to relays
      await nostrService.connectToUserRelays();
      
      // Reset state when filter changes
      setEvents([]);
      setHasMore(true);
      setLoading(true);
      setRetryCount(0);

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
      if (minimumLoadingTimeRef.current) {
        clearTimeout(minimumLoadingTimeRef.current);
      }
    };
  }, [activeHashtag]);

  // Add the retry logic if no events after certain time
  useEffect(() => {
    // If we've been loading for some time but still have no events, retry with a longer timeframe
    if (!loading && events.length === 0 && !isRetrying && retryCount < 2) {
      const retryTimeout = window.setTimeout(() => {
        retryLoadingPosts();
      }, 5000); // Wait 5 seconds before retrying
      
      return () => clearTimeout(retryTimeout);
    }
  }, [loading, events.length, isRetrying, retryCount, retryLoadingPosts]);

  // Mark the loading as finished when we get events OR after a reasonable timeout
  useEffect(() => {
    if (events.length > 0 && loading) {
      setLoading(false);
    }
  }, [events, loading, setLoading]);

  return {
    events,
    profiles,
    repostData,
    loadMoreRef,
    loading,
    hasMore,
    loadMoreEvents,
    loadingMore: loadingMore || scrollLoadingMore,
    isInitialLoadingTimeout
  };
}
