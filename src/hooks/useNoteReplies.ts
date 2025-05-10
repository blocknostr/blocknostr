
import { useState, useEffect } from 'react';
import { nostrService } from '@/lib/nostr';

export const useNoteReplies = (eventId: string) => {
  const [replyCount, setReplyCount] = useState(0);
  
  useEffect(() => {
    if (!eventId) return;
    
    const fetchReplyCount = async () => {
      const subId = nostrService.subscribe(
        [{
          kinds: [1], // Regular notes (kind 1)
          "#e": [eventId || ''], // Filter by reference to this event
          limit: 100
        }],
        (replyEvent) => {
          // Check if it's actually a reply to this event
          const isReply = replyEvent.tags.some(tag => 
            tag[0] === 'e' && tag[1] === eventId && (tag[3] === 'reply' || !tag[3])
          );
          
          if (isReply) {
            setReplyCount(count => count + 1);
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
  
  const handleReplyAdded = () => {
    setReplyCount(prev => prev + 1);
  };
  
  return { replyCount, handleReplyAdded };
};
