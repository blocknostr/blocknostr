
import { useState } from "react";
import { NostrEvent, nostrService } from "@/lib/nostr";

interface UseRepostHandlerProps {
  fetchProfileData: (pubkey: string) => void;
}

export function useRepostHandler({ fetchProfileData }: UseRepostHandlerProps) {
  const [repostData, setRepostData] = useState<Record<string, { pubkey: string, original: NostrEvent }>>({});
  
  // Fetch the original post when a repost is encountered
  const fetchOriginalPost = (eventId: string, originalPubkey?: string) => {
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
    
    // Improved repost detection supporting multiple client formats
    
    // Method 1: Try to parse JSON content (some clients use this format)
    try {
      if (event.content && event.content.startsWith('{') && event.content.endsWith('}')) {
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
          fetchOriginalPost(originalEventId, originalEventPubkey);
          return; // Found the repost data, exit early
        }
      }
    } catch (e) {
      // JSON parsing failed, continue to other methods
    }
    
    // Method 2: Look for 'e' tag (standard NIP-10 way)
    const eventReference = event.tags?.find(tag => tag[0] === 'e');
    if (eventReference && eventReference[1]) {
      const originalEventId = eventReference[1];
      
      // Find pubkey reference (NIP-10)
      const pubkeyReference = event.tags?.find(tag => tag[0] === 'p');
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
      fetchOriginalPost(originalEventId, originalEventPubkey);
      return; // Found the repost data, exit early
    }
    
    // Method 3: Empty content with e and p tags (another common format)
    if (event.content === "" && event.tags && event.tags.length > 0) {
      // Already checked 'e' tag above, but content being empty makes this more likely a repost
      const eventReference = event.tags.find(tag => tag[0] === 'e');
      if (eventReference && eventReference[1]) {
        const originalEventId = eventReference[1];
        // Handle the same way as Method 2
        const pubkeyReference = event.tags.find(tag => tag[0] === 'p');
        const originalEventPubkey = pubkeyReference ? pubkeyReference[1] : null;
        
        setRepostData(prev => ({
          ...prev,
          [originalEventId]: { 
            pubkey: event.pubkey || '',
            original: { id: originalEventId, pubkey: originalEventPubkey } as NostrEvent
          }
        }));
        
        fetchOriginalPost(originalEventId, originalEventPubkey);
      }
    }
  };

  return {
    repostData,
    handleRepost
  };
}
