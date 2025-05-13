
import { useState, useEffect, useRef } from 'react';
import { NostrEvent, nostrService, contentCache } from '@/lib/nostr';

interface UseProfileLikesProps {
  hexPubkey: string | undefined;
  enabled?: boolean;
}

export function useProfileLikes({ hexPubkey, enabled = true }: UseProfileLikesProps) {
  const [reactions, setReactions] = useState<NostrEvent[]>([]);
  const [referencedEvents, setReferencedEvents] = useState<Record<string, NostrEvent>>({});
  const [loading, setLoading] = useState(false);
  const subscriptionsRef = useRef<Set<string>>(new Set());
  const timeoutRef = useRef<number | null>(null);
  const isMounted = useRef(true);
  
  // Set up the mounted ref for cleanup
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);
  
  useEffect(() => {
    // Only fetch data if enabled and we have a pubkey
    if (!enabled || !hexPubkey) return;
    
    console.log("Fetching likes for profile:", hexPubkey);
    setLoading(true);
    
    // Clean up previous subscriptions if any
    subscriptionsRef.forEach(subId => {
      nostrService.unsubscribe(subId);
    });
    subscriptionsRef.current.clear();
    
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
        if (!isMounted.current) return;
        
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
    
    // Track subscription for cleanup
    subscriptionsRef.current.add(reactionsSubId);
    
    // Set loading to false after some time
    timeoutRef.current = window.setTimeout(() => {
      if (isMounted.current) {
        setLoading(false);
      }
    }, 3000);
    
    return () => {
      // Clean up all tracked subscriptions when component unmounts
      subscriptionsRef.current.forEach(subId => {
        nostrService.unsubscribe(subId);
      });
      subscriptionsRef.current.clear();
      
      // Clear timeout
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [hexPubkey, enabled]);
  
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
      if (isMounted.current) {
        setReferencedEvents(prev => ({
          ...prev,
          [eventId]: cachedEvent
        }));
      }
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
        if (!event || !isMounted.current) return;
        
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
              if (profile && isMounted.current) {
                contentCache.cacheProfile(event.pubkey, profile);
              }
            })
            .catch(error => {
              console.error(`Error fetching profile for ${event.pubkey}:`, error);
            });
        }
      }
    );
    
    // Track subscription for cleanup
    subscriptionsRef.current.add(subId);
    
    // Cleanup subscription after a short time
    const timeoutId = window.setTimeout(() => {
      if (subscriptionsRef.current.has(subId) && isMounted.current) {
        nostrService.unsubscribe(subId);
        subscriptionsRef.current.delete(subId);
      }
    }, 2000);
  };

  return { 
    reactions, 
    referencedEvents,
    loading 
  };
}
