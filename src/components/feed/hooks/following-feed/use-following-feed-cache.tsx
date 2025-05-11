
import { useEffect } from "react";
import { contentCache } from "@/lib/nostr";

interface UseFollowingFeedCacheProps {
  events: any[];
  following: string[];
  activeHashtag?: string;
  cacheHit: boolean;
  since?: number;
  until?: number;
  setLastUpdated: (date: Date) => void;
}

export function useFollowingFeedCache({
  events,
  following,
  activeHashtag,
  cacheHit,
  since,
  until,
  setLastUpdated
}: UseFollowingFeedCacheProps) {
  
  // Load from cache helper function
  const loadFromCache = (feedType: string, cacheSince?: number, cacheUntil?: number) => {
    if (!navigator.onLine || contentCache.isOffline()) {
      return false;
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
    
    return !!cachedEvents && cachedEvents.length > 0;
  };
  
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
  }, [events, following, activeHashtag, cacheHit]);

  return { loadFromCache };
}
