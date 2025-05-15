
import { useState, useEffect } from "react";
import { NostrEvent, nostrService, contentCache } from "@/lib/nostr";
import { useProfileFetcher } from "./use-profile-fetcher";
import { useEventSubscription } from "./use-event-subscription";
import { useRepostHandler } from "./use-repost-handler";
import eventPrioritization from "@/lib/nostr/utils/event-prioritization";

interface UseFeedEventsProps {
  following?: string[];
  since?: number;
  until?: number;
  activeHashtag?: string;
  limit?: number;
  feedType?: string;
  mediaOnly?: boolean;
}

const PROFILE_BATCH_SIZE = 10; // Process profiles in batches for better performance

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
  const [pubkeysToFetch, setPubkeysToFetch] = useState<Set<string>>(new Set());
  const [prioritizationApplied, setPrioritizationApplied] = useState<boolean>(false);
  
  const { profiles, fetchProfileData, fetchProfiles } = useProfileFetcher();
  const { repostData, handleRepost } = useRepostHandler({ fetchProfileData });
  
  // Handle event subscription
  const { subId, setSubId, setupSubscription } = useEventSubscription({
    following,
    activeHashtag,
    since,
    until,
    limit,
    setEvents: (newEvents) => {
      // Apply event prioritization for better feed quality
      const prioritizedEvents = eventPrioritization.prioritizeEvents(newEvents);
      setEvents(prioritizedEvents);
      setPrioritizationApplied(true);
      
      // Extract public keys for batch fetching
      const authorPubkeys = new Set<string>();
      prioritizedEvents.forEach(event => {
        if (event.pubkey) {
          authorPubkeys.add(event.pubkey);
        }
      });
      
      // Update pubkeys to fetch
      setPubkeysToFetch(authorPubkeys);
    },
    handleRepost,
    fetchProfileData,
    feedType,
    mediaOnly,
  });
  
  // Process profile fetching in batches for better performance
  useEffect(() => {
    if (pubkeysToFetch.size > 0) {
      const pubkeysArray = Array.from(pubkeysToFetch);
      
      // Process in smaller batches to avoid overwhelming the system
      const processBatch = async (startIdx: number) => {
        const endIdx = Math.min(startIdx + PROFILE_BATCH_SIZE, pubkeysArray.length);
        const batchPubkeys = pubkeysArray.slice(startIdx, endIdx);
        
        if (batchPubkeys.length > 0) {
          await fetchProfiles(batchPubkeys);
          
          // Process next batch if there are more pubkeys
          if (endIdx < pubkeysArray.length) {
            // Short delay between batches
            setTimeout(() => processBatch(endIdx), 100);
          }
        }
      };
      
      // Start processing batches
      processBatch(0);
      
      // Clear the set after initiating fetching
      setPubkeysToFetch(new Set());
    }
  }, [pubkeysToFetch, fetchProfiles]);
  
  // Periodically re-prioritize events if we have enough of them
  useEffect(() => {
    if (events.length > 15 && !prioritizationApplied) {
      const prioritizedEvents = eventPrioritization.prioritizeEvents(events);
      setEvents(prioritizedEvents);
      setPrioritizationApplied(true);
    }
  }, [events, prioritizationApplied]);
  
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
        // Apply event prioritization to cached feed
        const prioritizedFeed = eventPrioritization.prioritizeEvents(cachedFeed);
        
        // Use cached feed with prioritization
        setEvents(prioritizedFeed);
        setCacheHit(true);
        setPrioritizationApplied(true);
        
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
        
        // Extract public keys for batch profile fetching
        const authorPubkeys = new Set<string>();
        prioritizedFeed.slice(0, 15).forEach(event => { // Focus on visible posts first
          if (event.pubkey) {
            authorPubkeys.add(event.pubkey);
          }
        });
        
        // Update pubkeys to fetch for batch processing
        if (authorPubkeys.size > 0) {
          setPubkeysToFetch(authorPubkeys);
        }
      }
      
      setLoadingFromCache(false);
    };
    
    loadFromCache();
  }, [feedType, following, activeHashtag, since, until, mediaOnly, fetchProfileData]);
  
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
    setPrioritizationApplied(false);
    
    // Cancel existing subscription
    if (subId) {
      nostrService.unsubscribe(subId);
      setSubId(null);
    }
    
    // Setup a new subscription
    const currentTime = Math.floor(Date.now() / 1000);
    const newSince = currentTime - 24 * 60 * 60; // Last 24 hours
    
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
    loadingFromCache
  };
}
