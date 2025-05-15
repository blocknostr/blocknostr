
import { useState, useEffect, useCallback } from "react";
import { NostrEvent, nostrService, contentCache } from "@/lib/nostr";
import { useProfileFetcher } from "./use-profile-fetcher";
import { useRepostHandler } from "./use-repost-handler";
import { EventDeduplication } from "@/lib/nostr/utils/event-deduplication";
import { toast } from "sonner";
import { useInView } from "react-intersection-observer";
import { NostrFilter } from "./use-event-subscription";

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
  const { ref: loadMoreRef, inView } = useInView();
  const [events, setEvents] = useState<NostrEvent[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [cacheHit, setCacheHit] = useState<boolean>(false);
  const [loadingFromCache, setLoadingFromCache] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected'>('connecting');
  
  const { profiles, fetchProfileData } = useProfileFetcher();
  const { repostData, handleRepost } = useRepostHandler({ fetchProfileData });
  
  // Setup subscription helper function
  const setupSubscription = useCallback((fromTimestamp?: number, toTimestamp?: number) => {
    // Build filters
    const filters: NostrFilter[] = [];
    
    const baseFilter: NostrFilter = {
      kinds: [1, 6], // Note and repost kinds
      limit,
    };
    
    if (fromTimestamp) {
      baseFilter.since = fromTimestamp;
    }
    
    if (toTimestamp) {
      baseFilter.until = toTimestamp;
    }
    
    // Add hashtag filter if needed
    if (activeHashtag) {
      baseFilter["#t"] = [activeHashtag];
    }
    
    // Add media filter if needed
    if (mediaOnly) {
      baseFilter["#r"] = []; // This is a placeholder, actually need proper image detection
    }
    
    if (following && following.length > 0) {
      // Following feed
      baseFilter.authors = following;
      filters.push(baseFilter);
    } else {
      // Global feed
      filters.push(baseFilter);
    }
    
    // Subscribe to events
    const subId = nostrService.subscribe(
      filters,
      (event) => {
        // Process the incoming event
        setEvents(prevEvents => {
          // Check if we already have this event
          if (prevEvents.some(e => e.id === event.id)) {
            return prevEvents;
          }
          
          // Process repost if needed
          if (event.kind === 6) {
            try {
              const tags = event.tags || [];
              const eventTag = tags.find(tag => tag[0] === 'e');
              const pubkeyTag = tags.find(tag => tag[0] === 'p');
              
              if (eventTag && eventTag[1] && pubkeyTag && pubkeyTag[1]) {
                handleRepost(event.id, pubkeyTag[1], eventTag[1]);
              }
            } catch (e) {
              console.error("Error processing repost:", e);
            }
          }
          
          // Fetch profile for this event
          if (event.pubkey) {
            fetchProfileData(event.pubkey);
          }
          
          // Add to events and sort (newest first)
          const updatedEvents = [...prevEvents, event]
            .sort((a, b) => b.created_at - a.created_at);
            
          // Cache the feed
          contentCache.feedCache.saveFeed(feedType, updatedEvents, {
            authorPubkeys: following,
            hashtag: activeHashtag,
            since,
            until,
            mediaOnly
          });
          
          return updatedEvents;
        });
        
        // Update status
        setLoading(false);
      }
    );
    
    return subId;
  }, [following, activeHashtag, since, until, limit, mediaOnly, feedType, fetchProfileData, handleRepost]);
  
  // Load from cache first when component mounts
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
  }, [feedType, following, activeHashtag, since, until, mediaOnly, fetchProfileData]);
  
  // Setup connection status check
  useEffect(() => {
    const updateConnectionStatus = () => {
      const relays = nostrService.getRelayStatus();
      // Convert statuses to strings for safe comparison
      const connected = relays.filter(r => {
        return r.status === 1 || String(r.status) === "1" || r.status === "connected";
      }).length;
      
      if (connected > 0) {
        setConnectionStatus('connected');
      } else if (relays.length === 0 || !navigator.onLine) {
        setConnectionStatus('disconnected');
      } else {
        setConnectionStatus('connecting');
      }
    };
    
    // Initial check
    updateConnectionStatus();
    
    // Setup interval for checking
    const interval = setInterval(updateConnectionStatus, 5000);
    
    return () => {
      clearInterval(interval);
    };
  }, []);
  
  // Setup subscription when connection is ready
  useEffect(() => {
    if (connectionStatus !== 'connected' || cacheHit) {
      return;
    }
    
    const currentTime = Math.floor(Date.now() / 1000);
    const fromTime = currentTime - 24 * 60 * 60; // Last 24 hours
    
    const subId = setupSubscription(fromTime, currentTime);
    
    return () => {
      if (subId) {
        nostrService.unsubscribe(subId);
      }
    };
  }, [connectionStatus, cacheHit, setupSubscription]);
  
  // Handle load more when scrolling to bottom
  useEffect(() => {
    if (inView && hasMore && !loadingMore && connectionStatus === 'connected') {
      loadMoreEvents();
    }
  }, [inView, hasMore, loadingMore, connectionStatus]);
  
  // Function to load more events
  const loadMoreEvents = useCallback(() => {
    if (!hasMore || loadingMore || events.length === 0) return;
    
    setLoadingMore(true);
    
    // Find the oldest event
    const oldestEvent = events.reduce((prev, curr) => {
      return prev.created_at < curr.created_at ? prev : curr;
    }, events[0]);
    
    const oldestTimestamp = oldestEvent.created_at - 1;
    
    // Build filters
    const filters: NostrFilter[] = [];
    
    const baseFilter: NostrFilter = {
      kinds: [1, 6], // Note and repost kinds
      limit,
      until: oldestTimestamp
    };
    
    // Add hashtag filter if needed
    if (activeHashtag) {
      baseFilter["#t"] = [activeHashtag];
    }
    
    // Add media filter if needed
    if (mediaOnly) {
      baseFilter["#r"] = []; // This is a placeholder, actually need proper image detection
    }
    
    if (following && following.length > 0) {
      // Following feed
      baseFilter.authors = following;
      filters.push(baseFilter);
    } else {
      // Global feed
      filters.push(baseFilter);
    }
    
    // Subscribe to older events
    const subId = nostrService.subscribe(
      filters,
      (event) => {
        // Process the incoming event
        setEvents(prevEvents => {
          // Check if we already have this event
          if (prevEvents.some(e => e.id === event.id)) {
            return prevEvents;
          }
          
          // Process repost if needed
          if (event.kind === 6) {
            try {
              const tags = event.tags || [];
              const eventTag = tags.find(tag => tag[0] === 'e');
              const pubkeyTag = tags.find(tag => tag[0] === 'p');
              
              if (eventTag && eventTag[1] && pubkeyTag && pubkeyTag[1]) {
                handleRepost(event.id, pubkeyTag[1], eventTag[1]);
              }
            } catch (e) {
              console.error("Error processing repost:", e);
            }
          }
          
          // Fetch profile for this event
          if (event.pubkey) {
            fetchProfileData(event.pubkey);
          }
          
          // Add to events and sort (newest first)
          return [...prevEvents, event]
            .sort((a, b) => b.created_at - a.created_at);
        });
      },
      undefined,
      () => {
        // When done
        setLoadingMore(false);
        
        // Check if we have more events
        setTimeout(() => {
          const uniqueIds = new Set(events.map(e => e.id));
          if (uniqueIds.size === events.length) {
            // No new events were added
            setHasMore(false);
          }
        }, 1000);
      }
    );
    
    // Timeout to stop loading after a while
    setTimeout(() => {
      if (subId) {
        nostrService.unsubscribe(subId);
        setLoadingMore(false);
      }
    }, 15000);
    
  }, [events, following, activeHashtag, limit, loadingMore, hasMore, mediaOnly, fetchProfileData, handleRepost]);
  
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
    setLoading(true);
    setEvents([]);
    
    // Setup a new subscription
    const currentTime = Math.floor(Date.now() / 1000);
    const fromTime = currentTime - 24 * 60 * 60; // Last 24 hours
    
    toast.info("Refreshing feed...");
    
    setupSubscription(fromTime, currentTime);
  }, [feedType, following, activeHashtag, since, until, mediaOnly, setupSubscription]);

  return {
    events,
    profiles,
    repostData,
    loadMoreRef,
    loading,
    refreshFeed,
    lastUpdated,
    cacheHit,
    loadingFromCache,
    loadingMore,
    hasMore,
    loadMoreEvents,
    connectionStatus
  };
}
