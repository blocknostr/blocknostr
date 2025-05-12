
import { useState, useEffect } from 'react';
import { NostrEvent, nostrService } from '@/lib/nostr';

interface UseProfileRepliesProps {
  hexPubkey: string | undefined;
}

export function useProfileReplies({ hexPubkey }: UseProfileRepliesProps) {
  const [replies, setReplies] = useState<NostrEvent[]>([]);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    if (!hexPubkey) return;
    
    setLoading(true);
    
    // Subscribe to user's notes that are replies (have e tags - NIP-10)
    const repliesSubId = nostrService.subscribe(
      [
        {
          kinds: [1],
          authors: [hexPubkey],
          limit: 50
        }
      ],
      (event) => {
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
    
    // Set loading to false after some time
    setTimeout(() => setLoading(false), 3000);
    
    return () => {
      nostrService.unsubscribe(repliesSubId);
    };
  }, [hexPubkey]);

  return { replies, loading };
}
