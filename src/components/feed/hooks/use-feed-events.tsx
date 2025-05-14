
import { useState, useEffect } from "react";
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
  initialEvents?: NostrEvent[];
  initialProfiles?: Record<string, any>;
  initialRepostData?: Record<string, { pubkey: string, original: NostrEvent }>;
}

export function useFeedEvents({
  following,
  since,
  until,
  activeHashtag,
  limit = 50,
  feedType = 'generic',
  mediaOnly = false,
  initialEvents = [],
  initialProfiles = {},
  initialRepostData = {}
}: UseFeedEventsProps) {
  const [events, setEvents] = useState<NostrEvent[]>(initialEvents);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [cacheHit, setCacheHit] = useState<boolean>(false);
  const [loadingFromCache, setLoadingFromCache] = useState<boolean>(false);
  
  const { profiles, fetchProfileData, setProfiles } = useProfileFetcher(initialProfiles);
  const { repostData, handleRepost, setRepostData } = useRepostHandler({ fetchProfileData, initialRepostData });
  
  // Handle event subscription
  const { subId, setSubId, setupSubscription } = useEventSubscription({
    following,
    activeHashtag,
    since,
    until,
    limit,
    setEvents,
    handleRepost,
    fetchProfileData,
    feedType,
    mediaOnly,
    initialEvents
  });
  
  // Try to load from cache first when component mounts (if no initial state)
  useEffect(() => {
    if (initialEvents.length > 0) {
      // We already have events from the parent component's state
      // Prefetch profile data for authors if needed
      const uniqueAuthors = new Set<string>();
      initialEvents.forEach(event => {
        if (event.pubkey && !profiles[event.pubkey]) {
          uniqueAuthors.add(event.pubkey);
        }
      });
      
      // Fetch missing profiles
      uniqueAuthors.forEach(pubkey => {
        fetchProfileData(pubkey);
      });
      
      return;
    }

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
  }, [feedType, following, activeHashtag, since, until, mediaOnly, initialEvents.length]);
  
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
    setEvents,
    refreshFeed,
    lastUpdated,
    cacheHit,
    loadingFromCache,
    setProfiles,
    setRepostData
  };
}
