
import { useState, useEffect } from 'react';
import { NostrEvent, nostrService } from '@/lib/nostr';

interface UseProfileLikesProps {
  hexPubkey: string | undefined;
}

export function useProfileLikes({ hexPubkey }: UseProfileLikesProps) {
  const [reactions, setReactions] = useState<NostrEvent[]>([]);
  const [referencedEvents, setReferencedEvents] = useState<Record<string, NostrEvent>>({});
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    if (!hexPubkey) return;
    
    setLoading(true);
    
    // Subscribe to user's reactions (kind 7 - NIP-25)
    const reactionsSubId = nostrService.subscribe(
      [
        {
          kinds: [7], // Reaction events
          authors: [hexPubkey],
          limit: 50
        }
      ],
      (event) => {
        // Process reaction event
        setReactions(prev => {
          // Check if we already have this event
          if (prev.some(e => e.id === event.id)) {
            return prev;
          }
          
          // Add new reaction and sort by creation time (newest first)
          return [...prev, event].sort((a, b) => b.created_at - a.created_at);
        });
        
        // Get the event ID that was reacted to
        const reactedEventId = event.tags?.find(tag => 
          Array.isArray(tag) && tag.length >= 2 && tag[0] === 'e'
        )?.[1];
        
        // Fetch the referenced event if we have its ID
        if (reactedEventId) {
          fetchReferencedEvent(reactedEventId);
        }
      }
    );
    
    // Set loading to false after some time
    setTimeout(() => setLoading(false), 3000);
    
    return () => {
      nostrService.unsubscribe(reactionsSubId);
    };
  }, [hexPubkey]);
  
  // Helper to fetch events that were reacted to
  const fetchReferencedEvent = (eventId: string) => {
    // Check if we already have this event
    if (referencedEvents[eventId]) return;
    
    const subId = nostrService.subscribe(
      [
        {
          ids: [eventId],
          kinds: [1], // Text notes
          limit: 1
        }
      ],
      (event) => {
        setReferencedEvents(prev => ({
          ...prev,
          [eventId]: event
        }));
      }
    );
    
    // Cleanup subscription after a short time
    setTimeout(() => {
      nostrService.unsubscribe(subId);
    }, 2000);
  };

  return { 
    reactions, 
    referencedEvents,
    loading 
  };
}
