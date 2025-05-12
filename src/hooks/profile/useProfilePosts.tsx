
import { useState, useEffect } from 'react';
import { NostrEvent, nostrService } from '@/lib/nostr';
import { extractMediaUrls } from '@/lib/nostr/utils';

interface UseProfilePostsProps {
  hexPubkey: string | undefined;
}

export function useProfilePosts({ hexPubkey }: UseProfilePostsProps) {
  const [events, setEvents] = useState<NostrEvent[]>([]);
  const [media, setMedia] = useState<NostrEvent[]>([]);
  
  useEffect(() => {
    if (!hexPubkey) return;
    
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
        setEvents(prev => {
          // Check if we already have this event
          if (prev.some(e => e.id === event.id)) {
            return prev;
          }
          
          // Add new event and sort by creation time (newest first)
          return [...prev, event].sort((a, b) => b.created_at - a.created_at);
        });

        // Check if note contains media using our enhanced detection
        try {
          const mediaUrls = extractMediaUrls(event.content, event.tags);
          if (mediaUrls.length > 0) {
            setMedia(prev => {
              if (prev.some(e => e.id === event.id)) return prev;
              return [...prev, event].sort((a, b) => b.created_at - a.created_at);
            });
          }
        } catch (err) {
          console.error("Error processing media:", err);
        }
      }
    );
    
    return () => {
      nostrService.unsubscribe(notesSubId);
    };
  }, [hexPubkey]);

  return { events, media };
}
