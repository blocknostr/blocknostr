
import { nostrService } from "@/lib/nostr";

interface UseLoadMoreEventsProps {
  subId: string | null;
  following: string[];
  events: any[];
  since?: number;
  until?: number;
  setupSubscription: (since: number, until: number) => string | null;
  setSubId: (subId: string | null) => void;
  setSince: (since?: number) => void;
  setUntil: (until: number) => void;
  loadFromCache: (feedType: string, since?: number, until?: number) => boolean;
}

export function useLoadMoreEvents({
  subId,
  following,
  events,
  since,
  until,
  setupSubscription,
  setSubId,
  setSince,
  setUntil,
  loadFromCache
}: UseLoadMoreEventsProps) {
  
  const loadMoreEvents = () => {
    if (!subId || following.length === 0) return;
    
    // Close previous subscription
    if (subId) {
      nostrService.unsubscribe(subId);
    }

    // Create new subscription with older timestamp range
    if (!since) {
      // If no since value yet, get the oldest post timestamp
      const oldestEvent = events.length > 0 ? 
        events.reduce((oldest, current) => oldest.created_at < current.created_at ? oldest : current) : 
        null;
      
      const newUntil = oldestEvent ? oldestEvent.created_at - 1 : until - 24 * 60 * 60;
      const newSince = newUntil - 24 * 60 * 60 * 7; // 7 days before until
      
      setSince(newSince);
      setUntil(newUntil);
      
      // Start the new subscription with the older timestamp range
      const newSubId = setupSubscription(newSince, newUntil);
      setSubId(newSubId);
      
      // Check if we have this range cached
      loadFromCache('following', newSince, newUntil);
    } else {
      // We already have a since value, so use it to get older posts
      const newUntil = since;
      const newSince = newUntil - 24 * 60 * 60 * 7; // 7 days before until
      
      setSince(newSince);
      setUntil(newUntil);
      
      // Start the new subscription with the older timestamp range
      const newSubId = setupSubscription(newSince, newUntil);
      setSubId(newSubId);
      
      // Check if we have this range cached
      loadFromCache('following', newSince, newUntil);
    }
  };

  return { loadMoreEvents };
}
