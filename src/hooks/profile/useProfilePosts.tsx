
import { useState, useEffect, useRef } from 'react';
import { NostrEvent, nostrService } from '@/lib/nostr';
import { extractMediaUrls, isValidMediaUrl } from '@/lib/nostr/utils';
import { toast } from 'sonner';

interface UseProfilePostsProps {
  hexPubkey: string | undefined;
}

export function useProfilePosts({ hexPubkey }: UseProfilePostsProps) {
  const [events, setEvents] = useState<NostrEvent[]>([]);
  const [media, setMedia] = useState<NostrEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const subscriptionRef = useRef<string | null>(null);
  const isMounted = useRef(true);
  
  // Set up the mounted ref for cleanup
  useEffect(() => {
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
    }
    
    // Guard clause - skip if no pubkey
    if (!hexPubkey) {
      setLoading(false);
      return;
    }
    
    try {
      // Subscribe to user's notes (kind 1)
      const notesSubId = nostrService.subscribe(
        [
          {
            kinds: [1],
            authors: [hexPubkey],
            limit: 50
          }
        ],
        (event) => {
          if (!isMounted.current) return;
          
          try {
            setEvents(prev => {
              // Check if we already have this event
              if (prev.some(e => e.id === event.id)) {
                return prev;
              }
              
              // Add new event and sort by creation time (newest first)
              return [...prev, event].sort((a, b) => b.created_at - a.created_at);
            });
  
            // Check if note contains media using our enhanced detection
            const mediaUrls = extractMediaUrls(event.content, event.tags);
            
            // Validate the URLs to ensure they're proper media links
            const validMediaUrls = mediaUrls.filter(url => isValidMediaUrl(url));
            
            if (validMediaUrls.length > 0) {
              setMedia(prev => {
                if (prev.some(e => e.id === event.id)) return prev;
                return [...prev, event].sort((a, b) => b.created_at - a.created_at);
              });
            }
          } catch (err) {
            console.error("Error processing event in useProfilePosts:", err);
          }
        }
      );
      
      // Store the subscription ID for cleanup
      subscriptionRef.current = notesSubId;
      
      // Set a timeout to mark loading as complete even if few events arrive
      const timeoutId = setTimeout(() => {
        if (isMounted.current) {
          setLoading(false);
        }
      }, 5000);
      
      return () => {
        // Clear timeout
        clearTimeout(timeoutId);
        
        // Ensure we clean up the subscription when the component unmounts
        if (subscriptionRef.current) {
          nostrService.unsubscribe(subscriptionRef.current);
          subscriptionRef.current = null;
        }
      };
    } catch (err) {
      console.error("Error in useProfilePosts:", err);
      if (isMounted.current) {
        setError("Failed to load posts");
        setLoading(false);
        toast.error("Failed to load posts. Please try again.");
      }
      return () => {};
    }
  }, [hexPubkey]);

  return { events, media, loading, error };
}
