
import { useState, useEffect, useRef } from "react";
import { NostrEvent, nostrService, contentCache } from "@/lib/nostr";
import { useProfileFetcher } from "./use-profile-fetcher";
import { useEventSubscription } from "./use-event-subscription";
import { useRepostHandler } from "./use-repost-handler";
import { EventDeduplication } from "@/lib/nostr/utils/event-deduplication";
import { toast } from "sonner";

interface UseFeedEventsProps {
  following?: string[];
  since?: number;
  until?: number;
  activeHashtag?: string;
  limit?: number;
  feedType?: string;
  mediaOnly?: boolean;
}

export function useFeedEvents({
  following,
  since,
  until,
  activeHashtag,
  limit = 50,
  feedType = 'generic',
  mediaOnly = false
}: UseFeedEventsProps) {
  const [events, setEvents] = useState<NostrEvent[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [cacheHit, setCacheHit] = useState<boolean>(false);
  const [loadingFromCache, setLoadingFromCache] = useState<boolean>(false);
  const scrollPositionRef = useRef<number>(0);
  
  const { profiles, fetchProfileData } = useProfileFetcher();
  const { repostData, handleRepost } = useRepostHandler({ fetchProfileData });
  
  // Custom events setter that preserves scroll position
  const setEventsWithScrollPreservation = (newEvents: NostrEvent[] | ((prev: NostrEvent[]) => NostrEvent[])) => {
    // Save current scroll position
    scrollPositionRef.current = window.scrollY;
    
    // Update events
    setEvents(newEvents);
    
    // Restore scroll position after render
    setTimeout(() => {
      if (scrollPositionRef.current > 0) {
        window.scrollTo(0, scrollPositionRef.current);
      }
    }, 0);
  };
  
  // Handle event subscription
  const { subId, setSubId, setupSubscription } = useEventSubscription({
    following,
    activeHashtag,
    since,
    until,
    limit,
    setEvents: setEventsWithScrollPreservation, // Use our custom setter
    handleRepost,
    fetchProfileData,
    feedType,
    mediaOnly,
  });
  
  // Try to load from cache first when component mounts
  useEffect(() => {
    const loadFromCache = async () => {
      setLoadingFromCache(true);
      
      // Check if we have this feed in cache
      const cachedFeed = contentCache.getFeed(feedType, {
        authorPubkeys: following,
        hashtag: activeHashtag,
        since,
        until,
        mediaOnly
      });
      
      if (cachedFeed && cachedFeed.length > 0) {
        // Use cached feed
        setEvents(cachedFeed);
        setCacheHit(true);
        
        // Get cache timestamp
        const cacheKey = contentCache.feedCache.generateCacheKey(feedType, {
          authorPubkeys: following,
          hashtag: activeHashtag, 
          since,
          until,
          mediaOnly
        });
        
        const cacheEntry = contentCache.feedCache.getRawEntry(cacheKey);
        if (cacheEntry) {
          setLastUpdated(new Date(cacheEntry.timestamp));
        }
        
        // Prefetch profile data for authors in cached feed
        const uniqueAuthors = new Set<string>();
        cachedFeed.forEach(event => {
          if (event.pubkey) {
            uniqueAuthors.add(event.pubkey);
          }
        });
        
        // Fetch profiles for authors
        uniqueAuthors.forEach(pubkey => {
          fetchProfileData(pubkey);
        });
      }
      
      setLoadingFromCache(false);
    };
    
    loadFromCache();
  }, [feedType, following, activeHashtag, since, until, mediaOnly]);
  
  // Refresh feed by clearing cache and setting up a new subscription
  const refreshFeed = () => {
    // Clear the specific feed from cache
    contentCache.feedCache.clearFeed(feedType, {
      authorPubkeys: following,
      hashtag: activeHashtag,
      since,
      until,
      mediaOnly
    });
    
    setCacheHit(false);
    setLastUpdated(null);
    
    // Cancel existing subscription
    if (subId) {
      nostrService.unsubscribe(subId);
      setSubId(null);
    }
    
    // Scroll to top when refreshing the feed
    window.scrollTo(0, 0);
    
    // Setup a new subscription
    const currentTime = Math.floor(Date.now() / 1000);
    const newSince = currentTime - 24 * 60 * 60; // Last 24 hours
    
    toast.info("Refreshing feed...");
    
    const newSubId = setupSubscription(newSince, currentTime);
    setSubId(newSubId);
  };

  return {
    events,
    profiles,
    repostData,
    subId,
    setSubId,
    setupSubscription,
    setEvents: setEventsWithScrollPreservation, // Return our custom setter
    refreshFeed,
    lastUpdated,
    cacheHit,
    loadingFromCache
  };
}
