
import { useState, useEffect } from "react";
import { NostrEvent, nostrService, contentCache } from "@/lib/nostr";
import { useProfileFetcher } from "./use-profile-fetcher";
import { useEventSubscription } from "./use-event-subscription";
import { useRepostHandler } from "./use-repost-handler";

interface UseFeedEventsProps {
  following?: string[];
  since?: number;
  until?: number;
  activeHashtag?: string;
  hashtags?: string[];
  limit?: number;
  feedType?: string;
  mediaOnly?: boolean;
}

export function useFeedEvents({
  following,
  since,
  until,
  activeHashtag,
  hashtags,
  limit = 50,
  feedType = 'generic',
  mediaOnly = false
}: UseFeedEventsProps) {
  const [events, setEvents] = useState<NostrEvent[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [cacheHit, setCacheHit] = useState<boolean>(false);
  const [loadingFromCache, setLoadingFromCache] = useState<boolean>(false);
  
  const { profiles, fetchProfileData } = useProfileFetcher();
  const { repostData, handleRepost, initSetEvents } = useRepostHandler({ fetchProfileData });
  
  // Initialize the setEvents function in the repostHandler
  useEffect(() => {
    initSetEvents(setEvents);
  }, [initSetEvents]);
  
  // Determine which hashtags to use - either the active hashtag, the provided hashtag array, or undefined
  const effectiveHashtags = activeHashtag 
    ? [activeHashtag] 
    : hashtags;
  
  // Handle event subscription
  const { subId, setSubId, setupSubscription } = useEventSubscription({
    following,
    activeHashtag,
    hashtags: effectiveHashtags,
    since,
    until,
    limit,
    setEvents,
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
        // Fix: use the correct property name 'hashtag' since the cache interface doesn't accept 'hashtags'
        // If we have an activeHashtag, it takes precedence; otherwise we use the hashtags array via effectiveHashtags
        // We'll pass undefined, which will make the cache use only the activeHashtag property
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
          // Same fix here for cache key generation
          since,
          until,
          mediaOnly
        });
        
        const cacheEntry = contentCache.feedCache.getRawEntry(cacheKey);
        if (cacheEntry) {
          setLastUpdated(new Date(cacheEntry.timestamp));
        }
        
        // Only fetch profiles for visible posts to reduce initial load
        // This is more efficient than prefetching all profiles
        const visiblePosts = cachedFeed.slice(0, 10); // Only first 10 visible posts
        const visibleAuthors = new Set<string>();
        
        visiblePosts.forEach(event => {
          if (event.pubkey) {
            visibleAuthors.add(event.pubkey);
          }
        });
        
        // Fetch profiles for visible authors only
        visibleAuthors.forEach(pubkey => {
          fetchProfileData(pubkey);
        });
      }
      
      setLoadingFromCache(false);
    };
    
    loadFromCache();
  }, [feedType, following, activeHashtag, effectiveHashtags, since, until, mediaOnly, fetchProfileData]);
  
  // Refresh feed by clearing cache and setting up a new subscription
  const refreshFeed = () => {
    // Clear the specific feed from cache
    contentCache.feedCache.clearFeed(feedType, {
      authorPubkeys: following,
      hashtag: activeHashtag,
      // Same fix for cache clearing
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
    
    // Setup a new subscription
    const currentTime = Math.floor(Date.now() / 1000);
    const newSince = currentTime - 24 * 60 * 60; // Last 24 hours
    
    const newSubId = setupSubscription(newSince, currentTime, effectiveHashtags);
    setSubId(newSubId);
  };

  return {
    events,
    profiles,
    repostData,
    subId,
    setSubId,
    setupSubscription,
    setEvents,
    refreshFeed,
    lastUpdated,
    cacheHit,
    loadingFromCache
  };
}
