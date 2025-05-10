
import { useState, useEffect, useCallback } from "react";
import { NostrEvent, nostrService } from "@/lib/nostr";
import { useFeedSubscription } from "./useFeedSubscription";
import { useFeedPagination } from "./useFeedPagination";

interface UseFollowingFeedProps {
  activeHashtag?: string;
}

export const useFollowingFeed = ({ activeHashtag }: UseFollowingFeedProps) => {
  const [following, setFollowing] = useState<string[]>(nostrService.following);
  const [loading, setLoading] = useState(true);
  
  // Create filters for followed users based on the current state
  const createFilters = useCallback((since: number, until: number) => {
    if (following.length === 0) {
      return [];
    }
    
    // Create filters for followed users
    let filters: any[] = [
      {
        kinds: [1], // Regular notes
        authors: following,
        limit: 50,
        since: since,
        until: until
      },
      {
        kinds: [6], // Reposts
        authors: following,
        limit: 20,
        since: since,
        until: until
      }
    ];
    
    // If we have an active hashtag, filter by it
    if (activeHashtag) {
      filters = [
        {
          ...filters[0],
          "#t": [activeHashtag.toLowerCase()]
        },
        {
          ...filters[1] // Keep the reposts filter
        }
      ];
    }
    
    return filters;
  }, [following, activeHashtag]);
  
  // Use the feed subscription hook with initial empty filters
  const { 
    events, 
    profiles, 
    repostData, 
    setLoading: setSubscriptionLoading,
    subId,
    subscribe,
    unsubscribe,
    setEvents
  } = useFeedSubscription({ 
    filters: [] // We'll update this when we have the actual filters
  });
  
  // Use the feed pagination hook
  const { 
    hasMore, 
    setHasMore,
    isLoadingMore,
    loadMoreEvents: paginationLoadMore,
    resetPagination
  } = useFeedPagination({ 
    events, 
    setEvents,
    onLoadMore: (newSince, newUntil) => {
      // Unsubscribe from current subscription
      unsubscribe();
      
      // Create new filters for the new time range
      const filters = createFilters(newSince, newUntil);
      
      if (filters.length > 0) {
        // Start a new subscription with the new filters
        setLoading(true);
        subscribe();
      }
    }
  });
  
  // Wrapper function for loadMoreEvents to be passed to useInfiniteScroll
  const loadMoreEvents = useCallback(() => {
    if (following.length === 0 || isLoadingMore) return;
    paginationLoadMore();
  }, [following, isLoadingMore, paginationLoadMore]);
  
  // Initialize feed
  useEffect(() => {
    const initFeed = async () => {
      try {
        // Connect to relays
        await nostrService.connectToUserRelays();
        
        // Reset state when filter changes
        setEvents([]);
        setHasMore(true);
        setLoading(true);
        
        // Update following from nostrService
        setFollowing(nostrService.following);
        
        // Reset the timestamp range for new subscription
        const currentTime = resetPagination();
        
        // Close previous subscription if exists
        unsubscribe();
        
        // Create new filters and subscribe
        const filters = createFilters(currentTime - 24 * 60 * 60 * 7, currentTime);
        
        if (filters.length > 0) {
          subscribe();
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error("Error initializing following feed:", error);
        setLoading(false);
      }
    };
    
    initFeed();
    
  }, [following.length, activeHashtag, subscribe, unsubscribe, setEvents, setHasMore, resetPagination, createFilters]);
  
  // Mark the loading as finished when we get events
  useEffect(() => {
    if (events.length > 0 && loading && !isLoadingMore) {
      setLoading(false);
      setSubscriptionLoading(false);
    }
  }, [events, loading, isLoadingMore, setSubscriptionLoading]);
  
  // Update following state when nostrService.following changes
  useEffect(() => {
    setFollowing(nostrService.following);
  }, [nostrService.following]);

  return {
    events,
    profiles,
    repostData,
    loading,
    hasMore,
    loadMoreEvents,
    following
  };
};
