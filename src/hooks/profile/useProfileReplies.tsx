
import { useState, useEffect, useRef } from 'react';
import { NostrEvent, nostrService } from '@/lib/nostr';

interface UseProfileRepliesProps {
  hexPubkey: string | undefined;
  enabled?: boolean;
}

export function useProfileReplies({ hexPubkey, enabled = true }: UseProfileRepliesProps) {
  const [replies, setReplies] = useState<NostrEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const subscriptionRef = useRef<string | null>(null);
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
    
    console.log("Fetching replies for profile:", hexPubkey);
    setLoading(true);
    
    // Clean up previous subscription if any
    if (subscriptionRef.current) {
      nostrService.unsubscribe(subscriptionRef.current);
      subscriptionRef.current = null;
    }
    
    // Subscribe to user's notes that are replies (have e tags - NIP-10)
    const repliesSubId = nostrService.subscribe(
      [
        {
          kinds: [1],
          authors: [hexPubkey],
          limit: 30
        }
      ],
      (event) => {
        if (!isMounted.current) return;
        
        // Check if this is a reply by looking for e tags (NIP-10)
        const hasETags = event.tags?.some(tag => 
          Array.isArray(tag) && tag.length >= 2 && tag[0] === 'e'
        );
        
        if (hasETags) {
          setReplies(prev => {
            // Check if we already have this event
            if (prev.some(e => e.id === event.id)) {
              return prev;
            }
            
            // Add new reply and sort by creation time (newest first)
            return [...prev, event].sort((a, b) => b.created_at - a.created_at);
          });
        }
      }
    );
    
    // Store subscription ID for cleanup
    subscriptionRef.current = repliesSubId;
    
    // Set loading to false after some time
    timeoutRef.current = window.setTimeout(() => {
      if (isMounted.current) {
        setLoading(false);
      }
    }, 3000);
    
    return () => {
      // Clean up subscription when component unmounts
      if (subscriptionRef.current) {
        nostrService.unsubscribe(subscriptionRef.current);
        subscriptionRef.current = null;
      }
      
      // Clear timeout
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [hexPubkey, enabled]);

  return { replies, loading };
}
