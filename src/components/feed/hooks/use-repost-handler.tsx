
import { useState } from "react";
import { NostrEvent, nostrService } from "@/lib/nostr";

interface UseRepostHandlerProps {
  fetchProfileData: (pubkey: string) => void;
}

export function useRepostHandler({ fetchProfileData }: UseRepostHandlerProps) {
  const [repostData, setRepostData] = useState<Record<string, { pubkey: string, original: NostrEvent }>>({});
  
  // Fetch the original post when a repost is encountered
  const fetchOriginalPost = (eventId: string) => {
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
          
          // Add new event and sort by creation time (newest first)
          return [...prev, event].sort((a, b) => b.created_at - a.created_at);
        });
        
        // Fetch profile data for this pubkey if we don't have it yet
        if (event.pubkey) {
          fetchProfileData(event.pubkey);
        }
      }
    );
    
    // Cleanup subscription after a short time
    setTimeout(() => {
      nostrService.unsubscribe(eventSubId);
    }, 5000);
  };

  // We need a reference to setEvents but we don't want to pass it as a prop
  // This will be assigned by the event subscription hook
  let setEvents: React.Dispatch<React.SetStateAction<NostrEvent[]>> = () => {};
  
  const handleRepost = (event: NostrEvent, setEventsFunction: React.Dispatch<React.SetStateAction<NostrEvent[]>>) => {
    // Store the setEvents function for use in fetchOriginalPost
    setEvents = setEventsFunction;
    
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
            pubkey: event.pubkey || '',  // The reposter
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
            pubkey: event.pubkey || '',  // The reposter
            original: { id: originalEventId, pubkey: originalEventPubkey } as NostrEvent
          }
        }));
        
        // Fetch the original post
        fetchOriginalPost(originalEventId);
      }
    }
  };

  return {
    repostData,
    handleRepost
  };
}
