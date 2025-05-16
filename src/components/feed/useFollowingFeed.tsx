
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
  const [noNewEvents, setNoNewEvents] = useState(false);
  const retryTimeoutRef = useRef<number | null>(null);
  const newEventCountRef = useRef<number>(0);
  const cooldownRef = useRef<boolean>(false);
  
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
    limit: 30 // Increased from 20 to 30 for better initial experience as requested
  });
  
  const loadMoreEvents = useCallback(async () => {
    if (!subId || following.length === 0 || isLoadingMore || cooldownRef.current) return;
    
    // Set loading state
    setIsLoadingMore(true);
    cooldownRef.current = true;
    newEventCountRef.current = 0;
    console.log("[FollowingFeed] Loading more events triggered");
    
    try {
      // Find the oldest event to use as a reference point
      const oldestEvent = EventDeduplication.findOldestEvent(events);
      
      if (oldestEvent) {
        // Use the oldest event's timestamp for the new 'until' value
        const newUntil = oldestEvent.created_at - 1;
        // Get older posts from a 7-day period (increased from 3 days)
        const newSince = newUntil - 7 * 24 * 60 * 60;
        
        console.log(`[FollowingFeed] Loading older posts from ${new Date(newSince * 1000).toISOString()} to ${new Date(newUntil * 1000).toISOString()}`);
        
        setSince(newSince);
        setUntil(newUntil);
        
        // Critical Fix: Start the new subscription BEFORE closing the old one
        const newSubId = await setupSubscription(newSince, newUntil);
        
        // Only close previous subscription after new one is established
        if (subId) {
          nostrService.unsubscribe(subId);
          console.log("[FollowingFeed] Closed previous subscription after new one created");
        }
        
        setSubId(newSubId);
        
        // Check if we have this range cached
        loadFromCache('following', newSince, newUntil);
      } else {
        // If no events yet, use the current timestamps
        const newUntil = until;
        const newSince = newUntil - 7 * 24 * 60 * 60; // increased from 3 days to 7 days
        
        console.log(`[FollowingFeed] No events yet, loading with broader range from ${new Date(newSince * 1000).toISOString()} to ${new Date(newUntil * 1000).toISOString()}`);
        
        // Create new subscription BEFORE closing old one
        const newSubId = await setupSubscription(newSince, newUntil);
        
        if (subId) {
          nostrService.unsubscribe(subId);
        }
        
        setSince(newSince);
        setSubId(newSubId);
        
        // Check if we have this range cached
        loadFromCache('following', newSince, newUntil);
      }
    } catch (error) {
      console.error("Error loading more events:", error);
    }
    
    // End loading after a longer delay to collect more events
    setTimeout(() => {
      setIsLoadingMore(false);
      
      // Check if we received any new events
      console.log(`[FollowingFeed] Received ${newEventCountRef.current} new events in this batch`);
      if (newEventCountRef.current === 0) {
        console.log("[FollowingFeed] No new events received, setting hasMore = false");
        setNoNewEvents(true);
      }
      
      // Cooldown to prevent rapid repeated triggering
      setTimeout(() => {
        cooldownRef.current = false;
      }, 2000);
    }, 5000); // Increased from 3000ms to 5000ms
  }, [subId, events, until, setupSubscription, following.length, isLoadingMore, loadFromCache]);
  
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

  // Update hasMore when noNewEvents changes
  useEffect(() => {
    if (noNewEvents) {
      setHasMore(false);
    }
  }, [noNewEvents, setHasMore]);

  // Track new events received
  useEffect(() => {
    const prevLength = useRef(events.length);
    
    if (events.length > prevLength.current) {
      const newCount = events.length - prevLength.current;
      newEventCountRef.current += newCount;
      console.log(`[FollowingFeed] Received ${newCount} new events (total: ${events.length})`);
    }
    
    prevLength.current = events.length;
  }, [events]);

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
        // Create new subscription with extended time range based on retry count
        const currentTime = Math.floor(Date.now() / 1000);
        const extendedDays = Math.min(retryCount + 1, 14); // Extend up to 14 days (increased from 7)
        const extendedTime = currentTime - 24 * 60 * 60 * extendedDays;
        
        setSince(extendedTime);
        setUntil(currentTime);
        
        // Start the new subscription BEFORE closing the old one - Critical Fix
        const newSubId = await setupSubscription(extendedTime, currentTime);
        
        // Only close the previous subscription after the new one is established
        if (subId) {
          nostrService.unsubscribe(subId);
        }
        
        setSubId(newSubId);
        
        // Also try to load from cache with extended range
        loadFromCache('following', extendedTime, currentTime);
        
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
    setNoNewEvents(false);
    newEventCountRef.current = 0;
    
    const currentTime = Math.floor(Date.now() / 1000);
    const twoWeeksAgo = currentTime - 14 * 24 * 60 * 60; // Increased from 7 days to 14 days
    
    // Always try to load from cache first for immediate response
    const cacheLoaded = loadFromCache('following', twoWeeksAgo, currentTime);
    
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
      setSince(twoWeeksAgo); // Use broader two-week range
      setUntil(currentTime);
      
      // If online, start a new subscription
      if (navigator.onLine) {
        // Create new subscription before closing old one
        const newSubId = await setupSubscription(twoWeeksAgo, currentTime);
        
        // Only close previous subscription after creating new one
        if (subId) {
          nostrService.unsubscribe(subId);
        }
        
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
    setNoNewEvents(false);
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
    
    // If we've reached the limit of 150 events, consider setting hasMore to false
    if (events.length >= 150) {
      console.log("[FollowingFeed] Reached 150 events limit");
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
    loading: loading || isRetrying, 
    loadingFromCache,
    loadingMore: isLoadingMore,
    following,
    hasMore: hasMore && !noNewEvents,
    refreshFeed,
    loadMoreEvents,
    connectionAttempted,
    lastUpdated,
    cacheHit,
    isRetrying
  };
}
