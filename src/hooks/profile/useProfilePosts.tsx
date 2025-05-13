
import { useState, useEffect, useRef } from 'react';
import { NostrEvent, nostrService, contentCache } from '@/lib/nostr';
import { toast } from 'sonner';
import { 
  cleanupSubscription, 
  createPostsSubscription, 
  setupLoadingTimeouts,
  setupRelaysConnection
} from './utils/subscription-utils';
import { loadCachedEvents } from './utils/cache-utils';
import { hasValidMedia } from './utils/media-utils';

interface UseProfilePostsProps {
  hexPubkey: string | undefined;
  limit?: number;
}

export function useProfilePosts({ hexPubkey, limit = 50 }: UseProfilePostsProps) {
  const [events, setEvents] = useState<NostrEvent[]>([]);
  const [media, setMedia] = useState<NostrEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasEvents, setHasEvents] = useState(false);
  const subscriptionRef = useRef<string | null>(null);
  const isMounted = useRef(true);
  const timeoutRef = useRef<number | null>(null);
  const eventCountRef = useRef<number>(0);
  
  // Set up the mounted ref for cleanup
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);
  
  // Update events and ensure proper sorting
  const updateEvents = (event: NostrEvent) => {
    setEvents(prev => {
      // Check if we already have this event
      if (prev.some(e => e.id === event.id)) {
        return prev;
      }
      
      // Cache the event
      try {
        contentCache.cacheEvent(event);
      } catch (cacheError) {
        console.warn("Failed to cache event:", cacheError);
      }
      
      // Add new event and sort by creation time (newest first)
      return [...prev, event].sort((a, b) => b.created_at - a.created_at);
    });
  };
  
  // Update media posts
  const updateMedia = (event: NostrEvent) => {
    if (hasValidMedia(event)) {
      setMedia(prev => {
        if (prev.some(e => e.id === event.id)) return prev;
        return [...prev, event].sort((a, b) => b.created_at - a.created_at);
      });
    }
  };
  
  // Mark that we have events
  const updateHasEvents = () => setHasEvents(true);
  
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
    
    // Cleanup previous subscription and timeout
    cleanupSubscription(subscriptionRef, timeoutRef);
    
    // Check cache first
    const { cachedPosts, cachedMedia, hasEvents: hasCachedEvents } = loadCachedEvents(hexPubkey);
    
    if (cachedPosts.length > 0) {
      setEvents(cachedPosts);
      setMedia(cachedMedia);
      setHasEvents(hasCachedEvents);
      eventCountRef.current = cachedPosts.length;
      
      // We can shorten loading time if we have cached events
      setLoading(false);
    }
    
    const fetchPosts = async () => {
      try {
        // Connect to relays
        await setupRelaysConnection();
        
        console.log("Connected to relays, subscribing to posts");
        
        // Subscribe to user's notes
        const notesSubId = createPostsSubscription(
          hexPubkey,
          limit,
          isMounted,
          eventCountRef,
          updateEvents,
          updateMedia,
          updateHasEvents
        );
        
        // Store the subscription ID for cleanup
        subscriptionRef.current = notesSubId;
        
        // Set up timeouts for loading states
        timeoutRef.current = setupLoadingTimeouts(
          isMounted,
          eventCountRef,
          hasEvents,
          events.length,
          setLoading,
          setError
        );
      } catch (err) {
        console.error("Error in useProfilePosts:", err);
        if (isMounted.current) {
          setError("Failed to load posts");
          setLoading(false);
          toast.error("Failed to load posts. Please try again.");
        }
      }
    };
    
    fetchPosts();
    
    return () => {
      // Ensure we clean up the subscription when the component unmounts
      cleanupSubscription(subscriptionRef, timeoutRef);
    };
  }, [hexPubkey, limit, events.length, hasEvents]);

  // Define the refetch function
  const refetch = () => {
    if (!hexPubkey) return;
    
    // Reset state
    setEvents([]);
    setMedia([]);
    setError(null);
    setLoading(true);
    setHasEvents(false);
    eventCountRef.current = 0;
    
    // Clean up existing subscription
    cleanupSubscription(subscriptionRef, timeoutRef);
    
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
