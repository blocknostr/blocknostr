
import { useState, useEffect, useCallback, useRef } from "react";
import { nostrService, contentCache, NostrEvent } from "@/lib/nostr";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";
import { useFeedEvents } from "./hooks";
import { toast } from "sonner";
import { retry } from "@/lib/utils/retry";
import { EventDeduplication } from "@/lib/nostr/utils/event-deduplication";

interface UseFollowingFeedProps {
  activeHashtag?: string;
}

export function useFollowingFeed({ activeHashtag }: UseFollowingFeedProps) {
  const following = nostrService.following;
  const [since, setSince] = useState<number | undefined>(undefined);
  const [until, setUntil] = useState(Math.floor(Date.now() / 1000));
  const [connectionAttempted, setConnectionAttempted] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [loadingFromCache, setLoadingFromCache] = useState(false);
  const [cacheHit, setCacheHit] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const retryTimeoutRef = useRef<number | null>(null);
  
  const { 
    events, 
    profiles, 
    repostData, 
    subId, 
    setSubId, 
    setupSubscription, 
    setEvents 
  } = useFeedEvents({
    following,
    since,
    until,
    activeHashtag,
    limit: 30 // Increased from 20 for better initial experience
  });
  
  const loadMoreEvents = useCallback(async () => {
    if (!subId || following.length === 0) return;
    
    // Set loading state
    setIsLoadingMore(true);
    
    try {
      // Close previous subscription
      if (subId) {
        nostrService.unsubscribe(subId);
      }

      // Find the oldest event to use as a reference point
      const oldestEvent = EventDeduplication.findOldestEvent(events);
      
      if (oldestEvent) {
        // Use the oldest event's timestamp for the new 'until' value
        const newUntil = oldestEvent.created_at - 1;
        // Get older posts from a 3-day period
        const newSince = newUntil - 24 * 60 * 60 * 3;
        
        setSince(newSince);
        setUntil(newUntil);
        
        // Start the new subscription with the older timestamp range
        const newSubId = await setupSubscription(newSince, newUntil);
        setSubId(newSubId);
        
        // Check if we have this range cached
        loadFromCache('following', newSince, newUntil);
      } else {
        // If no events yet, use the current timestamps
        const newUntil = until;
        const newSince = newUntil - 24 * 60 * 60 * 3;
        
        setSince(newSince);
        
        // Start the new subscription with the older timestamp range
        const newSubId = await setupSubscription(newSince, newUntil);
        setSubId(newSubId);
        
        // Check if we have this range cached
        loadFromCache('following', newSince, newUntil);
      }
    } catch (error) {
      console.error("Error loading more events:", error);
    }
    
    // End loading after a delay regardless of whether data was loaded
    setTimeout(() => setIsLoadingMore(false), 3000);
  }, [subId, events, until, setupSubscription, following.length]);
  
  const {
    loadMoreRef,
    loading,
    setLoading,
    hasMore,
    setHasMore
  } = useInfiniteScroll(loadMoreEvents, { 
    initialLoad: true,
    threshold: 800,
    aggressiveness: 'medium'
  });

  // Helper function to load data from cache
  const loadFromCache = useCallback((feedType: string, cacheSince?: number, cacheUntil?: number) => {
    if (!navigator.onLine || contentCache.isOffline()) {
      setLoadingFromCache(true);
    }
    
    // Get feed cache object from contentCache
    const feedCache = contentCache.feedCache;
    if (!feedCache) return false;
    
    // Check if we have a cached feed for these parameters
    const cachedEvents = feedCache.getFeed(feedType, {
      authorPubkeys: following,
      hashtag: activeHashtag,
      since: cacheSince,
      until: cacheUntil,
    });
    
    if (cachedEvents && cachedEvents.length > 0) {
      // We have cached data
      setCacheHit(true);
      setLastUpdated(new Date());
      
      // If offline or first load, replace events with cached events
      if (contentCache.isOffline() || events.length === 0) {
        setEvents(cachedEvents);
        setLoading(false);
      } else {
        // Otherwise, append unique events
        setEvents(prevEvents => {
          const existingIds = new Set(prevEvents.map(e => e.id));
          const newEvents = cachedEvents.filter(e => e.id && !existingIds.has(e.id));
          
          // Return combined events sorted by timestamp
          return [...prevEvents, ...newEvents]
            .sort((a, b) => b.created_at - a.created_at);
        });
      }
      
      return true;
    }
    
    return false;
  }, [following, activeHashtag, events.length, setEvents, setLoading]);

  // Function to automatically retry loading posts if none are found
  const retryLoadingPosts = useCallback(async () => {
    if (events.length === 0 && !isRetrying && following.length > 0) {
      setIsRetrying(true);
      
      // Clear any existing retry timeout
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      
      // Wait a bit before retrying
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      try {
        // Close previous subscription
        if (subId) {
          nostrService.unsubscribe(subId);
        }
        
        // Create new subscription with extended time range based on retry count
        const currentTime = Math.floor(Date.now() / 1000);
        const extendedDays = Math.min(retryCount + 1, 7); // Extend up to 7 days
        const oneWeekAgo = currentTime - 24 * 60 * 60 * extendedDays;
        
        setSince(oneWeekAgo);
        setUntil(currentTime);
        
        // Start the new subscription with the extended timestamp range
        const newSubId = await setupSubscription(oneWeekAgo, currentTime);
        setSubId(newSubId);
        
        // Also try to load from cache with extended range
        loadFromCache('following', oneWeekAgo, currentTime);
        
        // Increment retry count
        setRetryCount(prev => prev + 1);
      } catch (error) {
        console.error("Error during retry:", error);
      }
      
      // End retry state after a delay
      retryTimeoutRef.current = window.setTimeout(() => {
        setIsRetrying(false);
        retryTimeoutRef.current = null;
      }, 3000);
    }
  }, [events.length, isRetrying, following.length, subId, setupSubscription, loadFromCache, retryCount]);

  const initFeed = useCallback(async (forceReconnect = false) => {
    setLoading(true);
    setRetryCount(0);
    setIsRetrying(false);
    const currentTime = Math.floor(Date.now() / 1000);
    const weekAgo = currentTime - 24 * 60 * 60 * 7;
    
    // Always try to load from cache first for immediate response
    const cacheLoaded = loadFromCache('following', weekAgo, currentTime);
    
    try {
      // If force reconnect or no relays connected, connect to relays
      const relayStatus = nostrService.getRelayStatus();
      const connectedRelays = relayStatus.filter(r => r.status === 'connected');
      
      if (forceReconnect || connectedRelays.length === 0) {
        // Connect to relays
        await nostrService.connectToUserRelays();
        setConnectionAttempted(true);
      }
      
      // Reset state when filter changes (if not loading from cache)
      if (!cacheLoaded) {
        setEvents([]);
      }
      setHasMore(true);
      
      // Reset the timestamp range for new subscription
      setSince(undefined);
      setUntil(currentTime);
      
      // Close previous subscription if exists
      if (subId) {
        nostrService.unsubscribe(subId);
      }
      
      // If online, start a new subscription
      if (navigator.onLine) {
        const newSubId = await setupSubscription(weekAgo, currentTime);
        setSubId(newSubId);
      }
      
      if (following.length === 0) {
        setLoading(false);
      }
    } catch (error) {
      console.error("Error initializing feed:", error);
      setLoading(false);
      
      // Retry up to 3 times
      if (retryCount < 3) {
        setRetryCount(prev => prev + 1);
        setTimeout(() => initFeed(true), 2000); // Retry after 2 seconds
      } else {
        toast.error("Failed to connect to relays. Check your connection or try again later.");
      }
    } finally {
      setLoadingFromCache(false);
    }
  }, [loadFromCache, setupSubscription, subId, following.length, retryCount]);
  
  // Refresh feed function for manual refresh
  const refreshFeed = useCallback(() => {
    setRetryCount(0);
    setCacheHit(false);
    initFeed(true);
  }, [initFeed]);
  
  // Cache the feed data when events update
  useEffect(() => {
    if (events.length > 0 && following.length > 0) {
      // Don't cache if we just loaded from cache
      if (cacheHit) return;
      
      // Cache the current feed state
      const feedCache = contentCache.feedCache;
      if (feedCache) {
        // First, group events by id to handle replacements (NIP-16)
        const eventsByIds: Record<string, NostrEvent> = {};
        
        // Process events, keeping only the most recent version of each event
        events.forEach(event => {
          if (!event.id) return;
          
          // If we already have this event ID, only replace if this one is newer
          if (eventsByIds[event.id]) {
            if (event.created_at > eventsByIds[event.id].created_at) {
              eventsByIds[event.id] = event;
            }
          } else {
            eventsByIds[event.id] = event;
          }
        });
        
        // Convert back to array for caching
        const deduplicatedEvents = Object.values(eventsByIds);
        
        // Cache the deduplicated events
        feedCache.cacheFeed('following', deduplicatedEvents, {
          authorPubkeys: following,
          hashtag: activeHashtag,
          since,
          until
        }, true); // Mark as important for offline use
        
        // Update last updated timestamp
        setLastUpdated(new Date());
      }
    }
  }, [events, following, activeHashtag, cacheHit, since, until]);
  
  useEffect(() => {
    initFeed();
    
    return () => {
      if (subId) {
        nostrService.unsubscribe(subId);
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [following, activeHashtag, initFeed, subId]);
  
  // Mark the loading as finished when we get events
  useEffect(() => {
    if (events.length > 0 && loading) {
      setLoading(false);
    }
    
    // If we've reached the limit, set hasMore to false
    if (events.length >= 100) {
      setHasMore(false);
    }
    
    // Also end loading more state if we have events
    if (events.length > 0 && isLoadingMore) {
      setIsLoadingMore(false);
    }
  }, [events, loading, isLoadingMore]);
  
  // Add automatic retry if no events are found after initial loading
  useEffect(() => {
    // Check if loading has finished but we have no events
    if (!loading && events.length === 0 && !isRetrying && following.length > 0) {
      retryLoadingPosts();
    }
  }, [loading, events.length, isRetrying, following.length, retryLoadingPosts]);

  return {
    events,
    profiles,
    repostData,
    loadMoreRef,
    loading: loading || isRetrying, // Consider still loading during retry
    loadingFromCache,
    loadingMore: isLoadingMore,
    following,
    hasMore,
    refreshFeed,
    loadMoreEvents,
    connectionAttempted,
    lastUpdated,
    cacheHit,
    isRetrying
  };
}
