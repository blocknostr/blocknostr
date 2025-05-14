
import { useState, useEffect, useRef } from 'react';
import { NostrEvent, nostrService } from '@/lib/nostr';
import { toast } from 'sonner';
import { useCacheCheck } from './useCacheCheck';
import { usePostsSubscription } from './usePostsSubscription';
import { UseProfilePostsProps, UseProfilePostsReturn } from './types';

export function useProfilePosts({ 
  hexPubkey, 
  limit = 50,
  componentId // New parameter for component tracking
}: UseProfilePostsProps): UseProfilePostsReturn {
  const [events, setEvents] = useState<NostrEvent[]>([]);
  const [media, setMedia] = useState<NostrEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasEvents, setHasEvents] = useState(false);
  
  const isMounted = useRef(true);
  const eventCountRef = useRef<number>(0);
  
  const { checkCache } = useCacheCheck();
  const { subscribe, cleanup, subscriptionRef } = usePostsSubscription();
  
  // Set up the mounted ref for cleanup
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);
  
  useEffect(() => {
    // Reset state when pubkey changes
    if (isMounted.current) {
      setEvents([]);
      setMedia([]);
      setError(null);
      setLoading(true);
      setHasEvents(false);
      eventCountRef.current = 0;
    }
    
    // Guard clause - skip if no pubkey
    if (!hexPubkey) {
      setLoading(false);
      return;
    }
    
    console.log("Fetching posts for pubkey:", hexPubkey);
    
    // Check cache first
    const { postsEvents, mediaEvents, foundInCache } = checkCache(hexPubkey);
    
    if (foundInCache) {
      setEvents(postsEvents);
      setMedia(mediaEvents);
      setHasEvents(true);
      eventCountRef.current = postsEvents.length;
      
      // We can shorten loading time if we have cached events
      setLoading(false);
    }
    
    // Create a function to start subscription
    const startSubscription = async () => {
      try {
        // Subscribe to posts and set up event handling
        const unsubscribe = subscribe(hexPubkey, {
          limit,
          componentId, // Pass component ID for tracking
          onEvent: (event, isMediaEvent) => {
            if (!isMounted.current) return;
            
            eventCountRef.current += 1;
            
            setEvents(prev => {
              // Check if we already have this event
              if (prev.some(e => e.id === event.id)) {
                return prev;
              }
              
              // Add new event and sort by creation time (newest first)
              return [...prev, event].sort((a, b) => b.created_at - a.created_at);
            });
            
            if (isMediaEvent) {
              setMedia(prev => {
                if (prev.some(e => e.id === event.id)) return prev;
                return [...prev, event].sort((a, b) => b.created_at - a.created_at);
              });
            }
            
            setHasEvents(true);
          },
          onComplete: () => {
            if (!isMounted.current) return;
            
            console.log("Posts loading timeout - events found:", eventCountRef.current);
            setLoading(false);
            
            if (eventCountRef.current === 0 && !hasEvents) {
              console.log("No posts found for user");
              // Only show error if we didn't get any events and there are none in the cache
              if (events.length === 0) {
                setError("No posts found");
              }
            }
          }
        });
        
        return unsubscribe;
      } catch (error) {
        console.error("Error subscribing to events:", error);
        setLoading(false);
        setError("Failed to subscribe to events");
        return () => {}; // Return empty cleanup function
      }
    };
    
    // Start subscription without awaiting
    let unsubscribe: (() => void) | undefined;
    startSubscription().then(cleanupFn => {
      unsubscribe = cleanupFn;
    });
    
    // Return cleanup function
    return () => {
      if (unsubscribe) unsubscribe();
      cleanup();
    };
  }, [hexPubkey, limit, subscribe, checkCache, cleanup, hasEvents, events.length, componentId]);

  const refetch = () => {
    if (hexPubkey) {
      // Reset state
      setEvents([]);
      setMedia([]);
      setError(null);
      setLoading(true);
      setHasEvents(false);
      eventCountRef.current = 0;
      
      // Unsubscribe from current subscription
      cleanup();
      
      // Force reconnect to relays and retry
      nostrService.connectToUserRelays()
        .then(() => {
          // This will trigger the effect again
          const event = new CustomEvent('refetchPosts', { detail: { pubkey: hexPubkey } });
          window.dispatchEvent(event);
        })
        .catch(err => {
          console.error("Failed to reconnect to relays:", err);
          setLoading(false);
          setError("Failed to connect to relays");
          toast.error("Failed to connect to relays");
        });
    }
  };

  return { 
    events, 
    media, 
    loading, 
    error, 
    hasEvents,
    refetch
  };
}

// Export the main hook 
export default useProfilePosts;
