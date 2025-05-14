
import { useState, useCallback } from "react";
import { NostrEvent } from "@/lib/nostr";

interface UseRepostHandlerProps {
  fetchProfileData: (pubkey: string) => void;
  initialRepostData?: Record<string, { pubkey: string, original: NostrEvent }>;
}

export function useRepostHandler({ fetchProfileData, initialRepostData = {} }: UseRepostHandlerProps) {
  const [repostData, setRepostData] = useState<Record<string, { pubkey: string, original: NostrEvent }>>(initialRepostData);
  
  const handleRepost = useCallback((reposterPubkey: string, originalEvent: NostrEvent) => {
    if (originalEvent.id) {
      setRepostData(prev => ({
        ...prev,
        [originalEvent.id]: { pubkey: reposterPubkey, original: originalEvent }
      }));
      
      // Fetch profile data for the reposter
      if (reposterPubkey) {
        fetchProfileData(reposterPubkey);
      }
      
      // Fetch profile data for the original author
      if (originalEvent.pubkey) {
        fetchProfileData(originalEvent.pubkey);
      }
    }
  }, [fetchProfileData]);
  
  return { repostData, handleRepost, setRepostData };
}
