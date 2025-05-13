
import { useState, useEffect } from "react";
import { nostrService, NostrEvent } from "@/lib/nostr";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";
import { useFeedEvents } from "./use-feed-events";
import { getMediaUrlsFromEvent, getMediaItemsFromEvent } from "@/lib/nostr/utils/media-extraction";

interface UseMediaFeedProps {
  activeHashtag?: string;
}

export function useMediaFeed({ activeHashtag }: UseMediaFeedProps) {
  const [since, setSince] = useState<number | undefined>(undefined);
  const [until, setUntil] = useState(Math.floor(Date.now() / 1000));
  
  const { 
    events: allEvents, 
    profiles, 
    repostData, 
    subId, 
    setSubId, 
    setupSubscription
  } = useFeedEvents({
    since,
    until,
    activeHashtag,
    limit: 100, // Higher limit for media posts to ensure we get enough media
    feedType: 'media',
    mediaOnly: true // Signal to the cache manager this is a media-specific feed
  });
  
  // Filter events to only include media posts using proper utilities
  const [mediaEvents, setMediaEvents] = useState<NostrEvent[]>([]);
  
  useEffect(() => {
    // Process events to extract only those with media using proper utilities
    try {
      console.log(`[MediaFeed] Processing ${allEvents.length} events for media content`);
      
      const eventsWithMedia = allEvents.filter(event => {
        try {
          // Use the robust utility function to check for media
          const mediaUrls = getMediaUrlsFromEvent(event);
          const mediaItems = getMediaItemsFromEvent(event);
          
          // Event has media if we found any URLs or media items
          return (mediaUrls.length > 0 || mediaItems.length > 0);
        } catch (error) {
          console.error(`[MediaFeed] Error detecting media in event ${event.id}:`, error);
          return false; // Skip events that cause errors
        }
      });
      
      console.log(`[MediaFeed] Found ${eventsWithMedia.length} events with media out of ${allEvents.length} total`);
      setMediaEvents(eventsWithMedia);
    } catch (error) {
      console.error("[MediaFeed] Error processing events for media:", error);
    }
  }, [allEvents]);
  
  const loadMoreEvents = () => {
    if (!subId) return;
    
    // Close previous subscription
    if (subId) {
      nostrService.unsubscribe(subId);
    }

    // Create new subscription with older timestamp range
    if (!since) {
      const oldestEvent = allEvents.length > 0 ? 
        allEvents.reduce((oldest, current) => oldest.created_at < current.created_at ? oldest : current) : 
        null;
      
      const newUntil = oldestEvent ? oldestEvent.created_at - 1 : until - 24 * 60 * 60;
      const newSince = newUntil - 24 * 60 * 60; // 24 hours before until
      
      setSince(newSince);
      setUntil(newUntil);
      
      const newSubId = setupSubscription(newSince, newUntil);
      setSubId(newSubId);
    } else {
      const newUntil = since;
      const newSince = newUntil - 24 * 60 * 60;
      
      setSince(newSince);
      setUntil(newUntil);
      
      const newSubId = setupSubscription(newSince, newUntil);
      setSubId(newSubId);
    }
  };
  
  const {
    loadMoreRef,
    loading,
    setLoading,
    hasMore,
    setHasMore
  } = useInfiniteScroll(loadMoreEvents, { initialLoad: true });

  useEffect(() => {
    const initFeed = async () => {
      try {
        await nostrService.connectToUserRelays();
        
        // Reset state when filter changes
        setMediaEvents([]);
        setHasMore(true);
        setLoading(true);

        // Reset the timestamp range for new subscription
        const currentTime = Math.floor(Date.now() / 1000);
        setSince(undefined);
        setUntil(currentTime);

        if (subId) {
          nostrService.unsubscribe(subId);
        }
        
        const newSubId = setupSubscription(currentTime - 24 * 60 * 60, currentTime);
        setSubId(newSubId);
        setLoading(false);
      } catch (error) {
        console.error("[MediaFeed] Error initializing feed:", error);
        setLoading(false);
      }
    };
    
    initFeed();
    
    return () => {
      if (subId) {
        nostrService.unsubscribe(subId);
      }
    };
  }, [activeHashtag]);

  useEffect(() => {
    if (mediaEvents.length > 0 && loading) {
      setLoading(false);
    }
    
    if (allEvents.length >= 200) {
      setHasMore(false);
    }
  }, [mediaEvents, allEvents, loading]);

  return {
    events: mediaEvents,
    profiles,
    repostData,
    loadMoreRef,
    loading,
    hasMore
  };
}
