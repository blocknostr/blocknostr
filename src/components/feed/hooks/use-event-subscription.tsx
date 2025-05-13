
import { useState, useEffect } from "react";
import { NostrEvent, nostrService } from "@/lib/nostr";
import { createSubscription } from "./subscription/create-subscription";

interface UseEventSubscriptionProps {
  following?: string[];
  activeHashtag?: string;
  since?: number;
  until?: number;
  limit: number;
  setEvents: React.Dispatch<React.SetStateAction<NostrEvent[]>>;
  handleRepost: (event: NostrEvent, setEvents: React.Dispatch<React.SetStateAction<NostrEvent[]>>) => void;
  fetchProfileData: (pubkey: string) => void;
  feedType?: string;
  mediaOnly?: boolean;
}

/**
 * Hook for managing Nostr event subscriptions
 */
export function useEventSubscription({
  following,
  activeHashtag,
  since,
  until,
  limit,
  setEvents,
  handleRepost,
  fetchProfileData,
  feedType = 'generic',
  mediaOnly = false,
}: UseEventSubscriptionProps) {
  const [subId, setSubId] = useState<string | null>(null);
  
  const setupSubscription = (sinceFetch: number, untilFetch?: number) => {
    return createSubscription({
      following,
      activeHashtag,
      since: sinceFetch,
      until: untilFetch,
      limit,
      setEvents,
      handleRepost,
      fetchProfileData,
      feedType,
      mediaOnly
    });
  };
  
  // Clean up subscription when component unmounts
  useEffect(() => {
    // Cleanup function to handle subscription cleanup
    return () => {
      if (subId) {
        nostrService.unsubscribe(subId);
      }
    };
  }, [subId]);

  return {
    subId,
    setSubId,
    setupSubscription
  };
}
