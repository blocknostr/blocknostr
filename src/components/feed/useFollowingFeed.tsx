
import { useState, useEffect, useCallback } from "react";
import { nostrService, contentCache } from "@/lib/nostr";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";
import { useFeedEvents } from "./hooks";
import { toast } from "sonner";

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
  const [pendingEvents, setPendingEvents] = useState<any[]>([]);
  const [lastBatchTime, setLastBatchTime] = useState(0);
  
  // Create a debounced batch update function
  const processPendingEvents = useCallback(() => {
    if (pendingEvents.length > 0) {
      console.log(`[useFollowingFeed] Processing batch of ${pendingEvents.length} events`);
      
      // Update events with the batch
      setEvents(prevEvents => {
        // Filter out duplicates
        const newEvents = pendingEvents.filter(
          e => !prevEvents.some(existing => existing.id === e.id)
        );
        
        // Combine and sort
        return [...prevEvents, ...newEvents]
          .sort((a, b) => b.created_at - a.created_at);
      });
      
      // Clear pending batch
      setPendingEvents([]);
      setLastBatchTime(Date.now());
    }
  }, [pendingEvents]);
  
  // Set up batch processing interval
  useEffect(() => {
    const batchInterval = setInterval(() => {
      processPendingEvents();
    }, 2000); // Process batches every 2 seconds
    
    return () => clearInterval(batchInterval);
  }, [processPendingEvents]);
  
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
    batchUpdate: (event: any) => {
      // Instead of immediately updating state, add to pending batch
      setPendingEvents(prev => [...prev, event]);
      
      // If we have enough events or it's been a while since last batch, process immediately
      if (pendingEvents.length > 15 || (Date.now() - lastBatchTime > 5000)) {
        setTimeout(processPendingEvents, 0);
      }
    }
  });
  
  // Modified load more function with better state management
  const loadMoreEvents = useCallback(() => {
    if (!subId || following.length === 0 || isLoadingMore) return;
    
    // Set loading state
    setIsLoadingMore(true);
    
    // Save current scroll position
    const scrollPos = window.scrollY;
    
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
      const newSince = newUntil - 24 * 60 * 60 * 7; // 7 days before until
      
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
      const newSince = newUntil - 24 * 60 * 60 * 7; // 7 days before until
      
      setSince(newSince);
      setUntil(newUntil);
      
      // Start the new subscription with the older timestamp range
      const newSubId = setupSubscription(newSince, newUntil);
      setSubId(newSubId);
      
      // Check if we have this range cached
      loadFromCache('following', newSince, newUntil);
    }
    
    // End loading after a delay regardless of whether data was loaded
    setTimeout(() => {
      setIsLoadingMore(false);
      
      // Restore scroll position after a delay to let the DOM update
      setTimeout(() => {
        window.scrollTo(0, scrollPos);
      }, 100);
    }, 3000);
  }, [subId, following, since, until, events, isLoadingMore, setupSubscription, setSubId, loadFromCache]);
  
  const {
    loadMoreRef,
    loading,
    setLoading,
    hasMore,
    setHasMore
  } = useInfiniteScroll(loadMoreEvents, { 
    initialLoad: true,
    rootMargin: "0px 0px 400px 0px", // Increased margin to load earlier
    debounceMs: 800 // Add debounce to prevent rapid firing
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

  // Initialize feed with better state management
  const initFeed = useCallback(async (forceReconnect = false) => {
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
        // Only reset events if not loading from cache to prevent flicker
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
  }, [loadFromCache, subId, following, setEvents, setupSubscription, setSubId, retryCount]);
  
  // Refresh feed function with scroll position preservation
  const refreshFeed = useCallback(() => {
    // Save scroll position
    const scrollPos = window.scrollY;
    
    // Reset state
    setRetryCount(0);
    setCacheHit(false);
    
    // Re-initialize feed
    initFeed(true);
    
    // Restore scroll position after a delay
    setTimeout(() => {
      window.scrollTo(0, scrollPos);
    }, 100);
  }, [initFeed]);
  
  // Cache the feed data when events update
  useEffect(() => {
    if (events.length > 0 && following.length > 0) {
      // Don't cache if we just loaded from cache
      if (cacheHit) return;
      
      // Cache the current feed state
      const feedCache = contentCache.feedCache;
      if (feedCache) {
        feedCache.cacheFeed('following', events, {
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
    };
  }, [following, activeHashtag]);
  
  // Mark the loading as finished when we get events
  useEffect(() => {
    if (events.length > 0 && loading) {
      setLoading(false);
    }
    
    // If we've reached the limit, set hasMore to false
    if (events.length >= 200) { // Increased from 100 to reduce loading frequency
      setHasMore(false);
    }
    
    // Also end loading more state if we have events
    if (events.length > 0 && isLoadingMore) {
      setIsLoadingMore(false);
    }
  }, [events, loading, isLoadingMore, setLoading]);

  return {
    events,
    profiles,
    repostData,
    loadMoreRef,
    loading,
    loadingFromCache,
    loadingMore: isLoadingMore,
    following,
    hasMore,
    refreshFeed,
    loadMoreEvents,
    connectionAttempted,
    lastUpdated,
    cacheHit
  };
}, []);
