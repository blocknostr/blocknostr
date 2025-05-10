
import { useCallback } from "react";
import { nostrService } from "@/lib/nostr";

export const useNostrEvents = () => {
  const fetchOriginalPost = useCallback((
    eventId: string, 
    profiles: Record<string, any>, 
    setEvents: (updater: (prev: any[]) => any[]) => void, 
    fetchProfileData: (pubkey: string, profiles: Record<string, any>, setProfiles: (profiles: Record<string, any>) => void) => void,
    setProfiles: (updater: (prev: Record<string, any>) => Record<string, any>) => void
  ) => {
    // Subscribe to a specific event by ID
    const eventSubId = nostrService.subscribe(
      [
        {
          ids: [eventId],
          kinds: [1]
        }
      ],
      (event) => {
        setEvents(prev => {
          // Check if we already have this event
          if (prev.some(e => e.id === event.id)) {
            return prev;
          }
          
          // Add new event and sort by creation time (oldest first to show newest at bottom)
          return [...prev, event].sort((a, b) => a.created_at - b.created_at);
        });
        
        // Fetch profile data for this pubkey if we don't have it yet
        if (event.pubkey && !profiles[event.pubkey]) {
          fetchProfileData(event.pubkey, profiles, setProfiles);
        }
      }
    );
    
    // Cleanup subscription after a short time
    setTimeout(() => {
      nostrService.unsubscribe(eventSubId);
    }, 5000);
  }, []);

  return { fetchOriginalPost };
};
