import { useState, useEffect, useCallback } from "react";
import { NostrEvent, nostrService } from "@/lib/nostr";
import { useProfileData } from "./useProfileData";
import { useNostrEvents } from "./useNostrEvents";
import { useFeedPagination } from "./useFeedPagination";
import { useFeedSubscription } from "./useFeedSubscription";

interface UseGlobalFeedProps {
  activeHashtag?: string;
}

export const useGlobalFeed = ({ activeHashtag }: UseGlobalFeedProps) => {
  const [filteredEvents, setFilteredEvents] = useState<NostrEvent[]>([]);
  
  // Use our new subscription hook to manage events
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

  const setupSubscription = useCallback((since: number, until?: number) => {
    // Create filters for the nostr subscription
    let filters: any[] = [
      {
        kinds: [1], // Regular notes
        limit: 30, // Increased for better doomscrolling
        since: since,
        until: until
      },
      {
        kinds: [6], // Reposts
        limit: 20,
        since: since,
        until: until
      }
    ];
    
    // If we have an active hashtag, filter by it
    if (activeHashtag) {
      // Add tag filter
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
  }, [activeHashtag, profiles, subId, unsubscribe, setEvents, setHasMore, fetchProfileData, setProfiles, setSubId]);

  // Handle repost events
  const handleRepostEvent = useCallback((event: NostrEvent) => {
    try {
      // Some clients store the original event in content as JSON
      const content = JSON.parse(event.content);
      
      if (content.event && content.event.id) {
        const originalEventId = content.event.id;
        const originalEventPubkey = content.event.pubkey;
        
        // Track repost data for later display
        setRepostData(prev => ({
          ...prev,
          [originalEventId]: { 
            pubkey: event.pubkey,  // The reposter
            original: { id: originalEventId, pubkey: originalEventPubkey } as NostrEvent
          }
        }));
        
        // Fetch the original post
        fetchOriginalPost(originalEventId);
      }
    } catch (e) {
      // If parsing fails, try to get event reference from tags
      const eventReference = event.tags.find(tag => tag[0] === 'e');
      if (eventReference && eventReference[1]) {
        const originalEventId = eventReference[1];
        
        // Find pubkey reference
        const pubkeyReference = event.tags.find(tag => tag[0] === 'p');
        const originalEventPubkey = pubkeyReference ? pubkeyReference[1] : null;
        
        // Track repost data
        setRepostData(prev => ({
          ...prev,
          [originalEventId]: { 
            pubkey: event.pubkey,  // The reposter
            original: { id: originalEventId, pubkey: originalEventPubkey } as NostrEvent
          }
        }));
        
        // Fetch the original post
        fetchOriginalPost(originalEventId);
      }
    }
  }, [fetchOriginalPost, setRepostData]);

  const loadMoreEvents = useCallback(() => {
    if (!subId || isLoadingMore) return;
    
    // Set loading more state to prevent multiple simultaneous loads
    setIsLoadingMore(true);
    setLoading(true);
    
    // Use the pagination loadMoreEvents to handle loading more
    basePaginationLoadMore();
    
    // Reset loading more state after a short delay
    setTimeout(() => {
      setIsLoadingMore(false);
      setLoading(false);
    }, 2000);
  }, [subId, isLoadingMore, setIsLoadingMore, basePaginationLoadMore, setLoading]);

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
