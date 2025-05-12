
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
    // Guard clause - skip if no eventId
    if (!eventId) return;
    
    let timeoutId: number | null = null;
    
    // Count actual replies
    const fetchReplyCount = () => {
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
      timeoutId = window.setTimeout(() => {
        if (subscriptionRef.current && isMounted.current) {
          nostrService.unsubscribe(subscriptionRef.current);
          subscriptionRef.current = null;
        }
      }, 5000);
    };
    
    // Start fetching replies
    fetchReplyCount();
    
    // Ensure we clean up when the component unmounts or when eventId changes
    return () => {
      // Clear the timeout if it exists
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
      
      // Clean up the subscription if it exists
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
