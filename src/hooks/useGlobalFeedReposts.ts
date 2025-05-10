
import { useCallback } from "react";
import { NostrEvent } from "@/lib/nostr";
import { parseRepostEvent } from "@/utils/repost-utils";

export const useGlobalFeedReposts = (
  fetchOriginalPost: (eventId: string) => void,
  setRepostData: React.Dispatch<React.SetStateAction<Record<string, { pubkey: string, original: NostrEvent }>>>
) => {
  // Handle repost events
  const handleRepostEvent = useCallback((event: NostrEvent) => {
    const { originalEventId, originalEventPubkey } = parseRepostEvent(event);
    
    if (originalEventId) {
      // Track repost data for later display
      setRepostData(prev => ({
        ...prev,
        [originalEventId]: { 
          pubkey: event.pubkey,  // The reposter
          original: { id: originalEventId, pubkey: originalEventPubkey } as NostrEvent
        }
      }));
      
      // Fetch the original post
      fetchOriginalPost(originalEventId);
    }
  }, [fetchOriginalPost, setRepostData]);

  return { handleRepostEvent };
};
