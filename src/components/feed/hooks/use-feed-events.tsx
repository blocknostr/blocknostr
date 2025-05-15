
import { useState, useEffect, useCallback } from "react";
import { NostrEvent, nostrService, contentCache } from "@/lib/nostr";
import { useProfileFetcher } from "./use-profile-fetcher";
import { useEventSubscription } from "./use-event-subscription";
import { useRepostHandler } from "./use-repost-handler";
import { relaySelector } from "@/lib/nostr/relay/selection/relay-selector";

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
  const [connectionEstablished, setConnectionEstablished] = useState<boolean>(false);
  
  const { profiles, fetchProfileData } = useProfileFetcher();
  const { repostData, handleRepost } = useRepostHandler({ fetchProfileData });
  
  // Connect to best relays for read operations
  const connectToOptimalRelays = useCallback(async () => {
    if (connectionEstablished) return;

    // Get all relay URLs from the relay manager
    const allRelays = nostrService.getRelayStatus().map(r => r.url);
    
    // Select best relays for read operations (up to 3 initially)
    const bestRelays = relaySelector.selectBestRelays(allRelays, {
      operation: 'read',
      count: 3,
      minScore: 0, // Accept any score initially to establish connection quickly
      preferredNips: [1, 16, 9], // Prefer relays supporting basic requirements
    });
    
    if (bestRelays.length > 0) {
      try {
        // Connect to best relays with a timeout
        const connectPromise = nostrService.addMultipleRelays(bestRelays);
        
        // Set a timeout for connection attempt
        const timeoutPromise = new Promise<number>(resolve => {
          setTimeout(() => resolve(0), 2000);
        });
        
        // Race between connection and timeout
        await Promise.race([connectPromise, timeoutPromise]);
        setConnectionEstablished(true);
      } catch (error) {
        console.error("Error connecting to optimal relays:", error);
      }
    }
  }, [connectionEstablished]);
  
  // Handle event subscription with optimized connections
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
      
      // Connect to optimal relays in parallel, regardless of cache result
      connectToOptimalRelays();
    };
    
    loadFromCache();
  }, [feedType, following, activeHashtag, since, until, mediaOnly, fetchProfileData, connectToOptimalRelays]);
  
  // Add priority-based profile fetching
  useEffect(() => {
    if (events.length > 0) {
      const pubkeys = new Set<string>();
      
      // First 10 visible posts get priority
      const visibleEvents = events.slice(0, 10);
      visibleEvents.forEach(event => {
        if (event.pubkey) pubkeys.add(event.pubkey);
      });
      
      // Fetch visible profiles first
      Array.from(pubkeys).forEach(pubkey => {
        fetchProfileData(pubkey);
      });
      
      // Then fetch remaining profiles with a slight delay
      setTimeout(() => {
        const remainingEvents = events.slice(10);
        const remainingPubkeys = new Set<string>();
        
        remainingEvents.forEach(event => {
          if (event.pubkey && !pubkeys.has(event.pubkey)) {
            remainingPubkeys.add(event.pubkey);
          }
        });
        
        Array.from(remainingPubkeys).forEach(pubkey => {
          fetchProfileData(pubkey);
        });
      }, 1000);
    }
  }, [events, fetchProfileData]);
  
  // Refresh feed by clearing cache and setting up a new subscription
  const refreshFeed = useCallback(() => {
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
    
    const newSubId = setupSubscription(newSince, currentTime);
    setSubId(newSubId);
  }, [subId, setSubId, setupSubscription, feedType, following, activeHashtag, since, until, mediaOnly]);

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
