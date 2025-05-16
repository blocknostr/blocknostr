
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
  const [noNewEvents, setNoNewEvents] = useState(false);
  const loadMoreTimeoutRef = useRef<number | null>(null);
  const retryTimeoutRef = useRef<number | null>(null);
  const newEventCountRef = useRef<number>(0);
  const cooldownRef = useRef<boolean>(false);
  
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
    limit: 30 // Increased from 20 to 30 for initial experience as requested
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
        // Create new subscription with slightly extended time range BEFORE closing old one
        const currentTime = Math.floor(Date.now() / 1000);
        const extendedTime = currentTime - 24 * 60 * 60 * (retryCount + 1); // Extend time range with each retry
        
        setSince(extendedTime);
        setUntil(currentTime);
        
        // Attempt to set up new subscription
        const newSubId = await setupSubscription(extendedTime, currentTime, hashtags);
        
        // Only close previous subscription after new one is created
        if (subId) {
          nostrService.unsubscribe(subId);
        }
        
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
    if (!subId || loadingMore || cooldownRef.current) return;
    
    console.log("[GlobalFeed] Loading more events triggered");
    setLoadingMore(true);
    cooldownRef.current = true;
    newEventCountRef.current = 0;
    
    // Cancel any existing timeout
    if (loadMoreTimeoutRef.current) {
      clearTimeout(loadMoreTimeoutRef.current);
    }
    
    try {
      // Find the oldest event in the current events array
      const oldestEvent = EventDeduplication.findOldestEvent(events);
      
      if (oldestEvent) {
        // Use the oldest event's timestamp for the new 'until' value
        const newUntil = oldestEvent.created_at - 1;
        
        // Get older posts from 7 days (increased from 72 hours)
        const newSince = newUntil - 7 * 24 * 60 * 60;
        
        console.log(`[GlobalFeed] Loading older posts from ${new Date(newSince * 1000).toISOString()} to ${new Date(newUntil * 1000).toISOString()}`);
        
        // 1. Start the new subscription BEFORE closing the old one - Critical Fix
        const newSubId = await setupSubscription(newSince, newUntil, hashtags);
        
        // 2. Only close previous subscription after new one is established
        if (subId) {
          nostrService.unsubscribe(subId);
          console.log("[GlobalFeed] Closed previous subscription after new one created");
        }
        
        setSince(newSince);
        setUntil(newUntil);
        setSubId(newSubId);
      } else {
        // If no events yet, get a broader time range
        const newUntil = until;
        const newSince = newUntil - 7 * 24 * 60 * 60; // Increased from 72 hours to 7 days
        
        console.log(`[GlobalFeed] No events yet, loading with broader range from ${new Date(newSince * 1000).toISOString()} to ${new Date(newUntil * 1000).toISOString()}`);
        
        // Create new subscription BEFORE closing old one
        const newSubId = await setupSubscription(newSince, newUntil, hashtags);
        
        if (subId) {
          nostrService.unsubscribe(subId);
        }
        
        setSince(newSince);
        setSubId(newSubId);
      }
    } catch (error) {
      console.error("Error loading more events:", error);
      toast.error("Failed to load more posts");
    }
    
    // Set loading more to false after a delay and prevent rapid re-firing
    loadMoreTimeoutRef.current = window.setTimeout(() => {
      setLoadingMore(false);
      loadMoreTimeoutRef.current = null;
      
      // Check if we received any new events
      console.log(`[GlobalFeed] Received ${newEventCountRef.current} new events`);
      if (newEventCountRef.current === 0) {
        console.log("[GlobalFeed] No new events received, setting hasMore = false");
        setNoNewEvents(true);
      }
      
      // Cooldown to prevent rapid repeated triggering
      setTimeout(() => {
        cooldownRef.current = false;
      }, 2000);
    }, 5000); // Increased from 2000ms to 5000ms for better reliability
  }, [subId, events, until, setupSubscription, loadingMore, hashtags]);
  
  // Initialize useInfiniteScroll inside the component
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

  // Update hasMore when noNewEvents changes
  useEffect(() => {
    if (noNewEvents) {
      setHasMore(false);
    }
  }, [noNewEvents, setHasMore]);

  // Track new events received - Fixed to use the useState variable
  useEffect(() => {
    const prevLength = { current: events.length };
    
    // No need for useRef here since we're using a closure
    if (events.length > prevLength.current) {
      const newCount = events.length - prevLength.current;
      newEventCountRef.current += newCount;
      console.log(`[GlobalFeed] Received ${newCount} new events (total: ${events.length})`);
    }
    
    prevLength.current = events.length;
  }, [events]);

  useEffect(() => {
    const initFeed = async () => {
      // Reset state when filter changes
      setEvents([]);
      setHasMore(true);
      setLoading(true);
      setRetryCount(0);
      setIsRetrying(false);
      setNoNewEvents(false);
      newEventCountRef.current = 0;

      // Reset the timestamp range for new subscription
      const currentTime = Math.floor(Date.now() / 1000);
      // Initial fetch goes back 7 days instead of 48 hours for better coverage
      const initialSince = currentTime - 7 * 24 * 60 * 60;
      setSince(initialSince);
      setUntil(currentTime);

      // Connect to relays in the background
      try {
        await nostrService.connectToUserRelays();
      } catch (error) {
        console.error("Error connecting to relays:", error);
      }

      try {
        // Start a new subscription with the appropriate hashtags
        const newSubId = await setupSubscription(initialSince, currentTime, hashtags);
        
        // Only close previous subscription after creating new one
        if (subId) {
          nostrService.unsubscribe(subId);
        }
        
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
  }, [activeHashtag, hashtags, subId, setEvents, setLoading, setupSubscription]);

  // Mark the loading as finished when we get events
  useEffect(() => {
    if (events.length > 0 && loading) {
      setLoading(false);
    }
  }, [events, loading, setLoading]);
  
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
    hasMore: hasMore && !noNewEvents,
    loadMoreEvents,
    loadingMore: loadingMore || scrollLoadingMore,
    refreshFeed,
    cacheHit
  };
}
