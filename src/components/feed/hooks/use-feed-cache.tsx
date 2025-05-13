import { useState, useEffect } from "react";
import { NostrEvent, contentCache } from "@/lib/nostr";

interface UseFeedCacheProps {
  following: string[];
  activeHashtag?: string;
  since?: number;
  until?: number;
  events: NostrEvent[];
  setEvents: React.Dispatch<React.SetStateAction<NostrEvent[]>>;
  feedType?: string;
}

export function useFeedCache({
  following,
  activeHashtag,
  since,
  until,
  events,
  setEvents,
  feedType = 'following'
}: UseFeedCacheProps) {
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [cacheHit, setCacheHit] = useState(false);
  const [loadingFromCache, setLoadingFromCache] = useState(false);
  
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
        return true;
      } else {
        // Otherwise, append unique events
        setEvents(prevEvents => {
          const existingIds = new Set(prevEvents.map(e => e.id));
          const newEvents = cachedEvents.filter(e => e.id && !existingIds.has(e.id));
          
          // Return combined events sorted by timestamp
          return [...prevEvents, ...newEvents]
            .sort((a, b) => b.created_at - a.created_at);
        });
        return true;
      }
    }
    
    return false;
  };
  
  // Cache the feed data when events update
  useEffect(() => {
    if (events.length > 0 && following.length > 0) {
      // Don't cache if we just loaded from cache
      if (cacheHit) return;
      
      // Cache the current feed state
      const feedCache = contentCache.feedCache;
      if (feedCache) {
        feedCache.cacheFeed(feedType, events, {
          authorPubkeys: following,
          hashtag: activeHashtag,
          since,
          until
        }, true); // Mark as important for offline use
        
        // Update last updated timestamp
        setLastUpdated(new Date());
      }
    }
  }, [events, following, activeHashtag, cacheHit, feedType, since, until]);

  return {
    loadFromCache,
    lastUpdated,
    cacheHit,
    setCacheHit,
    loadingFromCache,
    setLoadingFromCache
  };
}
