
import { useState, useEffect } from "react";
import { nostrService, NostrEvent } from "@/lib/nostr";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";
import { useFeedEvents } from "./use-feed-events";

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
    limit: 100 // Higher limit for media posts to ensure we get enough media
  });
  
  // Filter events to only include media posts
  const [mediaEvents, setMediaEvents] = useState<NostrEvent[]>([]);
  
  useEffect(() => {
    // Process events to extract only those with media
    const eventsWithMedia = allEvents.filter(event => {
      // Check for URLs in content pointing to images or videos
      const hasImageUrl = 
        /https?:\/\/\S+\.(jpg|jpeg|png|gif|webp)/i.test(event.content);
      const hasVideoUrl = 
        /https?:\/\/\S+\.(mp4|webm|mov|avi)/i.test(event.content);
      
      // Check for nostr mime tags
      const hasMimeTag = event.tags && event.tags.some(tag => 
        tag[0] === 'media' || tag[0] === 'image' || tag[0] === 'video'
      );
      
      return hasImageUrl || hasVideoUrl || hasMimeTag;
    });
    
    setMediaEvents(eventsWithMedia);
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
