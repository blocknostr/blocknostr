
import { useState, useEffect } from 'react';
import { NostrEvent, nostrService, contentCache } from '@/lib/nostr';

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
          kinds: [7], // Reaction events (NIP-25)
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
        const reactedEventId = getReactedToEventId(event);
        
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
  
  // Helper to extract event ID from NIP-25 reaction
  const getReactedToEventId = (event: NostrEvent): string | null => {
    // According to NIP-25, 'e' tag points to the event being reacted to
    if (event.tags && Array.isArray(event.tags)) {
      const eTag = event.tags.find(tag => 
        Array.isArray(tag) && tag.length >= 2 && tag[0] === 'e'
      );
      
      return eTag ? eTag[1] : null;
    }
    return null;
  };
  
  // Helper to fetch events that were reacted to
  const fetchReferencedEvent = (eventId: string) => {
    // Check if we already have this event or if it's in cache
    if (referencedEvents[eventId]) return;
    
    // Check cache first
    const cachedEvent = contentCache.getEvent(eventId);
    if (cachedEvent) {
      setReferencedEvents(prev => ({
        ...prev,
        [eventId]: cachedEvent
      }));
      return;
    }
    
    // If not in cache, fetch from network
    const subId = nostrService.subscribe(
      [
        {
          ids: [eventId],
          kinds: [1], // Text notes
          limit: 1
        }
      ],
      (event) => {
        if (!event) return;
        
        // Cache the event for future reference
        contentCache.cacheEvent(event);
        
        // Update our state
        setReferencedEvents(prev => ({
          ...prev,
          [eventId]: event
        }));
        
        // After we get the event, fetch the author's profile
        if (event.pubkey) {
          nostrService.getUserProfile(event.pubkey)
            .then(profile => {
              if (profile) {
                contentCache.cacheProfile(event.pubkey, profile);
              }
            })
            .catch(error => {
              console.error(`Error fetching profile for ${event.pubkey}:`, error);
            });
        }
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
