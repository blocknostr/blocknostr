
import { useState, useEffect, useCallback } from "react";
import { NostrEvent, nostrService } from "@/lib/nostr";
import { useProfileData } from "./useProfileData";
import { parseRepostEvent, trackRepostData } from "@/utils/repost-utils";

interface UseFeedSubscriptionProps {
  filters: any[];
  onEventReceived?: (event: NostrEvent) => void;
}

export const useFeedSubscription = ({ filters, onEventReceived }: UseFeedSubscriptionProps) => {
  const [events, setEvents] = useState<NostrEvent[]>([]);
  const [profiles, setProfiles] = useState<Record<string, any>>({});
  const [repostData, setRepostData] = useState<Record<string, { pubkey: string, original: NostrEvent }>>({});
  const [loading, setLoading] = useState(true);
  const [subId, setSubId] = useState<string | null>(null);
  
  const { fetchProfileData } = useProfileData();
  
  // Handle repost events
  const handleRepostEvent = useCallback((event: NostrEvent) => {
    const { originalEventId, originalEventPubkey } = parseRepostEvent(event);
    
    if (originalEventId) {
      // Track repost data for later display
      trackRepostData(event, originalEventId, originalEventPubkey, setRepostData);
      
      // Fetch the original post
      const eventSubId = nostrService.subscribe(
        [{ ids: [originalEventId], kinds: [1] }],
        (originalEvent) => {
          setEvents(prev => {
            // Check if we already have this event
            if (prev.some(e => e.id === originalEvent.id)) {
              return prev;
            }
            
            // Add new event and sort by creation time (oldest first to show newest at bottom)
            return [...prev, originalEvent].sort((a, b) => a.created_at - b.created_at);
          });
          
          // Fetch profile data for this pubkey if we don't have it yet
          if (originalEvent.pubkey && !profiles[originalEvent.pubkey]) {
            fetchProfileData(originalEvent.pubkey, profiles, setProfiles);
          }
        }
      );
      
      // Cleanup subscription after a short time
      setTimeout(() => {
        nostrService.unsubscribe(eventSubId);
      }, 5000);
    }
  }, [profiles, fetchProfileData]);
  
  // Subscribe to events with the provided filters
  const subscribe = useCallback(() => {
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
            return newEvents.sort((a, b) => a.created_at - b.created_at);
          });
          
          // Call the onEventReceived callback if provided
          if (onEventReceived) {
            onEventReceived(event);
          }
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
  }, [filters, profiles, handleRepostEvent, fetchProfileData, onEventReceived]);
  
  // Unsubscribe from current subscription
  const unsubscribe = useCallback(() => {
    if (subId) {
      nostrService.unsubscribe(subId);
      setSubId(null);
    }
  }, [subId]);
  
  // Cleanup subscription on unmount
  useEffect(() => {
    return () => {
      unsubscribe();
    };
  }, [unsubscribe]);
  
  return {
    events,
    profiles,
    repostData,
    loading,
    setLoading,
    subId,
    setSubId,
    subscribe,
    unsubscribe,
    setEvents
  };
};
