
import { useState } from 'react';
import { NostrEvent, nostrService } from '@/lib/nostr';

interface UseProfileRepostsProps {
  originalPostProfiles: Record<string, any>;
  setOriginalPostProfiles: React.Dispatch<React.SetStateAction<Record<string, any>>>;
}

export function useProfileReposts({ 
  originalPostProfiles, 
  setOriginalPostProfiles 
}: UseProfileRepostsProps) {
  const [reposts, setReposts] = useState<{ 
    originalEvent: NostrEvent; 
    repostEvent: NostrEvent;
  }[]>([]);
  
  const [replies, setReplies] = useState<NostrEvent[]>([]);

  const fetchOriginalPost = (eventId: string, pubkey: string | null, repostEvent: NostrEvent) => {
    // Subscribe to the original event by ID
    const eventSubId = nostrService.subscribe(
      [
        {
          ids: [eventId],
          kinds: [1]
        }
      ],
      (originalEvent) => {
        setReposts(prev => {
          if (prev.some(r => r.originalEvent.id === originalEvent.id)) {
            return prev;
          }
          
          const newRepost = {
            originalEvent,
            repostEvent
          };
          
          return [...prev, newRepost].sort(
            (a, b) => b.repostEvent.created_at - a.repostEvent.created_at
          );
        });
        
        // Fetch profile data for the original author if we don't have it yet
        if (originalEvent.pubkey && !originalPostProfiles[originalEvent.pubkey]) {
          const metadataSubId = nostrService.subscribe(
            [
              {
                kinds: [0],
                authors: [originalEvent.pubkey],
                limit: 1
              }
            ],
            (event) => {
              try {
                const metadata = JSON.parse(event.content);
                setOriginalPostProfiles(prev => ({
                  ...prev,
                  [originalEvent.pubkey]: metadata
                }));
              } catch (e) {
                console.error('Failed to parse profile metadata for repost:', e);
              }
            }
          );
          
          // Cleanup subscription after a short time
          setTimeout(() => {
            nostrService.unsubscribe(metadataSubId);
          }, 5000);
        }
      }
    );
    
    // Cleanup subscription after a short time
    setTimeout(() => {
      nostrService.unsubscribe(eventSubId);
    }, 5000);
  };

  return { reposts, replies, fetchOriginalPost };
}
