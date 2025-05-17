
import { useState, useEffect, useCallback } from "react";
import { NostrEvent, nostrService } from "@/lib/nostr";
import { EVENT_KINDS } from "@/lib/nostr/constants";

export function useNoteCardReplies(eventId: string) {
  const [isLoading, setIsLoading] = useState(false);
  const [replies, setReplies] = useState<NostrEvent[]>([]);
  const [subscriptionId, setSubscriptionId] = useState<string | null>(null);
  
  const fetchReplies = useCallback(async () => {
    if (!eventId) return;
    
    setIsLoading(true);
    
    try {
      // Create a filter to find events that reference this event
      const filter = {
        kinds: [EVENT_KINDS.TEXT_NOTE],
        "#e": [eventId],
        limit: 20
      };
      
      // Subscribe to replies
      const subId = nostrService.subscribe(
        [filter],
        (event) => {
          if (event) {
            setReplies(prev => {
              // Avoid duplicates
              if (prev.some(e => e.id === event.id)) {
                return prev;
              }
              
              // Add and sort by timestamp (newest first)
              const updated = [...prev, event];
              return updated.sort((a, b) => b.created_at - a.created_at);
            });
          }
        }
      );
      
      if (subId) {
        setSubscriptionId(subId);
      }
    } catch (error) {
      console.error("Error fetching note replies:", error);
    } finally {
      setIsLoading(false);
    }
  }, [eventId]);
  
  // Clean up subscription
  useEffect(() => {
    return () => {
      if (subscriptionId) {
        nostrService.unsubscribe(subscriptionId);
      }
    };
  }, [subscriptionId]);
  
  // Initial fetch
  useEffect(() => {
    fetchReplies();
  }, [fetchReplies]);
  
  return { replies, isLoading, fetchReplies };
}
