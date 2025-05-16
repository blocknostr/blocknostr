import { useState, useCallback } from "react";
import { NostrEvent, NostrFilter, nostrService } from "@/lib/nostr";
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
  feedType = 'generic',
  mediaOnly = false
}: UseEventSubscriptionProps) {
  const [subId, setSubId] = useState<string | null>(null);

  // Setup subscription to Nostr events
  const setupSubscription = useCallback((
    newSince?: number,
    newUntil?: number,
  ): string => {
    const filter: NostrFilter = {
      kinds: [EVENT_KINDS.TEXT_NOTE], 
      limit: limit,
    };

    // Add timestamp filters
    if (newSince) filter.since = newSince;
    if (newUntil) filter.until = newUntil;

    // Add author filter for following feed
    if (following && following.length > 0) {
      filter.authors = following;
    }

    // Add hashtag filter
    if (activeHashtag) {
      filter['#t'] = [activeHashtag];
    } else if (hashtags && hashtags.length > 0) {
      // Filter by multiple hashtags - keep both fields format for compatibility
      filter['#t'] = hashtags;
    }

    // Process incoming events
    const processEvent = (event: NostrEvent) => {
      // Fetch author profile data for display
      if (event.pubkey) {
        fetchProfileData(event.pubkey);
      }

      // Handle reposts (kind 6)
      if (event.kind === 6) {
        handleRepost(event);
        return;
      }

      // Add event to state
      setEvents(prev => {
        // Check if we already have this event
        if (prev.some(e => e.id === event.id)) {
          return prev;
        }
        
        // Only add up to 200 events to prevent performance issues
        const newEvents = [...prev, event];
        if (newEvents.length > 200) {
          return newEvents.slice(0, 200);
        }
        return newEvents;
      });
    };

    // Subscribe to events
    const newSubId = nostrService.subscribe([filter], processEvent);

    // Cache subscription ID
    setSubId(newSubId);
    
    return newSubId;
  }, [following, activeHashtag, hashtags, limit, setEvents, handleRepost, fetchProfileData]);

  return {
    subId,
    setSubId,
    setupSubscription
  };
}
