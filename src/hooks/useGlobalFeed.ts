
import { useState, useEffect, useCallback } from "react";
import { NostrEvent, nostrService } from "@/lib/nostr";
import { useProfileData } from "./useProfileData";
import { useNostrEvents } from "./useNostrEvents";
import { useFeedPagination } from "./useFeedPagination";
import { useFeedSubscription } from "./useFeedSubscription";
import { loadMoreGlobalFeedEvents, createGlobalFeedFilters } from "@/utils/globalFeedUtils";
import { useGlobalFeedReposts } from "./useGlobalFeedReposts";

interface UseGlobalFeedProps {
  activeHashtag?: string;
}

export const useGlobalFeed = ({ activeHashtag }: UseGlobalFeedProps) => {
  const [filteredEvents, setFilteredEvents] = useState<NostrEvent[]>([]);
  
  // Use our subscription hook to manage events
  const {
    events,
    profiles,
    repostData,
    loading,
    setLoading,
    subId,
    setSubId,
    subscribe,
    unsubscribe,
    setEvents,
    setProfiles,
    setRepostData
  } = useFeedSubscription({ filters: [] });
  
  // Use pagination hook
  const {
    since,
    until,
    hasMore,
    setHasMore,
    isLoadingMore,
    setIsLoadingMore,
    loadMoreEvents: basePaginationLoadMore,
    resetPagination
  } = useFeedPagination({
    events,
    setEvents,
    onLoadMore: (newSince, newUntil) => setupSubscription(newSince, newUntil)
  });
  
  const { fetchProfileData } = useProfileData();
  const { fetchOriginalPost: fetchOriginalPostBase } = useNostrEvents();
  
  const fetchOriginalPost = useCallback((eventId: string) => {
    fetchOriginalPostBase(eventId, profiles, setEvents, fetchProfileData, setProfiles);
  }, [profiles, fetchOriginalPostBase, fetchProfileData, setEvents, setProfiles]);

  // Update filtered events when events change
  useEffect(() => {
    setFilteredEvents(events);
  }, [events]);

  // Use our repost handler
  const { handleRepostEvent } = useGlobalFeedReposts(fetchOriginalPost, setRepostData);

  const setupSubscription = useCallback((since: number, until?: number) => {
    // Create filters using our utility
    const filters = createGlobalFeedFilters(activeHashtag, since, until);

    // Close previous subscription if exists
    if (subId) {
      unsubscribe();
    }

    // Start a new subscription
    const newSubId = nostrService.subscribe(
      filters,
      (event) => {
        if (event.kind === 1) {
          // Regular note
          setEvents(prev => {
            // Check if we already have this event
            if (prev.some(e => e.id === event.id)) {
              return prev;
            }
            
            const newEvents = [...prev, event];
            
            // Sort by creation time (oldest first to show newest at bottom)
            newEvents.sort((a, b) => a.created_at - b.created_at);
            
            // If we've reached the limit, set hasMore to false
            if (newEvents.length >= 200) { // Increased limit for better doomscrolling
              setHasMore(false);
            }
            
            return newEvents;
          });
        }
        else if (event.kind === 6) {
          handleRepostEvent(event);
        }
        
        // Fetch profile data for this pubkey if we don't have it yet
        if (event.pubkey && !profiles[event.pubkey]) {
          fetchProfileData(event.pubkey, profiles, setProfiles);
        }
      }
    );
    
    setSubId(newSubId);
    return newSubId;
  }, [activeHashtag, profiles, subId, unsubscribe, setEvents, setHasMore, fetchProfileData, setProfiles, setSubId, handleRepostEvent]);

  const loadMoreEvents = useCallback(() => {
    if (!subId || isLoadingMore) return;
    
    // Use our utility to load more events
    loadMoreGlobalFeedEvents(
      since || Math.floor(Date.now() / 1000) - 24 * 60 * 60 * 2,
      until,
      setupSubscription,
      isLoadingMore,
      setIsLoadingMore,
      setLoading
    );
  }, [subId, isLoadingMore, since, until, setupSubscription, setIsLoadingMore, setLoading]);

  // Initialize feed
  useEffect(() => {
    const initFeed = async () => {
      try {
        // Connect to relays
        await nostrService.connectToDefaultRelays();
        
        // Reset state when filter changes
        setEvents([]);
        setFilteredEvents([]);
        setHasMore(true);
        setLoading(true);
        setIsLoadingMore(false);

        // Reset the timestamp range for new subscription
        const currentTime = resetPagination();

        // Start a new subscription
        setupSubscription(currentTime - 24 * 60 * 60 * 2, currentTime);
      } catch (error) {
        console.error("Error initializing global feed:", error);
        setLoading(false);
      }
    };
    
    initFeed();
    
    // Cleanup subscription when component unmounts
    return () => {
      if (subId) {
        unsubscribe();
      }
    };
  }, [activeHashtag, setupSubscription, resetPagination, unsubscribe, subId, setEvents, setHasMore, setLoading, setIsLoadingMore]);

  // Mark the loading as finished when we get events
  useEffect(() => {
    if (events.length > 0 && loading && !isLoadingMore) {
      setLoading(false);
    }
  }, [events, loading, isLoadingMore, setLoading]);

  const handleRetweetStatusChange = (eventId: string, isRetweeted: boolean) => {
    if (!isRetweeted) {
      // Filter out the unreposted event
      setFilteredEvents(prev => prev.filter(event => event.id !== eventId));
    }
  };

  return {
    events: filteredEvents,
    profiles,
    repostData,
    loading,
    hasMore,
    loadMoreEvents,
    handleRetweetStatusChange
  };
};
