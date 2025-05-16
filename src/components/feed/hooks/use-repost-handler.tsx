
import { useState, useCallback } from "react";
import { NostrEvent } from "@/lib/nostr";

interface UseRepostHandlerProps {
  fetchProfileData: (pubkey: string) => void;
}

export function useRepostHandler({ fetchProfileData }: UseRepostHandlerProps) {
  const [repostData, setRepostData] = useState<Record<string, { pubkey: string; original: NostrEvent }>>({});

  // Handler for repost events (kind 6)
  const handleRepost = useCallback((event: NostrEvent) => {
    try {
      if (event.kind !== 6) return;

      // Look for 'e' tag which contains the reposted event ID
      const eTags = event.tags.filter(tag => tag[0] === 'e');
      if (eTags.length === 0) return;
      
      // Get reposted event ID - first e tag
      const repostedEventId = eTags[0][1];
      if (!repostedEventId) return;
      
      // Store the repost data with the reposted event ID as key
      setRepostData(prev => ({
        ...prev,
        [repostedEventId]: {
          pubkey: event.pubkey,
          original: event
        }
      }));
      
      // Fetch profile for the author of the repost
      if (event.pubkey) {
        fetchProfileData(event.pubkey);
      }
    } catch (error) {
      console.error("Error handling repost event:", error);
    }
  }, [fetchProfileData]);

  return { repostData, handleRepost };
}
