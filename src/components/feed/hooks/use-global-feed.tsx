
import { useState, useEffect, useCallback, useRef } from "react";
import { nostrService } from "@/lib/nostr";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";
import { useFeedEvents } from "./use-feed-events";
import { NostrEvent } from "@/lib/nostr/types";

interface UseGlobalFeedProps {
  activeHashtag?: string;
}

export function useGlobalFeed({ activeHashtag }: UseGlobalFeedProps) {
  const [since, setSince] = useState<number | undefined>(undefined);
  const [until, setUntil] = useState(Math.floor(Date.now() / 1000));
  const [loadingMore, setLoadingMore] = useState(false);
  const loadMoreTimeoutRef = useRef<number | null>(null);
  
  // Create our own state variables to manage feed lifecycle
  const [events, setEvents] = useState<NostrEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);

  const { 
    profiles, 
    repostData, 
    loadMoreRef,
    refreshFeed: refreshEventsFeed,
    connectionStatus
  } = useFeedEvents({
    since,
    until,
    activeHashtag,
    limit: 20 // Initial load of 20 posts
  });
  
  // Setup subscription helper function
  const setupSubscription = useCallback((fromTimestamp?: number, toTimestamp?: number) => {
    // Build filters
    const filters = [];
    
    const baseFilter = {
      kinds: [1, 6], // Note and repost kinds
      limit: 20,
    };
    
    if (fromTimestamp) {
      baseFilter.since = fromTimestamp;
    }
    
    if (toTimestamp) {
      baseFilter.until = toTimestamp;
    }
    
    // Add hashtag filter if needed
    if (activeHashtag) {
      baseFilter["#t"] = [activeHashtag];
    }
    
    // Subscribe to events
    const subId = nostrService.subscribe(
      filters,
      (event) => {
        // Process the incoming event
        setEvents(prevEvents => {
          // Check if we already have this event
          if (prevEvents.some(e => e.id === event.id)) {
            return prevEvents;
          }
          
          // Add to events and sort (newest first)
          return [...prevEvents, event]
            .sort((a, b) => b.created_at - a.created_at);
        });
        
        // Update status
        setLoading(false);
      }
    );
    
    return subId;
  }, [activeHashtag]);
  
  const loadMoreEvents = useCallback(async () => {
    if (loadingMore) return;
    setLoadingMore(true);
    
    // Cancel any existing timeout
    if (loadMoreTimeoutRef.current) {
      clearTimeout(loadMoreTimeoutRef.current);
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
      setupSubscription(newSince, newUntil);
    } else {
      // We already have a since value, so use it to get older posts
      const newUntil = since;
      // Get older posts from the last 48 hours instead of 24 for more aggressive loading
      const newSince = newUntil - 48 * 60 * 60;
      
      setSince(newSince);
      setUntil(newUntil);
      
      // Start the new subscription with the older timestamp range
      setupSubscription(newSince, newUntil);
    }
    
    // Set loading more to false after a shorter delay to be more responsive
    loadMoreTimeoutRef.current = window.setTimeout(() => {
      setLoadingMore(false);
      loadMoreTimeoutRef.current = null;
    }, 1500);  // Reduced from 2000ms to 1500ms
  }, [events, since, until, setupSubscription, loadingMore]);
  
  const {
    loadingMore: scrollLoadingMore
  } = useInfiniteScroll(loadMoreEvents, { 
    initialLoad: true,
    threshold: 800, // Increased from 400 to 800 for earlier loading
    aggressiveness: 'high', // Set to high for the most aggressive loading
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

      // Start a new subscription
      setupSubscription(currentTime - 24 * 60 * 60, currentTime);
      setLoading(false);
    };
    
    initFeed();
    
    // Cleanup timeout when component unmounts
    return () => {
      if (loadMoreTimeoutRef.current) {
        clearTimeout(loadMoreTimeoutRef.current);
      }
    };
  }, [activeHashtag, setupSubscription]);

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
