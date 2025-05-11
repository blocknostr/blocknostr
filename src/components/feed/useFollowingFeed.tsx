
import { useState, useEffect } from "react";
import { nostrService } from "@/lib/nostr";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";
import { useFeedEvents } from "./hooks";
import { toast } from "sonner";
import { contentCache } from "@/lib/nostr/cache/content-cache";

interface UseFollowingFeedProps {
  activeHashtag?: string;
}

export function useFollowingFeed({ activeHashtag }: UseFollowingFeedProps) {
  const following = nostrService.following;
  const [since, setSince] = useState<number | undefined>(undefined);
  const [until, setUntil] = useState(Math.floor(Date.now() / 1000));
  const [connectionAttempted, setConnectionAttempted] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  
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
    activeHashtag
  });
  
  const loadMoreEvents = () => {
    if (!subId || following.length === 0) return;
    
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
    } else {
      // We already have a since value, so use it to get older posts
      const newUntil = since;
      const newSince = newUntil - 24 * 60 * 60 * 7; // 7 days before until
      
      setSince(newSince);
      setUntil(newUntil);
      
      // Start the new subscription with the older timestamp range
      const newSubId = setupSubscription(newSince, newUntil);
      setSubId(newSubId);
    }
  };
  
  const {
    loadMoreRef,
    loading,
    setLoading,
    hasMore,
    setHasMore
  } = useInfiniteScroll(loadMoreEvents, { initialLoad: true });

  const initFeed = async (forceReconnect = false) => {
    setLoading(true);
    
    try {
      // If force reconnect or no relays connected, connect to relays
      const relayStatus = nostrService.getRelayStatus();
      const connectedRelays = relayStatus.filter(r => r.status === 'connected');
      
      if (forceReconnect || connectedRelays.length === 0) {
        // Connect to relays
        await nostrService.connectToUserRelays();
        setConnectionAttempted(true);
      }
      
      // Reset state when filter changes
      setEvents([]);
      setHasMore(true);
      
      // Reset the timestamp range for new subscription
      const currentTime = Math.floor(Date.now() / 1000);
      setSince(undefined);
      setUntil(currentTime);
      
      // Close previous subscription if exists
      if (subId) {
        nostrService.unsubscribe(subId);
      }
      
      // Load from cache first if offline
      if (!navigator.onLine) {
        const cachedEvents = contentCache.getEventsByAuthors(following);
        if (cachedEvents.length > 0) {
          setEvents(cachedEvents);
        }
      }
      
      // Start a new subscription
      const newSubId = setupSubscription(currentTime - 24 * 60 * 60 * 7, currentTime);
      setSubId(newSubId);
      
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
    }
  };
  
  // Refresh feed function for manual refresh
  const refreshFeed = () => {
    setRetryCount(0);
    initFeed(true);
  };
  
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
  }, [events, loading]);

  return {
    events,
    profiles,
    repostData,
    loadMoreRef,
    loading,
    following,
    hasMore,
    refreshFeed,
    connectionAttempted
  };
}
