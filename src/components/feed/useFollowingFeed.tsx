
import { useState, useEffect } from "react";
import { nostrService, contentCache } from "@/lib/nostr";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";
import { useFeedEvents } from "./hooks";
import { useFollowingFeedInit, useFollowingFeedCache, useLoadMoreEvents } from "./hooks/following-feed";

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
  
  // Use our newly extracted cache hook
  const { loadFromCache } = useFollowingFeedCache({
    events,
    following,
    activeHashtag,
    cacheHit,
    since,
    until,
    setLastUpdated
  });

  // Use our load more events hook
  const { loadMoreEvents } = useLoadMoreEvents({
    subId,
    following,
    events,
    since,
    until,
    setupSubscription,
    setSubId,
    setSince,
    setUntil,
    loadFromCache
  });
  
  // Use the infinite scroll hook
  const {
    loadMoreRef,
    loading,
    setLoading,
    hasMore,
    setHasMore
  } = useInfiniteScroll(loadMoreEvents, { 
    initialLoad: true,
    maintainScrollPosition: true 
  });
  
  // Use our initialization hook
  const { initFeed, refreshFeed } = useFollowingFeedInit({
    following,
    activeHashtag,
    loadFromCache,
    setEvents,
    setLoading,
    setHasMore,
    setupSubscription,
    setSubId,
    setConnectionAttempted,
    setRetryCount,
    setCacheHit,
    setLoadingFromCache
  });
  
  // Initialize the feed
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
