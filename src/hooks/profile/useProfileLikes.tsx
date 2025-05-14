
import { useState, useEffect, useRef } from 'react';
import { NostrEvent, nostrService, contentCache } from '@/lib/nostr';

interface UseProfileLikesProps {
  hexPubkey: string | undefined;
  enabled?: boolean;
  initialLimit?: number;
}

export function useProfileLikes({ 
  hexPubkey, 
  enabled = true, 
  initialLimit = 10 
}: UseProfileLikesProps) {
  const [reactions, setReactions] = useState<NostrEvent[]>([]);
  const [referencedEvents, setReferencedEvents] = useState<Record<string, NostrEvent>>({});
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const subscriptionsRef = useRef<Set<string>>(new Set());
  const timeoutRef = useRef<number | null>(null);
  const isMounted = useRef(true);
  const lastTimestamp = useRef<number | null>(null);
  
  // Set up the mounted ref for cleanup
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);
  
  // Function to load more reactions
  const loadMore = () => {
    if (!hexPubkey || loading || loadingMore || !hasMore) return;
    
    setLoadingMore(true);
    setPage(prev => prev + 1);
    
    // If we have reactions, use the oldest one's timestamp as 'until'
    const until = lastTimestamp.current 
      ? lastTimestamp.current - 1 // Subtract 1 to avoid duplication
      : undefined;
    
    console.log(`Loading more reactions for profile: ${hexPubkey}, page: ${page + 1}, until: ${until}`);
    
    // Clean up previous subscriptions if any
    subscriptionsRef.current.forEach(subId => {
      nostrService.unsubscribe(subId);
    });
    subscriptionsRef.current.clear();
    
    // Subscribe to user's reactions (kind 7 - NIP-25)
    const reactionsSubId = nostrService.subscribe(
      [
        {
          kinds: [7], // Reaction events (NIP-25)
          authors: [hexPubkey],
          until: until,
          limit: initialLimit
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
          
          // Track the oldest timestamp for pagination
          if (!lastTimestamp.current || event.created_at < lastTimestamp.current) {
            lastTimestamp.current = event.created_at;
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
        setLoadingMore(false);
        
        // If we received fewer than the limit, assume there are no more
        if (reactions.length < initialLimit * page) {
          setHasMore(false);
        }
      }
    }, 5000);
  };
  
  useEffect(() => {
    // Only fetch data if enabled and we have a pubkey
    if (!enabled || !hexPubkey) return;
    
    console.log("Fetching initial reactions for profile:", hexPubkey);
    setLoading(true);
    setPage(1);
    setReactions([]);
    setReferencedEvents({});
    lastTimestamp.current = null;
    setHasMore(true);
    
    // Clean up previous subscriptions if any
    subscriptionsRef.current.forEach(subId => {
      nostrService.unsubscribe(subId);
    });
    subscriptionsRef.current.clear();
    
    // Subscribe to user's reactions (kind 7 - NIP-25)
    const reactionsSubId = nostrService.subscribe(
      [
        {
          kinds: [7], // Reaction events (NIP-25)
          authors: [hexPubkey],
          limit: initialLimit
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
          
          // Track the oldest timestamp for pagination
          if (!lastTimestamp.current || event.created_at < lastTimestamp.current) {
            lastTimestamp.current = event.created_at;
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
  }, [hexPubkey, enabled, initialLimit]);
  
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
    loading,
    loadingMore,
    hasMore,
    loadMore
  };
}
