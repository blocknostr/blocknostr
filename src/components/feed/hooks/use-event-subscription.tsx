
import { useState, useCallback, useRef, useEffect } from "react";
import { NostrEvent, nostrService } from "@/lib/nostr";
import { EventDeduplication } from "@/lib/nostr/utils/event-deduplication";

interface UseEventSubscriptionProps {
  following?: string[];
  activeHashtag?: string;
  since?: number;
  until?: number;
  limit?: number;
  setEvents: React.Dispatch<React.SetStateAction<NostrEvent[]>>;
  handleRepost: (reposterPubkey: string, originalEvent: NostrEvent) => void;
  fetchProfileData: (pubkey: string) => void;
  feedType?: string;
  mediaOnly?: boolean;
  initialEvents?: NostrEvent[];
}

export function useEventSubscription({
  following,
  activeHashtag,
  since,
  until,
  limit = 50,
  setEvents,
  handleRepost,
  fetchProfileData,
  feedType = 'generic',
  mediaOnly = false,
  initialEvents = []
}: UseEventSubscriptionProps) {
  const [subId, setSubId] = useState<string | null>(null);
  const eventDeduplication = useRef(new EventDeduplication());
  
  // If we have initial events, update the deduplication service
  useEffect(() => {
    if (initialEvents.length > 0) {
      initialEvents.forEach(event => {
        eventDeduplication.current.addEvent(event);
      });
    }
  }, [initialEvents.length]);
  
  const setupSubscription = useCallback((newSince?: number, newUntil?: number) => {
    // Connect to relays first
    let kinds = [1]; // Regular notes
    if (mediaOnly) {
      kinds = [1]; // We'll filter for media in the event handler
    }
    
    let filter: any = {
      kinds,
      limit: limit || 20
    };
    
    if (newSince !== undefined) {
      filter.since = newSince;
    }
    
    if (newUntil !== undefined) {
      filter.until = newUntil;
    }
    
    if (activeHashtag) {
      filter['#t'] = [activeHashtag];
    }
    
    if (following && following.length > 0) {
      filter.authors = following;
    }
    
    const currentSubId = Math.random().toString(36).substring(2, 15);
    
    nostrService.subscribe({ filter, eventHandler: (event) => {
      if (!event) return;
      
      // Skip if we already have this event
      if (eventDeduplication.current.hasEvent(event)) {
        return;
      }
      
      eventDeduplication.current.addEvent(event);
      
      // Check if this is a repost (kind 1 with 'e' tag and no content)
      if (event.kind === 1 &&
          event.tags &&
          event.tags.some(tag => tag[0] === 'e')) {
        
        const eTags = event.tags.filter(tag => tag[0] === 'e');
        if (eTags.length > 0 && (!event.content || event.content.trim() === '')) {
          // This is a repost, find the original event
          const originalEventId = eTags[0][1];
          
          // Try to find the original event
          nostrService.getEvent(originalEventId, originalEvent => {
            if (originalEvent) {
              handleRepost(event.pubkey, originalEvent);
              setEvents(prev => [originalEvent, ...prev]);
              
              // Also fetch profile data for the original author
              if (originalEvent.pubkey) {
                fetchProfileData(originalEvent.pubkey);
              }
            }
          });
          return;
        }
      }
      
      // Fetch profile data for the author
      if (event.pubkey) {
        fetchProfileData(event.pubkey);
      }
      
      // Add event to the list
      setEvents(prev => {
        // Check if this event is already in the list
        if (prev.some(e => e.id === event.id)) {
          return prev;
        }
        
        // Add the new event to the beginning of the list
        return [event, ...prev];
      });
      
    }, id: currentSubId });
    
    setSubId(currentSubId);
    return currentSubId;
  }, [activeHashtag, following, limit, setEvents, handleRepost, fetchProfileData, mediaOnly]);
  
  return { subId, setSubId, setupSubscription };
}
