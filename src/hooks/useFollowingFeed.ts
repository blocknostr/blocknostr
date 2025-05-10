import { useState, useEffect, useCallback } from "react";
import { NostrEvent, nostrService } from "@/lib/nostr";
import { useProfileData } from "./useProfileData";
import { useNostrEvents } from "./useNostrEvents";

interface UseFollowingFeedProps {
  activeHashtag?: string;
}

export const useFollowingFeed = ({ activeHashtag }: UseFollowingFeedProps) => {
  const [events, setEvents] = useState<NostrEvent[]>([]);
  const [profiles, setProfiles] = useState<Record<string, any>>({});
  const [repostData, setRepostData] = useState<Record<string, { pubkey: string, original: NostrEvent }>>({});
  const following = nostrService.following;
  const [since, setSince] = useState<number | undefined>(undefined);
  const [until, setUntil] = useState(Math.floor(Date.now() / 1000));
  const [subId, setSubId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  
  const { fetchProfileData } = useProfileData();
  const { fetchOriginalPost: fetchOriginalPostBase } = useNostrEvents();
  
  const fetchOriginalPost = useCallback((eventId: string) => {
    fetchOriginalPostBase(eventId, profiles, setEvents, fetchProfileData, setProfiles);
  }, [profiles, fetchOriginalPostBase, fetchProfileData]);

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
  }, [fetchOriginalPost]);

  const setupSubscription = useCallback((since: number, until?: number) => {
    if (following.length === 0) {
      setLoading(false);
      return null;
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
    
    // Subscribe to events
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
            if (newEvents.length >= 100) {
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
    
    return newSubId;
  }, [following, activeHashtag, profiles, handleRepostEvent, fetchProfileData]);

  const loadMoreEvents = useCallback(() => {
    if (!subId || following.length === 0) return;
    
    // Close previous subscription
    nostrService.unsubscribe(subId);

    // Create new subscription with older timestamp range
    if (!since) {
      // If no since value yet, get the oldest post timestamp
      const oldestEvent = events.length > 0 ? 
        events.reduce((oldest, current) => oldest.created_at < current.created_at ? oldest : current) : 
        null;
      
      const newUntil = oldestEvent ? oldestEvent.created_at - 1 : until - 24 * 60 * 60;
      const newSince = newUntil - 24 * 60 * 60 * 7; // 7 days before until
      
      setSince(newSince);
      setUntil(newUntil);
      
      // Start the new subscription with the older timestamp range
      const newSubId = setupSubscription(newSince, newUntil);
      setSubId(newSubId);
    } else {
      // We already have a since value, so use it to get older posts
      const newUntil = since;
      const newSince = newUntil - 24 * 60 * 60 * 7; // 7 days before until
      
      setSince(newSince);
      setUntil(newUntil);
      
      // Start the new subscription with the older timestamp range
      const newSubId = setupSubscription(newSince, newUntil);
      setSubId(newSubId);
    }
  }, [subId, following, events, since, until, setupSubscription]);

  // Initialize feed
  useEffect(() => {
    const initFeed = async () => {
      // Connect to relays
      await nostrService.connectToUserRelays();
      
      // Reset state when filter changes
      setEvents([]);
      setHasMore(true);
      setLoading(true);
      
      // Reset the timestamp range for new subscription
      const currentTime = Math.floor(Date.now() / 1000);
      setSince(undefined);
      setUntil(currentTime);
      
      // Close previous subscription if exists
      if (subId) {
        nostrService.unsubscribe(subId);
      }
      
      // Start a new subscription
      const newSubId = setupSubscription(currentTime - 24 * 60 * 60 * 7, currentTime);
      setSubId(newSubId);
      
      if (following.length === 0) {
        setLoading(false);
      }
    };
    
    initFeed();
    
    return () => {
      if (subId) {
        nostrService.unsubscribe(subId);
      }
    };
  }, [following, activeHashtag, setupSubscription, subId]);
  
  // Mark the loading as finished when we get events
  useEffect(() => {
    if (events.length > 0 && loading) {
      setLoading(false);
    }
  }, [events, loading]);

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
