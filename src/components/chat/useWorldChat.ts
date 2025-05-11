
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

const WORLD_CHAT_TAG = "world-chat";
const MAX_MESSAGES = 15;
const RETRY_INTERVAL = 5000; // 5 seconds for retry

// Export the type with the 'type' keyword to fix the TS1205 error
export type { ConnectionStatus } from "./utils/connection-utils";

export const useWorldChat = () => {
  const { emojiReactions, handleReaction, addReaction } = useReactionHandler();
  const { profiles, fetchProfile } = useProfileFetcher();
  const { messages, updateMessages, sendMessage: sendMessageUtil } = useMessageSender();
  const { connectionStatus, error, setError, updateConnectionStatus } = useConnectionStatus(
    () => nostrService.getRelayStatus(),
    navigator.onLine
  );
  
  const [loading, setLoading] = useState(true);
  const [subscriptions, setSubscriptions] = useState<string[]>([]);
  
  const isLoggedIn = !!nostrService.publicKey;
  
  // Setup subscriptions with error handling and reconnection
  useEffect(() => {
    const setupSubscriptions = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Ensure we're connected to relays
        await nostrService.connectToUserRelays();
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
        
        // Update subscriptions state
        setSubscriptions([messagesSub, reactionsSub]);
        setLoading(false);
        
        // Set up connection status check interval
        const statusInterval = setInterval(updateConnectionStatus, RETRY_INTERVAL);
        
        // Cleanup function
        return () => {
          clearInterval(statusInterval);
          if (messagesSub) nostrService.unsubscribe(messagesSub);
          if (reactionsSub) nostrService.unsubscribe(reactionsSub);
        };
      } catch (error) {
        console.error("Error setting up world chat subscriptions:", error);
        setError("Unable to connect to chat relays. Please try again later.");
        setLoading(false);
      }
    };
    
    setupSubscriptions();
  }, [fetchProfile, handleReaction, updateConnectionStatus, setError, subscriptions]);

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

  return {
    messages,
    profiles,
    emojiReactions,
    loading,
    isLoggedIn,
    sendMessage,
    addReaction: handleAddReaction,
    error,
    connectionStatus
  };
};
