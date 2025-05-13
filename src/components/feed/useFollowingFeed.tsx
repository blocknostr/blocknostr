
import { useState, useEffect } from "react";
import { nostrService } from "@/lib/nostr";
import { useFeedEvents } from "./hooks";
import { useFeedCache } from "./hooks/use-feed-cache";
import { useFeedInitialization } from "./hooks/use-feed-initialization";
import { useFeedPagination } from "./hooks/use-feed-pagination";

interface UseFollowingFeedProps {
  activeHashtag?: string;
}

export function useFollowingFeed({ activeHashtag }: UseFollowingFeedProps) {
  const following = nostrService.following;
  const [events, setEvents] = useState<any[]>([]);
  
  const { 
    profiles, 
    repostData, 
    subId, 
    setSubId, 
    setupSubscription 
  } = useFeedEvents({
    following,
    activeHashtag
  });
  
  // Use our cache hook
  const {
    loadFromCache,
    lastUpdated,
    cacheHit,
    setCacheHit,
    loadingFromCache,
    setLoadingFromCache
  } = useFeedCache({
    following,
    activeHashtag,
    events,
    setEvents,
    feedType: 'following'
  });
  
  // Use our pagination hook
  const {
    loadMoreRef,
    loading,
    setLoading,
    hasMore,
    setHasMore
  } = useFeedPagination({
    events,
    subId,
    setSubId,
    setupSubscription,
    loadFromCache,
    following
  });
  
  // Use our initialization hook
  const {
    initFeed,
    refreshFeed,
    connectionAttempted
  } = useFeedInitialization({
    loadFromCache,
    setupSubscription,
    setSubId,
    setEvents,
    setHasMore,
    setLoading,
    setCacheHit,
    setLoadingFromCache,
    following,
    subId
  });
  
  // Initialize feed when dependencies change
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
    loadingFromCache,
    following,
    hasMore,
    refreshFeed,
    connectionAttempted,
    lastUpdated,
    cacheHit
  };
}
