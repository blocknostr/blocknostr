
import { useState, useEffect } from 'react';
import { nostrService } from '@/lib/nostr';

interface UseNoteCardRepliesProps {
  eventId: string;
}

export function useNoteCardReplies({ eventId }: UseNoteCardRepliesProps) {
  const [replyCount, setReplyCount] = useState(0);
  
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
          
          if (isReply) {
            count++;
            setReplyCount(count);
          }
        }
      );
      
      // Cleanup subscription after a short time
      setTimeout(() => {
        nostrService.unsubscribe(subId);
      }, 5000);
    };
    
    fetchReplyCount();
  }, [eventId]);

  return {
    replyCount,
    setReplyCount
  };
}
