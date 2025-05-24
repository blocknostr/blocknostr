
import { useState, useEffect } from "react";
import { nostrService, contentCache, NostrEvent } from "@/lib/nostr";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";
import { useFeedEvents } from "./hooks";
import { toast } from "sonner";
import { retry } from "@/lib/utils/retry";

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
    limit: 20 // Reduced from default for better performance
  });
  
  const loadMoreEvents = () => {
    if (!subId || following.length === 0) return;
    
    // Set loading state
    setIsLoadingMore(true);
    
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
      const newSince = newUntil - 24 * 60 * 60 * 3; // 3 days before until (reduced from 7)
      
      setSince(newSince);
      setUntil(newUntil);
      
      // Start the new subscription with the older timestamp range
      const newSubId = setupSubscription(newSince, newUntil);
      setSubId(newSubId);
      
      // Check if we have this range cached
      loadFromCache('following', newSince, newUntil);
    } else {
      // We already have a since value, so use it to get older posts
      const newUntil = since;
      const newSince = newUntil - 24 * 60 * 60 * 3; // 3 days before until (reduced from 7)
      
      setSince(newSince);
      setUntil(newUntil);
      
      // Start the new subscription with the older timestamp range
      const newSubId = setupSubscription(newSince, newUntil);
      setSubId(newSubId);
      
      // Check if we have this range cached
      loadFromCache('following', newSince, newUntil);
    }
    
    // End loading after a delay regardless of whether data was loaded
    setTimeout(() => setIsLoadingMore(false), 3000);
  };
  
  const {
    loadMoreRef,
    loading,
    setLoading,
    hasMore,
    setHasMore
  } = useInfiniteScroll(loadMoreEvents, { 
    initialLoad: true,
    threshold: 800, // Reduced for less aggressive loading
    aggressiveness: 'medium' // Changed from default to 'medium'
  });

  // Helper function to load data from cache
  const loadFromCache = (feedType: string, cacheSince?: number, cacheUntil?: number) => {
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
  };

  // Function to automatically retry loading posts if none are found
  const retryLoadingPosts = async () => {
    if (events.length === 0 && !isRetrying) {
      setIsRetrying(true);
      
      // Wait a bit before retrying
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Close previous subscription
      if (subId) {
        nostrService.unsubscribe(subId);
      }
      
      // Create new subscription with slightly extended time range
      const currentTime = Math.floor(Date.now() / 1000);
      const oneWeekAgo = currentTime - 24 * 60 * 60 * 7; // 1 week for retry (reduced from 2 weeks)
      
      setSince(oneWeekAgo);
      setUntil(currentTime);
      
      // Start the new subscription with the extended timestamp range
      const newSubId = setupSubscription(oneWeekAgo, currentTime);
      setSubId(newSubId);
      
      // Also try to load from cache with extended range
      loadFromCache('following', oneWeekAgo, currentTime);
      
      // End retry state after a delay
      setTimeout(() => setIsRetrying(false), 3000);
    }
  };

  const initFeed = async (forceReconnect = false) => {
    setLoading(true);
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
        const newSubId = setupSubscription(weekAgo, currentTime);
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
  };
  
  // Refresh feed function for manual refresh
  const refreshFeed = () => {
    setRetryCount(0);
    setCacheHit(false);
    initFeed(true);
  };
  
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
  }, [events, following, activeHashtag, cacheHit]);
  
  useEffect(() => {
    initFeed();
    
    return () => {
      if (subId) {
        nostrService.unsubscribe(subId);
      }
    };
  }, [following, activeHashtag]);
  
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
  }, [loading, events.length, isRetrying, following.length]);

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
