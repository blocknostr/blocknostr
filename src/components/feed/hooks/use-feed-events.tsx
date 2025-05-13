import { useState, useEffect, useCallback } from "react";
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
  batchUpdate?: (event: NostrEvent) => void; // Add batch update callback
}

export function useFeedEvents({
  following,
  since,
  until,
  activeHashtag,
  limit = 50,
  feedType = 'generic',
  mediaOnly = false,
  batchUpdate
}: UseFeedEventsProps) {
  const [events, setEvents] = useState<NostrEvent[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [cacheHit, setCacheHit] = useState<boolean>(false);
  const [loadingFromCache, setLoadingFromCache] = useState<boolean>(false);
  
  const { profiles, fetchProfileData } = useProfileFetcher();
  const { repostData, handleRepost } = useRepostHandler({ fetchProfileData });
  
  // Buffer for batch updates
  const [eventBuffer, setEventBuffer] = useState<NostrEvent[]>([]);
  
  // Process event buffer to batch updates
  const processEventBuffer = useCallback(() => {
    if (eventBuffer.length === 0) return;
    
    setEvents(prev => {
      // Deduplicate events
      const newEvents = eventBuffer.filter(
        event => !prev.some(e => e.id === event.id)
      );
      
      if (newEvents.length === 0) return prev;
      
      // Sort by timestamp (newest first)
      return [...prev, ...newEvents]
        .sort((a, b) => b.created_at - a.created_at);
    });
    
    // Clear buffer after processing
    setEventBuffer([]);
  }, [eventBuffer]);
  
  // Set up buffer processing with regular interval
  useEffect(() => {
    const bufferInterval = setInterval(() => {
      processEventBuffer();
    }, 1000); // Process buffer every second
    
    return () => clearInterval(bufferInterval);
  }, [processEventBuffer]);
  
  // Custom event handler that supports batch updates
  const handleEvent = useCallback((event: NostrEvent) => {
    // If we have a custom batch update function, use it
    if (batchUpdate) {
      batchUpdate(event);
      return;
    }
    
    // Otherwise use our internal buffer
    setEventBuffer(prev => [...prev, event]);
    
    // Process immediately if buffer gets too large
    if (eventBuffer.length > 20) {
      setTimeout(processEventBuffer, 0);
    }
    
    // Always fetch profile data for this event's author
    if (event.pubkey) {
      fetchProfileData(event.pubkey);
    }
  }, [batchUpdate, eventBuffer.length, processEventBuffer, fetchProfileData]);
  
  // Handle event subscription
  const { subId, setSubId, setupSubscription } = useEventSubscription({
    following,
    activeHashtag,
    since,
    until,
    limit,
    setEvents: handleEvent, // Use our custom event handler
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
        
        // Batch fetch profiles for performance
        const pubkeysToFetch = Array.from(uniqueAuthors);
        if (pubkeysToFetch.length > 0) {
          // Fetch in smaller batches of 10 to avoid overwhelming the system
          const batchSize = 10;
          for (let i = 0; i < pubkeysToFetch.length; i += batchSize) {
            const batch = pubkeysToFetch.slice(i, i + batchSize);
            setTimeout(() => {
              batch.forEach(pubkey => {
                fetchProfileData(pubkey);
              });
            }, i * 50); // Stagger requests with small delays
          }
        }
      }
      
      setLoadingFromCache(false);
    };
    
    loadFromCache();
  }, [feedType, following, activeHashtag, since, until, mediaOnly, fetchProfileData]);
  
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
    
    toast.info("Refreshing feed...");
    
    // Clear event buffer
    setEventBuffer([]);
    
    const newSubId = setupSubscription(newSince, currentTime);
    setSubId(newSubId);
  }, [feedType, following, activeHashtag, since, until, mediaOnly, subId, setSubId, setupSubscription]);

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
