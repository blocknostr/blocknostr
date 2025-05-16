
import { useState, useEffect, useCallback, useRef } from "react";
import { nostrService } from "@/lib/nostr";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";
import { useFeedEvents } from "./use-feed-events";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { EventDeduplication } from "@/lib/nostr/utils/event-deduplication";
import { toast } from "sonner";
import { retry } from "@/lib/utils/retry";

interface UseGlobalFeedProps {
  activeHashtag?: string;
}

export function useGlobalFeed({ activeHashtag }: UseGlobalFeedProps) {
  const { preferences } = useUserPreferences();
  const [since, setSince] = useState<number | undefined>(undefined);
  const [until, setUntil] = useState(Math.floor(Date.now() / 1000));
  const [loadingMore, setLoadingMore] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const loadMoreTimeoutRef = useRef<number | null>(null);
  const retryTimeoutRef = useRef<number | null>(null);
  
  // Get the hashtags to filter by - either the active hashtag or the default ones
  const hashtags = activeHashtag 
    ? [activeHashtag] 
    : preferences.feedFilters.globalFeedTags;
  
  const { 
    events, 
    profiles, 
    repostData, 
    subId, 
    setSubId,
    setupSubscription, 
    setEvents,
    refreshFeed,
    cacheHit,
    loadingFromCache
  } = useFeedEvents({
    since,
    until,
    hashtags,
    limit: 30 // Increased from 20 for better initial experience
  });
  
  // Function to retry loading posts if none are found initially
  const retryLoadingPosts = useCallback(async () => {
    if (events.length === 0 && !isRetrying && retryCount < 3) {
      setIsRetrying(true);
      
      // Cancel any existing timeout
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      
      // Wait a bit before retrying
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      try {
        // Close previous subscription
        if (subId) {
          nostrService.unsubscribe(subId);
        }
        
        // Create new subscription with slightly extended time range
        const currentTime = Math.floor(Date.now() / 1000);
        const extendedTime = currentTime - 24 * 60 * 60 * (retryCount + 1); // Extend time range with each retry
        
        setSince(extendedTime);
        setUntil(currentTime);
        
        // Attempt to set up new subscription
        const newSubId = await setupSubscription(extendedTime, currentTime, hashtags);
        
        if (newSubId) {
          setSubId(newSubId);
          setRetryCount(prev => prev + 1);
        }
      } catch (error) {
        console.error("Error during retry:", error);
      } finally {
        // End retry state after a delay
        retryTimeoutRef.current = window.setTimeout(() => {
          setIsRetrying(false);
          retryTimeoutRef.current = null;
        }, 3000);
      }
    }
  }, [events.length, isRetrying, retryCount, subId, setupSubscription, hashtags]);
  
  const loadMoreEvents = useCallback(async () => {
    if (!subId || loadingMore) return;
    setLoadingMore(true);
    
    // Cancel any existing timeout
    if (loadMoreTimeoutRef.current) {
      clearTimeout(loadMoreTimeoutRef.current);
    }
    
    try {
      // Close previous subscription
      if (subId) {
        nostrService.unsubscribe(subId);
      }
      
      // Find the oldest event in the current events array
      const oldestEvent = EventDeduplication.findOldestEvent(events);
      
      if (oldestEvent) {
        // Use the oldest event's timestamp for the new 'until' value
        const newUntil = oldestEvent.created_at - 1;
        // Get older posts from the last 72 hours
        const newSince = newUntil - 72 * 60 * 60;
        
        setSince(newSince);
        setUntil(newUntil);
        
        // Start the new subscription with the older timestamp range
        const newSubId = await setupSubscription(newSince, newUntil, hashtags);
        setSubId(newSubId);
      } else {
        // If no events yet, get a broader time range
        const newUntil = until;
        const newSince = newUntil - 72 * 60 * 60;
        
        setSince(newSince);
        
        // Start the new subscription with the older timestamp range
        const newSubId = await setupSubscription(newSince, newUntil, hashtags);
        setSubId(newSubId);
      }
    } catch (error) {
      console.error("Error loading more events:", error);
      toast.error("Failed to load more posts");
    }
    
    // Set loading more to false after a delay
    loadMoreTimeoutRef.current = window.setTimeout(() => {
      setLoadingMore(false);
      loadMoreTimeoutRef.current = null;
    }, 2000);
  }, [subId, events, until, setupSubscription, loadingMore, hashtags]);
  
  const {
    loadMoreRef,
    loading,
    setLoading,
    hasMore,
    setHasMore,
    loadingMore: scrollLoadingMore
  } = useInfiniteScroll(loadMoreEvents, { 
    initialLoad: true,
    threshold: 800,
    aggressiveness: 'medium',
    preservePosition: true
  });

  useEffect(() => {
    const initFeed = async () => {
      // Reset state when filter changes
      setEvents([]);
      setHasMore(true);
      setLoading(true);
      setRetryCount(0);
      setIsRetrying(false);

      // Reset the timestamp range for new subscription
      const currentTime = Math.floor(Date.now() / 1000);
      setSince(undefined);
      setUntil(currentTime);

      // Connect to relays in the background
      try {
        await nostrService.connectToUserRelays();
      } catch (error) {
        console.error("Error connecting to relays:", error);
      }

      // Close previous subscription if exists
      if (subId) {
        nostrService.unsubscribe(subId);
      }
      
      try {
        // Start a new subscription with the appropriate hashtags
        const newSubId = await setupSubscription(currentTime - 48 * 60 * 60, currentTime, hashtags);
        setSubId(newSubId);
        setLoading(false);
      } catch (error) {
        console.error("Error setting up subscription:", error);
        setLoading(false);
      }
    };
    
    initFeed();
    
    // Listen for refetch events
    const handleRefetch = () => {
      initFeed();
    };
    
    window.addEventListener('refetch-global-feed', handleRefetch);
    
    // Cleanup subscription and timeout when component unmounts
    return () => {
      if (subId) {
        nostrService.unsubscribe(subId);
      }
      if (loadMoreTimeoutRef.current) {
        clearTimeout(loadMoreTimeoutRef.current);
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      window.removeEventListener('refetch-global-feed', handleRefetch);
    };
  }, [activeHashtag, hashtags]);

  // Mark the loading as finished when we get events
  useEffect(() => {
    if (events.length > 0 && loading) {
      setLoading(false);
    }
  }, [events, loading]);
  
  // Add automatic retry if no events are found after initial loading
  useEffect(() => {
    // Check if loading has finished but we have no events
    if (!loading && !loadingFromCache && events.length === 0 && !isRetrying) {
      retryLoadingPosts();
    }
  }, [loading, loadingFromCache, events.length, isRetrying, retryLoadingPosts]);

  return {
    events,
    profiles,
    repostData,
    loadMoreRef,
    loading: loading || isRetrying,
    hasMore,
    loadMoreEvents,
    loadingMore: loadingMore || scrollLoadingMore,
    refreshFeed,
    cacheHit
  };
}
