
import { useState, useEffect, useCallback, useRef } from "react";
import { NostrEvent, nostrService, contentCache } from "@/lib/nostr";
import { useProfileFetcher } from "./use-profile-fetcher";
import { useEventSubscription } from "./use-event-subscription";
import { useRepostHandler } from "./use-repost-handler";
import { EventDeduplication } from "@/lib/nostr/utils/event-deduplication";

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
  const subscriptionSetupInProgress = useRef<boolean>(false);
  
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
  const { subId, setSubId, setupSubscription, connectionAttemptsMade } = useEventSubscription({
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
  
  // Try to load from cache first when component mounts or dependencies change
  useEffect(() => {
    const loadFromCache = async () => {
      // Prevent loading from cache if already loading
      if (loadingFromCache) return;
      
      setLoadingFromCache(true);
      
      try {
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
          setEvents(prev => {
            if (prev.length === 0) {
              return cachedFeed;
            }
            
            // Merge with existing events if we have any
            return EventDeduplication.mergeEvents(prev, cachedFeed);
          });
          
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
      } catch (error) {
        console.error("Error loading from cache:", error);
      } finally {
        setLoadingFromCache(false);
      }
    };
    
    loadFromCache();
  }, [feedType, following, activeHashtag, effectiveHashtags, since, until, mediaOnly, fetchProfileData, loadingFromCache]);
  
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
    
    // Reset in-progress flag to allow setup of a new subscription
    subscriptionSetupInProgress.current = false;
    
    // Setup a new subscription with latest timestamp range
    const currentTime = Math.floor(Date.now() / 1000);
    const newSince = currentTime - 24 * 60 * 60; // Last 24 hours
    
    // Set up the new subscription
    setupSubscription(newSince, currentTime, effectiveHashtags)
      .then(newSubId => {
        if (newSubId) {
          console.log("[useFeedEvents] Refreshed subscription:", newSubId);
        }
      })
      .catch(error => {
        console.error("[useFeedEvents] Error refreshing feed:", error);
      });
  }, [feedType, following, activeHashtag, since, until, mediaOnly, subId, effectiveHashtags, setupSubscription]);

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
    connectionAttemptsMade
  };
}
