import { useState, useEffect, useCallback, useRef } from "react";
import { NostrEvent, nostrService } from "@/lib/nostr";
import { EVENT_KINDS } from "@/lib/nostr/constants";

export function useNoteCardReplies(eventId: string) {
  const [isLoading, setIsLoading] = useState(false);
  const [replies, setReplies] = useState<NostrEvent[]>([]);
  const [subscriptionId, setSubscriptionId] = useState<string | null>(null);
  
  // Prevent multiple concurrent fetches
  const fetchingRef = useRef(false);
  const mountedRef = useRef(true);
  
  const fetchReplies = useCallback(async () => {
    if (!eventId || fetchingRef.current || !mountedRef.current) return;
    
    fetchingRef.current = true;
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
          if (event && mountedRef.current) {
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
      
      if (subId && mountedRef.current) {
        setSubscriptionId(subId);
      }
    } catch (error) {
      if (mountedRef.current) {
        console.error("Error fetching note replies:", error);
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
      fetchingRef.current = false;
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
  
  // CRITICAL FIX: Remove fetchReplies from dependencies to prevent infinite loop
  useEffect(() => {
    if (eventId && !fetchingRef.current) {
      fetchReplies();
    }
  }, [eventId]); // Only re-run when eventId changes
  
  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);
  
  // Get the reply count
  const replyCount = replies.length;
  
  return { replies, isLoading, fetchReplies, replyCount };
}

