
import { useState, useEffect, useRef } from 'react';
import { nostrService } from '@/lib/nostr';

interface UseNoteCardRepliesProps {
  eventId: string;
}

export function useNoteCardReplies({ eventId }: UseNoteCardRepliesProps) {
  const [replyCount, setReplyCount] = useState(0);
  const subscriptionRef = useRef<string | null>(null);
  const isMounted = useRef(true);
  
  useEffect(() => {
    // Set up the mounted ref
    return () => {
      isMounted.current = false;
    };
  }, []);
  
  useEffect(() => {
    if (!eventId) return;
    
    // Count actual replies
    const fetchReplyCount = async () => {
      let count = 0;
      
      const subId = nostrService.subscribe(
        [{
          kinds: [1], // Regular notes (kind 1)
          "#e": [eventId], // Filter by reference to this event
          limit: 100
        }],
        (replyEvent) => {
          // Check if it's actually a reply to this event
          const isReply = replyEvent.tags.some(tag => 
            tag[0] === 'e' && tag[1] === eventId && (tag[3] === 'reply' || !tag[3])
          );
          
          if (isReply && isMounted.current) {
            count++;
            setReplyCount(count);
          }
        }
      );
      
      // Store the subscription ID for cleanup
      subscriptionRef.current = subId;
      
      // Cleanup subscription after a short time
      const timeoutId = setTimeout(() => {
        if (subscriptionRef.current) {
          nostrService.unsubscribe(subscriptionRef.current);
          subscriptionRef.current = null;
        }
      }, 5000);
      
      // Return a cleanup function
      return () => {
        clearTimeout(timeoutId);
        if (subscriptionRef.current) {
          nostrService.unsubscribe(subscriptionRef.current);
          subscriptionRef.current = null;
        }
      };
    };
    
    // Call the fetch function but handle the cleanup separately
    fetchReplyCount();
    
    // Ensure we clean up when the component unmounts or when eventId changes
    return () => {
      // Simply clean up the subscription if it exists
      if (subscriptionRef.current) {
        nostrService.unsubscribe(subscriptionRef.current);
        subscriptionRef.current = null;
      }
    };
  }, [eventId]);

  return {
    replyCount,
    setReplyCount
  };
}
