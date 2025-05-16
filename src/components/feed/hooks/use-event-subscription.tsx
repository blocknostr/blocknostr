
import { useState, useCallback, useRef } from "react";
import { NostrEvent, nostrService } from "@/lib/nostr";
import { EVENT_KINDS } from "@/lib/nostr/constants";
import { EventDeduplication } from "@/lib/nostr/utils/event-deduplication";

interface UseEventSubscriptionProps {
  following?: string[];
  activeHashtag?: string;
  hashtags?: string[];
  since?: number;
  until?: number;
  limit?: number;
  setEvents: React.Dispatch<React.SetStateAction<NostrEvent[]>>;
  handleRepost: (event: NostrEvent) => void;
  fetchProfileData: (pubkey: string) => void;
  feedType?: string;
  mediaOnly?: boolean;
}

export function useEventSubscription({
  following,
  activeHashtag,
  hashtags,
  since,
  until,
  limit = 50,
  setEvents,
  handleRepost,
  fetchProfileData,
  feedType,
  mediaOnly
}: UseEventSubscriptionProps) {
  const [subId, setSubId] = useState<string | null>(null);
  const newEventsReceivedRef = useRef(false);
  
  // Event handler
  const handleEvent = useCallback((event: NostrEvent) => {
    newEventsReceivedRef.current = true;
    
    setEvents(prevEvents => {
      // Check if we already have this event
      if (prevEvents.some(e => e.id === event.id)) {
        return prevEvents;
      }
      
      // Handle reposts
      if (event.kind === EVENT_KINDS.REPOST) {
        handleRepost(event);
        return prevEvents;
      }
      
      // Cache profiles as we receive events
      if (event.pubkey) {
        fetchProfileData(event.pubkey);
      }
      
      // Add new event to the list
      const newEvents = [event, ...prevEvents];
      
      // Sort by created_at (newest first)
      newEvents.sort((a, b) => b.created_at - a.created_at);
      
      // Deduplicate events by ID
      const dedupedEvents = EventDeduplication.deduplicateById(newEvents);
      
      // Limit the number of events
      return dedupedEvents.slice(0, limit);
    });
  }, [setEvents, handleRepost, fetchProfileData, limit]);
  
  // Create or update a subscription
  const setupSubscription = useCallback((since?: number, until?: number, hashtagOverride?: string[]) => {
    // Reset the new events flag
    newEventsReceivedRef.current = false;
    
    // Build filter
    const filters: any[] = [
      {
        kinds: [EVENT_KINDS.TEXT_NOTE, EVENT_KINDS.REPOST],
        since,
        until,
        limit
      }
    ];
    
    // Add authors filter for following feed
    if (following && following.length > 0) {
      filters[0].authors = following;
    }
    
    // Add hashtag filter - prioritize override if provided
    const effectiveHashtags = hashtagOverride || hashtags || (activeHashtag ? [activeHashtag] : undefined);
    
    if (effectiveHashtags && effectiveHashtags.length > 0) {
      // Instead of search for exact 't' tag match, use the native '#t' search in nostr-tools
      filters[0]["#t"] = effectiveHashtags;
    }
    
    // Log the subscription filters for debugging
    console.log("Setting up subscription with filters:", JSON.stringify(filters));
    
    try {
      // Make sure we connect to relays first
      const relays = nostrService.getRelayUrls();
      
      if (relays.length === 0) {
        console.warn("No connected relays found, attempting to connect to default relays");
        
        // Here we need to handle async properly - we'll subscribe after connecting
        // Return the subscription ID directly instead of using the promise result
        nostrService.connectToUserRelays().then(connectedRelays => {
          if (connectedRelays.length === 0) {
            console.error("Failed to connect to any relays");
            return null;
          }
          
          // Now subscribe with the connected relays
          const newSubId = nostrService.subscribe(
            filters,
            handleEvent,
            connectedRelays // Pass relays as the third argument
          );
          
          // Update the subscription ID state
          setSubId(newSubId);
          return newSubId;
        });
        
        return null; // Return null for now, will be updated by the promise
      }
      
      // Subscribe to events with the available relays
      const newSubId = nostrService.subscribe(
        filters,
        handleEvent,
        relays // Pass relays as the third argument
      );
      
      return newSubId;
    } catch (error) {
      console.error("Error setting up subscription:", error);
      return null;
    }
  }, [following, activeHashtag, hashtags, limit, handleEvent, setSubId]);
  
  // Expose whether we've received events through this subscription
  const hasReceivedEvents = useCallback(() => {
    return newEventsReceivedRef.current;
  }, []);
  
  return {
    subId,
    setSubId,
    setupSubscription,
    hasReceivedEvents
  };
}
