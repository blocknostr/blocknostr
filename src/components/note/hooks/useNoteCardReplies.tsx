
import { useState, useEffect } from 'react';
import { nostrService } from '@/lib/nostr';

interface UseNoteCardRepliesProps {
  eventId: string;
}

export function useNoteCardReplies({ eventId }: UseNoteCardRepliesProps) {
  const [replyCount, setReplyCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!eventId) return;

    const fetchReplyCount = async () => {
      try {
        setIsLoading(true);
        
        // Connect to user relays if not already connected
        await nostrService.connectToUserRelays();
        
        // Get default relays if user relays not available
        const defaultRelays = ["wss://relay.damus.io", "wss://nos.lol"];
        
        // Create filter for replies (e is for event tags, p is for pubkey tags)
        const filters = [{ "#e": [eventId], kinds: [1] }];
        
        // Use SimplePool to count events
        let count = 0;
        
        if (nostrService.subscribe) {
          const sub = nostrService.subscribe(
            filters,
            (event) => {
              // Count valid reply events
              if (event && event.kind === 1 && event.tags && 
                  event.tags.some(tag => tag[0] === 'e' && tag[1] === eventId)) {
                count++;
              }
            },
            // Use relay list from service if available, otherwise use defaults
            defaultRelays
          );
          
          // Set timeout to finalize count after 2s
          setTimeout(() => {
            setReplyCount(count);
            setIsLoading(false);
            
            if (nostrService.unsubscribe && sub) {
              nostrService.unsubscribe(sub);
            }
          }, 2000);
          
          return () => {
            if (nostrService.unsubscribe && sub) {
              nostrService.unsubscribe(sub);
            }
          };
        }
      } catch (error) {
        console.error('Error fetching reply count:', error);
        setIsLoading(false);
      }
    };

    fetchReplyCount();
  }, [eventId]);

  return { replyCount, isLoading };
}
