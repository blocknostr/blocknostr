
import { useState, useCallback, useEffect } from "react";
import { NostrEvent, nostrService } from "@/lib/nostr";
import { EVENT_KINDS } from "@/lib/nostr/constants";
import { toast } from "sonner";

interface UseEventSubscriptionProps {
  following?: string[];
  activeHashtag?: string;
  hashtags?: string[];
  since?: number;
  until?: number;
  limit?: number;
  setEvents: React.Dispatch<React.SetStateAction<NostrEvent[]>>;
  handleRepost: (event: NostrEvent) => void;
  fetchProfileData: (pubkey: string) => void;
  feedType?: string;
  mediaOnly?: boolean;
}

export function useEventSubscription({
  following,
  activeHashtag,
  hashtags,
  since,
  until,
  limit = 50,
  setEvents,
  handleRepost,
  fetchProfileData,
  feedType,
  mediaOnly
}: UseEventSubscriptionProps) {
  const [subId, setSubId] = useState<string | null>(null);
  const [connectionAttemptsMade, setConnectionAttemptsMade] = useState(0);
  const [connectionErrorCount, setConnectionErrorCount] = useState(0);
  
  // Ensure connections to relays before subscribing
  const ensureRelayConnections = useCallback(async () => {
    try {
      // Check current relay connections
      const relayStatus = nostrService.getRelayStatus();
      const connectedRelays = relayStatus.filter(r => r.status === 'connected');
      
      // If we have less than 2 connected relays, try to connect
      if (connectedRelays.length < 2) {
        setConnectionAttemptsMade(prev => prev + 1);
        console.log("[useEventSubscription] Connecting to relays...");
        await nostrService.connectToUserRelays();
        
        // Reset error count on successful connection
        setConnectionErrorCount(0);
      }
      return true;
    } catch (error) {
      console.error("[useEventSubscription] Error connecting to relays:", error);
      setConnectionErrorCount(prev => prev + 1);
      
      // Try to connect to default relays as fallback after multiple failures
      if (connectionErrorCount > 2) {
        try {
          // Changed from connectToPopularRelays to connectToDefaultRelays
          await nostrService.connectToDefaultRelays();
        } catch (fallbackError) {
          console.error("[useEventSubscription] Fallback relay connection failed:", fallbackError);
          
          // Show toast only if we've tried multiple times
          if (connectionAttemptsMade > 1) {
            toast.error("Failed to connect to relays. Check your connection.");
          }
          return false;
        }
      }
      return false;
    }
  }, [connectionErrorCount, connectionAttemptsMade]);
  
  // Event handler
  const handleEvent = useCallback((event: NostrEvent) => {
    setEvents(prevEvents => {
      // Check if we already have this event
      if (prevEvents.some(e => e.id === event.id)) {
        return prevEvents;
      }
      
      // Handle reposts
      if (event.kind === EVENT_KINDS.REPOST) {
        handleRepost(event);
        return prevEvents;
      }
      
      // Cache profiles as we receive events
      if (event.pubkey) {
        fetchProfileData(event.pubkey);
      }
      
      // Add new event to the list
      const newEvents = [event, ...prevEvents];
      
      // Sort by created_at (newest first)
      newEvents.sort((a, b) => b.created_at - a.created_at);
      
      // Limit the number of events
      return newEvents.slice(0, limit);
    });
  }, [setEvents, handleRepost, fetchProfileData, limit]);
  
  // Create or update a subscription
  const setupSubscription = useCallback(async (since?: number, until?: number, hashtagOverride?: string[]) => {
    // Ensure we're connected to relays
    await ensureRelayConnections();
    
    // Build filter
    const filters: any[] = [
      {
        kinds: [EVENT_KINDS.TEXT_NOTE, EVENT_KINDS.REPOST],
        since,
        until,
        limit
      }
    ];
    
    // Add authors filter for following feed
    if (following && following.length > 0) {
      filters[0].authors = following;
    }
    
    // Add hashtag filter - prioritize override if provided
    const effectiveHashtags = hashtagOverride || hashtags || (activeHashtag ? [activeHashtag] : undefined);
    
    if (effectiveHashtags && effectiveHashtags.length > 0) {
      // Using "#t" tag is NIP-01 compliant for tag filtering
      filters[0]["#t"] = effectiveHashtags;
    }
    
    // Keep track of the previous subscription ID so we can unsubscribe after new data starts arriving
    const prevSubId = subId;
    
    try {
      // Subscribe to events
      const newSubId = nostrService.subscribe(
        filters,
        handleEvent
      );
      
      // Set the new subscription ID
      setSubId(newSubId);
      
      // Only unsubscribe from previous subscription after we've set up the new one
      if (prevSubId) {
        setTimeout(() => {
          nostrService.unsubscribe(prevSubId);
        }, 2000); // Give a bit of time for overlap between subscriptions
      }
      
      return newSubId;
    } catch (error) {
      console.error("[useEventSubscription] Failed to create subscription:", error);
      toast.error("Failed to connect to Nostr network");
      return null;
    }
  }, [following, activeHashtag, hashtags, limit, handleEvent, subId, ensureRelayConnections]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (subId) {
        nostrService.unsubscribe(subId);
      }
    };
  }, [subId]);
  
  return {
    subId,
    setSubId,
    setupSubscription,
    connectionAttemptsMade
  };
}
