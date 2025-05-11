
import { useState, useEffect, useCallback } from "react";
import { nostrService } from "@/lib/nostr";
import { EVENT_KINDS } from "@/lib/nostr/constants";
import { NostrFilter } from "@/lib/nostr/types";
import { toast } from "sonner";
import { contentFormatter } from "@/lib/nostr";
import { useReactionHandler } from "./utils/reaction-utils";
import { useProfileFetcher } from "./utils/profile-utils";
import { useConnectionStatus, ConnectionStatus } from "./utils/connection-utils";
import { useMessageSender } from "./utils/message-utils";
import { retry } from "@/lib/utils/retry";

const WORLD_CHAT_TAG = "world-chat";
const MAX_MESSAGES = 15;
const RETRY_INTERVAL = 5000; // 5 seconds for retry
const MAX_RETRIES = 3;

// Export the type with the 'type' keyword to fix the TS1205 error
export type { ConnectionStatus } from "./utils/connection-utils";

export const useWorldChat = () => {
  const { emojiReactions, handleReaction, addReaction } = useReactionHandler();
  const { profiles, fetchProfile } = useProfileFetcher();
  const { messages, updateMessages, sendMessage: sendMessageUtil } = useMessageSender();
  const { connectionStatus, error, setError, updateConnectionStatus, connectionAttempts } = useConnectionStatus(
    () => nostrService.getRelayStatus(),
    navigator.onLine
  );
  
  const [loading, setLoading] = useState(true);
  const [subscriptions, setSubscriptions] = useState<string[]>([]);
  
  const isLoggedIn = !!nostrService.publicKey;
  
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
        (event) => {
          updateMessages(event, MAX_MESSAGES);
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
  }, [fetchProfile, handleReaction, updateConnectionStatus, setError]);
  
  // Setup subscriptions with error handling and reconnection
  useEffect(() => {
    let statusInterval: number;
    let reconnectTimeout: number;
    
    const init = async () => {
      setLoading(true);
      const subs = await setupSubscriptions();
      
      // Set up connection status check interval
      statusInterval = window.setInterval(() => {
        updateConnectionStatus();
        
        // Check if we're still connected to any relays
        const relayStatus = nostrService.getRelayStatus();
        const connectedCount = relayStatus.filter(r => r.status === 'connected').length;
        
        // If we have no connections but we have subscriptions, try to reconnect
        if (connectedCount === 0 && subs.length > 0 && navigator.onLine) {
          console.log("No connected relays detected, scheduling reconnection");
          
          // Clear any existing reconnect timeout
          if (reconnectTimeout) {
            window.clearTimeout(reconnectTimeout);
          }
          
          // Schedule reconnect
          reconnectTimeout = window.setTimeout(() => {
            console.log("Attempting to reconnect to relays");
            setupSubscriptions();
          }, RETRY_INTERVAL);
        }
      }, RETRY_INTERVAL);
    };
    
    init();
    
    // Cleanup function
    return () => {
      if (statusInterval) clearInterval(statusInterval);
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      
      subscriptions.forEach(subId => {
        if (subId) nostrService.unsubscribe(subId);
      });
    };
  }, [setupSubscriptions, updateConnectionStatus]);

  // Send message with improved error handling and NIP-01 compliance
  const sendMessage = async (messageContent: string) => {
    const success = await sendMessageUtil(
      messageContent, 
      isLoggedIn,
      nostrService.publicKey,
      contentFormatter.parseContent,
      nostrService.publishEvent.bind(nostrService),
      MAX_MESSAGES
    );
    
    if (!success) {
      setError("Failed to send message. Check your connection.");
      return;
    }
    
    setError(null);
  };
  
  // Add reaction wrapper with toast feedback
  const handleAddReaction = async (emoji: string, messageId: string) => {
    if (!isLoggedIn) {
      toast.error("You must be logged in to react");
      return;
    }
    
    if (connectionStatus !== 'connected') {
      toast.error("You're offline. Can't send reactions.");
      return;
    }
    
    await addReaction(
      isLoggedIn,
      connectionStatus,
      emoji,
      messageId,
      nostrService.publishEvent.bind(nostrService)
    );
  };
  
  // Force reconnect to relays
  const reconnect = useCallback(async () => {
    setLoading(true);
    await nostrService.connectToUserRelays();
    await setupSubscriptions();
    updateConnectionStatus();
    setLoading(false);
  }, [setupSubscriptions, updateConnectionStatus]);

  return {
    messages,
    profiles,
    emojiReactions,
    loading,
    isLoggedIn,
    sendMessage,
    addReaction: handleAddReaction,
    error,
    connectionStatus,
    reconnect
  };
};
