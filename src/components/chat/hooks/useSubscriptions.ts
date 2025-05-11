
import { useState, useCallback, useEffect } from "react";
import { NostrEvent, NostrFilter } from "@/lib/nostr/types";
import { EVENT_KINDS } from "@/lib/nostr/constants";
import { retry } from "@/lib/utils/retry";

const WORLD_CHAT_TAG = "world-chat";
const MAX_RETRIES = 3;

export const useSubscriptions = (
  nostrService: any,
  updateConnectionStatus: () => void,
  setError: (error: string | null) => void,
  updateMessages: (event: NostrEvent, maxMessages: number) => void,
  fetchProfile: (pubkey: string, getUserProfile: (pubkey: string) => Promise<any>) => void,
  handleReaction: (event: NostrEvent) => void,
  maxMessages: number
) => {
  const [subscriptions, setSubscriptions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  
  const setupSubscriptions = useCallback(async () => {
    try {
      setError(null);
      
      // Ensure we're connected to relays with retry logic
      await retry(
        async () => {
          await nostrService.connectToUserRelays();
          const relayStatus = nostrService.getRelayStatus();
          const connectedCount = relayStatus.filter(r => r.status === 'connected').length;
          
          if (connectedCount === 0) {
            throw new Error("No relays connected");
          }
          
          return true;
        }, 
        { 
          maxAttempts: MAX_RETRIES,
          baseDelay: 2000,
          onRetry: (attempt) => console.log(`Retry attempt ${attempt} to connect to relays`)
        }
      );
      
      updateConnectionStatus();
      
      // Clean up any existing subscriptions
      subscriptions.forEach(subId => {
        if (subId) nostrService.unsubscribe(subId);
      });
      
      // Subscribe to world chat messages
      const messagesSub = nostrService.subscribe(
        [
          {
            kinds: [EVENT_KINDS.TEXT_NOTE],
            '#t': [WORLD_CHAT_TAG], // Using '#t' for tag filtering
            limit: 25
          } as NostrFilter
        ],
        (event: NostrEvent) => {
          updateMessages(event, maxMessages);
          fetchProfile(event.pubkey, nostrService.getUserProfile.bind(nostrService));
        }
      );
      
      // Subscribe to reactions (NIP-25)
      const reactionsSub = nostrService.subscribe(
        [
          {
            kinds: [EVENT_KINDS.REACTION],
            '#t': [WORLD_CHAT_TAG],
            limit: 50
          } as NostrFilter
        ],
        handleReaction
      );
      
      // Update subscriptions state with only valid subscription IDs
      const validSubs = [messagesSub, reactionsSub].filter(Boolean);
      setSubscriptions(validSubs);
      
      if (validSubs.length === 0) {
        setError("Could not create subscriptions. Try again later.");
      } else {
        setError(null);
      }
      
      return validSubs;
    } catch (error) {
      console.error("Error setting up world chat subscriptions:", error);
      setError("Unable to connect to chat relays. Please try again later.");
      return [];
    } finally {
      setLoading(false);
    }
  }, [
    nostrService, 
    updateConnectionStatus, 
    setError, 
    updateMessages, 
    fetchProfile, 
    handleReaction, 
    maxMessages, 
    subscriptions
  ]);

  const reconnect = useCallback(async () => {
    setLoading(true);
    await nostrService.connectToUserRelays();
    await setupSubscriptions();
    updateConnectionStatus();
    setLoading(false);
  }, [nostrService, setupSubscriptions, updateConnectionStatus]);
  
  // Cleanup subscriptions on unmount
  useEffect(() => {
    return () => {
      subscriptions.forEach(subId => {
        if (subId) nostrService.unsubscribe(subId);
      });
    };
  }, [subscriptions, nostrService]);
  
  return {
    loading,
    subscriptions,
    setupSubscriptions,
    reconnect
  };
};
