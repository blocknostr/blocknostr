
import { useState, useCallback } from "react";
import { NostrEvent, nostrService } from "@/lib/nostr";
import { EVENT_KINDS } from "@/lib/nostr/constants";

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
  
  // Event handler
  const handleEvent = useCallback((event: NostrEvent) => {
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
      
      // Limit the number of events
      return newEvents.slice(0, limit);
    });
  }, [setEvents, handleRepost, fetchProfileData, limit]);
  
  // Create or update a subscription
  const setupSubscription = useCallback((since?: number, until?: number, hashtagOverride?: string[]) => {
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
    
    // Subscribe to events - FIX: removed the fourth parameter which was causing the error
    const newSubId = nostrService.subscribe(
      filters,
      handleEvent,
      undefined  // onEose callback
      // Removed the feedType parameter as it's not expected by the subscribe method
    );
    
    return newSubId;
  }, [following, activeHashtag, hashtags, limit, handleEvent]);
  
  return {
    subId,
    setSubId,
    setupSubscription
  };
}
