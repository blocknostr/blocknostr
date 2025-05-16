
import { useState, useEffect, useCallback } from "react";
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
  const [isLoadingLiveData, setIsLoadingLiveData] = useState<boolean>(false);
  
  const { profiles, fetchProfileData } = useProfileFetcher();
  const { repostData, handleRepost, initSetEvents } = useRepostHandler({ fetchProfileData });
  
  // Callback to merge new events with existing ones without duplicates
  const mergeEvents = useCallback((newEvents: NostrEvent[], existingEvents: NostrEvent[]) => {
    // Create a map of existing event IDs for quick lookup
    const existingIds = new Set(existingEvents.map(e => e.id));
    
    // Filter out duplicates and then add new events
    const uniqueNewEvents = newEvents.filter(event => !existingIds.has(event.id));
    
    // Combine and re-sort by timestamp
    const combinedEvents = [...existingEvents, ...uniqueNewEvents]
      .sort((a, b) => b.created_at - a.created_at);
    
    return combinedEvents;
  }, []);
  
  // Initialize the setEvents function in the repostHandler
  useEffect(() => {
    initSetEvents((newEvents) => {
      setEvents(prev => mergeEvents(newEvents, prev));
    });
  }, [initSetEvents, mergeEvents]);
  
  // Determine which hashtags to use - either the active hashtag, the provided hashtag array, or undefined
  const effectiveHashtags = activeHashtag 
    ? [activeHashtag] 
    : hashtags;
  
  // Handle event subscription with improved merging strategy
  const { subId, setSubId, setupSubscription } = useEventSubscription({
    following,
    activeHashtag,
    hashtags: effectiveHashtags,
    since,
    until,
    limit,
    setEvents: (newEvents) => {
      // Merge new events with existing events instead of replacing
      setEvents(prevEvents => mergeEvents(newEvents, prevEvents));
    },
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
        
        // Only fetch profiles for visible posts to reduce initial load
        const visiblePosts = cachedFeed.slice(0, 10); // Only first 10 visible posts
        const visibleAuthors = new Set<string>();
        
        visiblePosts.forEach(event => {
          if (event.pubkey) {
            visibleAuthors.add(event.pubkey);
          }
        });
        
        // Fetch profiles for visible authors
        visibleAuthors.forEach(pubkey => {
          fetchProfileData(pubkey);
        });
        
        // Start loading fresh data immediately in the background without waiting
        const currentTime = Math.floor(Date.now() / 1000);
        const newSince = currentTime - 24 * 60 * 60; // Last 24 hours
        const newUntil = currentTime;
        
        setIsLoadingLiveData(true);
        const newSubId = setupSubscription(newSince, newUntil, effectiveHashtags);
        setSubId(newSubId);
      } else {
        // No cached data, load fresh data
        const currentTime = Math.floor(Date.now() / 1000);
        const newSince = currentTime - 24 * 60 * 60; // Last 24 hours
        const newUntil = currentTime;
        
        setIsLoadingLiveData(true);
        const newSubId = setupSubscription(newSince, newUntil, effectiveHashtags);
        setSubId(newSubId);
      }
      
      setLoadingFromCache(false);
    };
    
    loadFromCache();
    
    return () => {
      // Clean up subscription when component unmounts
      if (subId) {
        nostrService.unsubscribe(subId);
      }
    };
  }, [feedType, following, activeHashtag, effectiveHashtags, since, until, mediaOnly, fetchProfileData, setupSubscription, setSubId]);
  
  // Refresh feed by fetching new data and merging with existing
  const refreshFeed = useCallback(() => {
    // Cancel existing subscription
    if (subId) {
      nostrService.unsubscribe(subId);
      setSubId(null);
    }
    
    // Set up for fresh data
    setIsLoadingLiveData(true);
    setCacheHit(false);
    
    // Setup a new subscription
    const currentTime = Math.floor(Date.now() / 1000);
    const newSince = currentTime - 24 * 60 * 60; // Last 24 hours
    
    const newSubId = setupSubscription(newSince, currentTime, effectiveHashtags);
    setSubId(newSubId);
    
    // Update timestamp
    setLastUpdated(new Date());
  }, [subId, setupSubscription, setSubId, effectiveHashtags]);

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
    isLoadingLiveData,
    mergeEvents
  };
}
