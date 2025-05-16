
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
  const [hasMore, setHasMore] = useState(true);
  const loadMoreTimeoutRef = useRef<number | null>(null);
  const retryTimeoutRef = useRef<number | null>(null);
  const initialLoadRef = useRef(true);
  
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
  
  // Define loadMoreEvents function first to avoid reference errors
  const loadMoreEvents = useCallback(async () => {
    if (!hasMore || loadingMore) return;
    
    console.log("[useGlobalFeed] Loading more events triggered, current events count:", events.length);
    setLoadingMore(true);
    
    // Cancel any existing timeout
    if (loadMoreTimeoutRef.current) {
      clearTimeout(loadMoreTimeoutRef.current);
    }
    
    try {
      // Find the oldest event timestamp in the current events array
      const oldestEvent = EventDeduplication.findOldestEvent(events);
      
      if (oldestEvent) {
        // CRITICAL FIX: Create a new subscription BEFORE closing the old one
        console.log("[useGlobalFeed] Oldest event timestamp:", new Date(oldestEvent.created_at * 1000));
        
        // Use the oldest event's timestamp for the new 'until' value
        const newUntil = oldestEvent.created_at - 1; // Subtract 1 second to avoid overlap
        // Get older posts from the last 10 days (increased from 7 days)
        const newSince = newUntil - 10 * 24 * 60 * 60;
        
        console.log("[useGlobalFeed] Loading older posts from", new Date(newSince * 1000), "to", new Date(newUntil * 1000));
        
        // Start the new subscription with the older timestamp range
        // CRITICAL FIX: Start new subscription before closing the old one
        const newSubId = await setupSubscription(newSince, newUntil, hashtags);
        
        if (newSubId) {
          console.log("[useGlobalFeed] New subscription created:", newSubId);
          
          // Only after new subscription is created, close the old one
          if (subId) {
            setTimeout(() => {
              console.log("[useGlobalFeed] Closing old subscription:", subId);
              nostrService.unsubscribe(subId);
            }, 2000); // Give 2 seconds overlap to ensure events flow
          }
          
          // Set the new subscription ID
          setSubId(newSubId);
          
          // Update the timestamp parameters
          setSince(newSince);
          setUntil(newUntil);
        } else {
          console.error("[useGlobalFeed] Failed to create new subscription");
        }
      } else {
        console.warn("[useGlobalFeed] No events to determine oldest timestamp");
        
        // If no events yet, get a broader time range
        const currentTime = Math.floor(Date.now() / 1000);
        const newUntil = currentTime - (24 * 60 * 60); // Start from 1 day ago
        const newSince = newUntil - (10 * 24 * 60 * 60); // Go back 10 days
        
        console.log("[useGlobalFeed] Trying broader time range:", new Date(newSince * 1000), "to", new Date(newUntil * 1000));
        
        // Create new subscription for this broader range
        const newSubId = await setupSubscription(newSince, newUntil, hashtags);
        
        if (newSubId) {
          if (subId) {
            setTimeout(() => nostrService.unsubscribe(subId), 2000);
          }
          
          setSubId(newSubId);
          setSince(newSince);
          setUntil(newUntil);
        }
      }
    } catch (error) {
      console.error("[useGlobalFeed] Error loading more events:", error);
      toast.error("Failed to load more posts");
    }
    
    // Set loading more to false after a delay
    // CRITICAL FIX: Use a longer timeout to ensure events have time to arrive
    loadMoreTimeoutRef.current = window.setTimeout(() => {
      console.log("[useGlobalFeed] Finished loading more (setting loadingMore=false)");
      setLoadingMore(false);
      loadMoreTimeoutRef.current = null;
    }, 3000); // Increased from 1000ms to 3000ms
  }, [events, hashtags, loadingMore, setupSubscription, subId, hasMore]);
  
  // Now we can use useInfiniteScroll after loadMoreEvents is defined
  const {
    loadMoreRef,
    loading,
    setLoading,
    loadingMore: scrollLoadingMore
  } = useInfiniteScroll(loadMoreEvents, { 
    initialLoad: true,
    threshold: 1000,
    aggressiveness: 'high', // Changed from 'medium' to 'high' for more aggressive loading
    preservePosition: true
  });
  
  // Function to retry loading posts if none are found initially
  const retryLoadingPosts = useCallback(async () => {
    if (events.length === 0 && !isRetrying && retryCount < 3) {
      console.log("[useGlobalFeed] Retrying post fetch, attempt:", retryCount + 1);
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
        
        // Create new subscription with extended time range
        const currentTime = Math.floor(Date.now() / 1000);
        const extendedTime = currentTime - 24 * 60 * 60 * (retryCount + 1); // Extend time range with each retry
        
        console.log("[useGlobalFeed] Retry with extended time range:", new Date(extendedTime * 1000), "to", new Date(currentTime * 1000));
        
        setSince(extendedTime);
        setUntil(currentTime);
        
        // Attempt to set up new subscription
        const newSubId = await setupSubscription(extendedTime, currentTime, hashtags);
        
        if (newSubId) {
          setSubId(newSubId);
          setRetryCount(prev => prev + 1);
          console.log("[useGlobalFeed] Retry subscription created:", newSubId);
        }
      } catch (error) {
        console.error("[useGlobalFeed] Error during retry:", error);
      } finally {
        // End retry state after a delay
        retryTimeoutRef.current = window.setTimeout(() => {
          setIsRetrying(false);
          retryTimeoutRef.current = null;
        }, 3000);
      }
    }
  }, [events.length, isRetrying, retryCount, subId, setupSubscription, hashtags]);

  useEffect(() => {
    const initFeed = async () => {
      console.log("[useGlobalFeed] Initializing feed, hashtags:", hashtags);
      
      // Reset state when filter changes
      setEvents([]);
      setHasMore(true);
      setLoading(true);
      setRetryCount(0);
      setIsRetrying(false);
      initialLoadRef.current = true;

      // Reset the timestamp range for new subscription
      const currentTime = Math.floor(Date.now() / 1000);
      setSince(currentTime - 48 * 60 * 60); // Last 48 hours initially
      setUntil(currentTime);

      // Connect to relays in the background
      try {
        await nostrService.connectToUserRelays();
      } catch (error) {
        console.error("[useGlobalFeed] Error connecting to relays:", error);
      }

      // Close previous subscription if exists
      if (subId) {
        nostrService.unsubscribe(subId);
      }
      
      try {
        // Start a new subscription with the appropriate hashtags
        const newSubId = await setupSubscription(currentTime - 48 * 60 * 60, currentTime, hashtags);
        setSubId(newSubId);
        console.log("[useGlobalFeed] Initial subscription created:", newSubId);
        setLoading(false);
      } catch (error) {
        console.error("[useGlobalFeed] Error setting up subscription:", error);
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
  
  // Debug logging for event count changes
  useEffect(() => {
    console.log("[useGlobalFeed] Events count updated:", events.length);
  }, [events.length]);

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
