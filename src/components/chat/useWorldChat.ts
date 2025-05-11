
import { useState, useEffect } from "react";
import { nostrService } from "@/lib/nostr";
import { useReactionHandler } from "./utils/reaction-utils";
import { useProfileFetcher } from "./utils/profile-utils";
import { useConnectionStatus, ConnectionStatus } from "./utils/connection-utils";
import { useMessageSender } from "./utils/message-utils";
import { useSubscriptions } from "./hooks/useSubscriptions";
import { useConnectionMonitor } from "./hooks/useConnectionMonitor";
import { useMessageHandling } from "./hooks/useMessageHandling";

const WORLD_CHAT_TAG = "world-chat";
const MAX_MESSAGES = 15;

// Export the type with the 'type' keyword to fix the TS1205 error
export type { ConnectionStatus } from "./utils/connection-utils";

export const useWorldChat = () => {
  const { emojiReactions, handleReaction } = useReactionHandler();
  const { profiles, fetchProfile } = useProfileFetcher();
  const { messages, updateMessages } = useMessageSender();
  const { connectionStatus, error, setError, updateConnectionStatus } = useConnectionStatus(
    () => nostrService.getRelayStatus(),
    navigator.onLine
  );
  
  const isLoggedIn = !!nostrService.publicKey;
  
  // Use the dedicated subscription hook
  const { 
    loading, 
    subscriptions, 
    setupSubscriptions, 
    reconnect 
  } = useSubscriptions(
    nostrService,
    updateConnectionStatus,
    setError,
    updateMessages,
    fetchProfile,
    handleReaction,
    MAX_MESSAGES
  );
  
  // Use the connection monitor hook
  useConnectionMonitor(
    setupSubscriptions,
    updateConnectionStatus,
    nostrService,
    subscriptions
  );

  // Initialize subscriptions when component mounts
  useEffect(() => {
    setupSubscriptions();
  }, [setupSubscriptions]);
  
  // Use the message handling hook
  const { 
    sendMessage, 
    handleAddReaction 
  } = useMessageHandling(
    messages,
    updateMessages,
    MAX_MESSAGES,
    isLoggedIn,
    connectionStatus,
    setError,
    nostrService
  );

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
