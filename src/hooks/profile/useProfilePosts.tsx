
import { useState, useEffect, useRef } from 'react';
import { NostrEvent, nostrService } from '@/lib/nostr';
import { toast } from 'sonner';
import { retrieveCachedPosts } from './utils/post-cache';
import { createPostSubscription } from './utils/post-subscription';

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
    if (subscriptionRef.current) {
      nostrService.unsubscribe(subscriptionRef.current);
      subscriptionRef.current = null;
    }
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    // Check cache first
    const { posts, media: cachedMedia, hasEvents: hasCachedEvents } = retrieveCachedPosts(hexPubkey);
    
    if (posts.length > 0) {
      setEvents(posts);
      setMedia(cachedMedia);
      setHasEvents(hasCachedEvents);
      eventCountRef.current = posts.length;
      
      // We can shorten loading time if we have cached events
      setLoading(false);
    }
    
    const fetchPosts = async () => {
      try {
        // First make sure we're connected to relays
        await nostrService.connectToUserRelays();
        
        const { subscriptionId, cleanup } = createPostSubscription({
          hexPubkey,
          limit,
          onEvent: (event) => {
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
          },
          onMediaEvent: (event) => {
            if (!isMounted.current) return;
            
            setMedia(prev => {
              if (prev.some(e => e.id === event.id)) return prev;
              return [...prev, event].sort((a, b) => b.created_at - a.created_at);
            });
          },
          onHasEvents: () => {
            if (isMounted.current) {
              setHasEvents(true);
            }
          }
        });
        
        // Store the subscription ID for cleanup
        subscriptionRef.current = subscriptionId;
        console.log("Created subscription:", subscriptionId, "for posts");
        
        // Set a timeout to check if we got any events and mark loading as complete
        // Reduced from 15s to 5s for better user experience
        timeoutRef.current = window.setTimeout(() => {
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
        }, 5000); // Reduced timeout for better UX
        
        // Add a quick-feedback timeout to show initial results faster
        setTimeout(() => {
          if (isMounted.current && eventCountRef.current > 0) {
            setLoading(false);
          }
        }, 2000); // Even quicker feedback if we have events
        
        return cleanup;
      } catch (err) {
        console.error("Error in useProfilePosts:", err);
        if (isMounted.current) {
          setError("Failed to load posts");
          setLoading(false);
          toast.error("Failed to load posts. Please try again.");
        }
        return () => {};
      }
    };
    
    const cleanup = fetchPosts();
    
    return () => {
      // Ensure we clean up the subscription when the component unmounts
      if (typeof cleanup === 'function') {
        cleanup();
      }
      
      if (subscriptionRef.current) {
        nostrService.unsubscribe(subscriptionRef.current);
        subscriptionRef.current = null;
      }
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [hexPubkey, limit]);

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
      if (subscriptionRef.current) {
        nostrService.unsubscribe(subscriptionRef.current);
        subscriptionRef.current = null;
      }
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      
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
