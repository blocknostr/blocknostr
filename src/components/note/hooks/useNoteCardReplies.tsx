
import { useState, useEffect, useRef } from 'react';
import { nostrService } from '@/lib/nostr';

interface UseNoteCardRepliesProps {
  eventId: string;
  onUpdate?: (count: number) => void;
  skip?: boolean;
}

export const useNoteCardReplies = ({ 
  eventId, 
  onUpdate,
  skip = false 
}: UseNoteCardRepliesProps) => {
  const [replyCount, setReplyCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const subscription = useRef<string | null>(null);
  
  useEffect(() => {
    // Skip if requested or if no valid event ID
    if (skip || !eventId) return;
    
    let isMounted = true;
    setIsLoading(true);
    
    // Define relays to check for replies
    const relays = nostrService.relays || [
      "wss://relay.damus.io",
      "wss://nos.lol",
      "wss://relay.nostr.band"
    ];
    
    // Create subscription to count replies
    const fetchReplies = async () => {
      try {
        // Subscribe with filters
        const filters = [{
          kinds: [1], // Text notes
          '#e': [eventId], // Reference to the post
          limit: 100
        }];
        
        // Store subscription ID to unsubscribe later
        const sub = nostrService.subscribe(
          filters, 
          (event) => {
            if (isMounted) {
              setReplyCount(count => {
                const newCount = count + 1;
                // Call onUpdate callback if provided
                if (onUpdate) onUpdate(newCount);
                return newCount;
              });
            }
          },
          relays
        );
        
        if (sub) {
          subscription.current = sub;
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('[useNoteCardReplies] Error counting replies:', error);
        setIsLoading(false);
      }
    };
    
    fetchReplies();
    
    // Clean up subscription
    return () => {
      isMounted = false;
      if (subscription.current && nostrService.unsubscribe) {
        nostrService.unsubscribe(subscription.current);
      }
    };
  }, [eventId, skip, onUpdate]);
  
  return { replyCount, isLoading };
};
