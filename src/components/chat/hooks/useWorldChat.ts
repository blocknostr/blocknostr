
import { useState, useEffect } from "react";
import { useRelayConnection } from "./useRelayConnection";
import { useProfileFetcher } from "./useProfileFetcher";
import { useMessageSubscription } from "./useMessageSubscription";
import { useReactionHandler } from "./useReactionHandler";
import { useMessageSender } from "./useMessageSender";
import { safeLocalStorageGet, safeLocalStorageSet } from "@/lib/utils/storage";

export type { ConnectionStatus } from "./useRelayConnection";

const MUTE_PREFERENCE_KEY = "world_chat_muted";

/**
 * Main World Chat hook that composes other specialized hooks
 */
export const useWorldChat = () => {
  const [error, setError] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(
    safeLocalStorageGet(MUTE_PREFERENCE_KEY) === "true"
  );
  
  // Toggle mute state
  const toggleMute = () => {
    setIsMuted(prev => {
      const newState = !prev;
      safeLocalStorageSet(MUTE_PREFERENCE_KEY, newState.toString());
      return newState;
    });
  };
  
  // Connection management
  const { 
    connectionStatus, 
    error: connectionError, 
    isReconnecting,
    reconnect
  } = useRelayConnection();
  
  // Profile management
  const { profiles, fetchProfile } = useProfileFetcher();
  
  // Message subscription management
  const { 
    messages, 
    loading, 
    isLoggedIn,
    setMessages 
  } = useMessageSubscription(connectionStatus, fetchProfile, isMuted);
  
  // Reaction management
  const { emojiReactions, addReaction } = useReactionHandler(connectionStatus);
  
  // Message sending
  const { sendMessage } = useMessageSender(connectionStatus, setMessages, setError);
  
  // Combine errors
  const combinedError = error || connectionError;

  return {
    // Connection state
    connectionStatus,
    reconnect,
    isReconnecting,
    
    // Mute state
    isMuted,
    toggleMute,
    
    // Content state
    messages,
    profiles,
    emojiReactions,
    loading,
    isLoggedIn,
    error: combinedError,
    
    // Actions
    sendMessage,
    addReaction,
  };
};
