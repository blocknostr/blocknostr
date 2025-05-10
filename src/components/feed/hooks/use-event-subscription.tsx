
import { useState, useEffect } from "react";
import { NostrEvent, nostrService } from "@/lib/nostr";

interface UseEventSubscriptionProps {
  following: string[];
  activeHashtag?: string;
  limit: number;
  setEvents: React.Dispatch<React.SetStateAction<NostrEvent[]>>;
  handleRepost: (event: NostrEvent, setEvents: React.Dispatch<React.SetStateAction<NostrEvent[]>>) => void;
  fetchProfileData: (pubkey: string) => void;
}

export function useEventSubscription({
  following,
  activeHashtag,
  limit,
  setEvents,
  handleRepost,
  fetchProfileData
}: UseEventSubscriptionProps) {
  const [subId, setSubId] = useState<string | null>(null);
  
  const setupSubscription = (sinceFetch: number, untilFetch?: number) => {
    if (following.length === 0) {
      return null;
    }
    
    // Create filters for followed users
    let filters: any[] = [
      {
        kinds: [1], // Regular notes
        authors: following,
        limit: limit,
        since: sinceFetch,
        until: untilFetch
      },
      {
        kinds: [6], // Reposts
        authors: following,
        limit: Math.floor(limit * 0.4), // Fewer reposts than original posts
        since: sinceFetch,
        until: untilFetch
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
            
            // Sort by creation time (newest first)
            newEvents.sort((a, b) => b.created_at - a.created_at);
            
            return newEvents;
          });
        }
        else if (event.kind === 6) {
          // Repost - extract the referenced event
          handleRepost(event, setEvents);
        }
        
        // Fetch profile data for this pubkey if we don't have it yet
        if (event.pubkey) {
          fetchProfileData(event.pubkey);
        }
      }
    );
    
    return newSubId;
  };
  
  useEffect(() => {
    // Cleanup function to handle subscription cleanup
    return () => {
      if (subId) {
        nostrService.unsubscribe(subId);
      }
    };
  }, [subId]);

  return {
    subId,
    setSubId,
    setupSubscription
  };
}
