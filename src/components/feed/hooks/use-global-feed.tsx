
import { useState, useEffect, useCallback, useRef } from "react";
import { NostrEvent, nostrService } from "@/lib/nostr";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";
import { useFeedEvents } from "./use-feed-events";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { EventDeduplication } from "@/lib/nostr/utils/event-deduplication";
import { toast } from "sonner";

interface UseGlobalFeedProps {
  activeHashtag?: string;
}

export function useGlobalFeed({ activeHashtag }: UseGlobalFeedProps) {
  const { preferences } = useUserPreferences();
  const [since, setSince] = useState<number | undefined>(undefined);
  const [until, setUntil] = useState(Math.floor(Date.now() / 1000));
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadingRetry, setLoadingRetry] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const loadMoreTimeoutRef = useRef<number | null>(null);
  const isInitialLoadRef = useRef(true);
  const initialBatchSize = 30; // Increased from 20 to 30 for better first experience
  
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
    setEvents,
    cacheHit 
  } = useFeedEvents({
    since,
    until,
    hashtags,
    limit: initialBatchSize // Increased initial batch size
  });

  // Find the oldest event timestamp
  const findOldestEventTimestamp = useCallback(() => {
    if (events.length === 0) {
      return until - 24 * 60 * 60; // Default to 24 hours earlier if no events
    }

    // Find the oldest event by timestamp
    let oldestEvent = events[0];
    for (const event of events) {
      if (event.created_at < oldestEvent.created_at) {
        oldestEvent = event;
      }
    }
    return oldestEvent.created_at;
  }, [events, until]);
  
  const loadMoreEvents = useCallback(async () => {
    if (!events.length || loadingMore) return;
    
    setLoadingMore(true);
    
    // Cancel any existing timeout
    if (loadMoreTimeoutRef.current) {
      clearTimeout(loadMoreTimeoutRef.current);
      loadMoreTimeoutRef.current = null;
    }

    // Get the oldest post's timestamp
    const oldestTimestamp = findOldestEventTimestamp();
    
    // Safety check - don't go too far back in time
    const newUntil = oldestTimestamp - 1; // Slight offset to avoid duplicate events
    const newSince = Math.max(
      newUntil - 48 * 60 * 60, // Last 48 hours from oldest event
      until - 7 * 24 * 60 * 60  // Don't go more than a week back from initial query
    );
    
    console.log(`Loading more events: ${new Date(newSince*1000).toISOString()} to ${new Date(newUntil*1000).toISOString()}`);
    
    try {
      // Close previous subscription only after starting the new one
      const newSubId = setupSubscription(newSince, newUntil, hashtags);
      setSubId(newSubId);
      
      // Update timestamps for next pagination
      setSince(newSince);
      setUntil(newUntil);
      
      // Set a timeout to prevent infinite loading state
      loadMoreTimeoutRef.current = window.setTimeout(() => {
        setLoadingMore(false);
        loadMoreTimeoutRef.current = null;
        console.log("Load more timeout reached");
      }, 10000); // 10 second timeout as a fallback
    } catch (error) {
      console.error("Error loading more events:", error);
      setLoadingMore(false);
      toast.error("Failed to load more posts");
    }
  }, [events, findOldestEventTimestamp, hashtags, loadingMore, setupSubscription, setSubId, until]);
  
  const {
    loadMoreRef,
    loading,
    setLoading,
    hasMore,
    setHasMore,
    loadingMore: scrollLoadingMore
  } = useInfiniteScroll(loadMoreEvents, { 
    initialLoad: true,
    threshold: 1000, // Increased from 800 to 1000 for better responsiveness
    aggressiveness: 'medium',
    preservePosition: true
  });

  // Effect to detect when events load to automatically clear loading state
  useEffect(() => {
    // If we've loaded initial events, we can stop the loading state
    if (isInitialLoadRef.current && events.length > 0) {
      isInitialLoadRef.current = false;
      setLoading(false);
    }
    
    // If we're loading more, check if we've received new events
    if (loadingMore && events.length > 0) {
      // We likely got some events, clear the loading timeout
      if (loadMoreTimeoutRef.current) {
        clearTimeout(loadMoreTimeoutRef.current);
        loadMoreTimeoutRef.current = null;
      }
      
      // Give a small delay to allow more events to come in
      setTimeout(() => {
        setLoadingMore(false);
      }, 1000);
    }
    
    // If we have events and we're retrying, clear the retry state
    if (loadingRetry && events.length > 0) {
      setLoadingRetry(false);
    }
  }, [events, loadingMore, loadingRetry, setLoading]);

  // Initialize feed
  useEffect(() => {
    const initFeed = async () => {
      // Reset state
      setEvents([]);
      setHasMore(true);
      setLoading(true);
      isInitialLoadRef.current = true;
      setRetryCount(0);
      
      // Connect to relays first
      try {
        await nostrService.connectToUserRelays();
      } catch (error) {
        console.error("Error connecting to relays:", error);
        // Continue anyway, as partial connections may still work
      }

      // Reset the timestamp range for new subscription
      const currentTime = Math.floor(Date.now() / 1000);
      setSince(currentTime - 24 * 60 * 60); // Initial window is last 24 hours
      setUntil(currentTime);

      // Close previous subscription if exists
      if (subId) {
        nostrService.unsubscribe(subId);
      }
      
      // Start a new subscription with the appropriate hashtags
      const newSubId = setupSubscription(currentTime - 24 * 60 * 60, currentTime, hashtags);
      setSubId(newSubId);
      
      // Set a timeout to prevent infinite loading
      setTimeout(() => {
        // Only reset loading if we're still on initial load and haven't gotten any events
        if (isInitialLoadRef.current && loading) {
          setLoading(false);
          console.log("Initial loading timeout reached");
          
          // Automatically retry once if no events and not from cache
          if (events.length === 0 && !cacheHit && retryCount === 0) {
            console.log("No events received on initial load, retrying...");
            setRetryCount(prev => prev + 1);
            setLoadingRetry(true);
            
            // Clean up existing subscription
            if (subId) {
              nostrService.unsubscribe(subId);
            }
            
            // Try a slightly larger window for retry
            const retrySubId = setupSubscription(currentTime - 36 * 60 * 60, currentTime, hashtags);
            setSubId(retrySubId);
          }
        }
      }, 10000); // 10 second initial loading timeout
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
  }, [activeHashtag, hashtags, setupSubscription, setSubId, subId, cacheHit, retryCount, setHasMore, setLoading, setEvents, loading, events.length]);

  return {
    events,
    profiles,
    repostData,
    loadMoreRef,
    loading: loading || loadingRetry,
    hasMore,
    loadMoreEvents,
    loadingMore: loadingMore || scrollLoadingMore
  };
}
