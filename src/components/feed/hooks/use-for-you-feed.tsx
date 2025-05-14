
import { useState, useEffect, useCallback, useRef } from "react";
import { NostrEvent, nostrService } from "@/lib/nostr";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";
import { useFeedEvents } from "./use-feed-events";

interface UseForYouFeedProps {
  activeHashtag?: string;
  initialEvents?: NostrEvent[];
  initialProfiles?: Record<string, any>;
  initialRepostData?: Record<string, { pubkey: string, original: NostrEvent }>;
  initialHasMore?: boolean;
}

export function useForYouFeed({ 
  activeHashtag,
  initialEvents = [],
  initialProfiles = {},
  initialRepostData = {},
  initialHasMore = true
}: UseForYouFeedProps) {
  const [loadingMore, setLoadingMore] = useState(false);
  const [minLoadingTimeMet, setMinLoadingTimeMet] = useState(false);
  const minLoadingTimeRef = useRef<number | null>(null);
  const loadMoreTimeoutRef = useRef<number | null>(null);
  
  // If we're provided with initial state, use it
  const initialState = initialEvents.length > 0;
  
  const { 
    events, 
    profiles, 
    repostData, 
    subId,
    setEvents,
    refreshFeed,
    setProfiles,
    setRepostData
  } = useFeedEvents({
    activeHashtag,
    feedType: 'for-you',
    initialEvents,
    initialProfiles,
    initialRepostData
  });

  // Function for recording interactions (views, clicks, etc.) - placeholder for now
  const handleInteractionTracking = () => {
    // This could be implemented to track user interactions with posts
    // and improve personalization in the future
  };
  
  // Export this function without arguments
  const recordInteraction = handleInteractionTracking;
  
  const loadMoreEvents = useCallback(() => {
    if (loadingMore) return;
    setLoadingMore(true);
    
    // Logic for loading more events would go here
    // Currently simplified as a placeholder
    
    if (loadMoreTimeoutRef.current) {
      clearTimeout(loadMoreTimeoutRef.current);
    }
    
    loadMoreTimeoutRef.current = window.setTimeout(() => {
      setLoadingMore(false);
      loadMoreTimeoutRef.current = null;
    }, 1000);
  }, [loadingMore]);
  
  const {
    loadMoreRef,
    loading,
    hasMore
  } = useInfiniteScroll(loadMoreEvents, { 
    initialLoad: !initialState,
    threshold: 800,
    preservePosition: true
  });
  
  // Set up minimum loading time of 3 seconds
  useEffect(() => {
    if (!initialState) {
      // Set minimum loading time for better UX
      minLoadingTimeRef.current = window.setTimeout(() => {
        setMinLoadingTimeMet(true);
      }, 3000);
    } else {
      // If we have initial state, we can consider minimum loading time met
      setMinLoadingTimeMet(true);
    }
    
    return () => {
      if (minLoadingTimeRef.current) {
        clearTimeout(minLoadingTimeRef.current);
      }
    };
  }, [initialState]);
  
  return {
    events,
    profiles,
    repostData,
    loadMoreRef,
    loading,
    recordInteraction,
    hasMore,
    loadMoreEvents,
    loadingMore,
    minLoadingTimeMet,
    setEvents,
    setProfiles,
    setRepostData
  };
}
