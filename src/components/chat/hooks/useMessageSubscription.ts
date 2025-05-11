import { useState, useEffect, useCallback } from "react";
import { nostrService } from "@/lib/nostr";
import { EVENT_KINDS } from "@/lib/nostr/constants";
import { NostrEvent, NostrFilter } from "@/lib/nostr/types";

const WORLD_CHAT_TAG = "world-chat";
const MAX_MESSAGES = 15;

/**
 * Hook to manage message subscriptions and state
 */
export const useMessageSubscription = (
  connectionStatus: 'connected' | 'connecting' | 'disconnected',
  fetchProfile: (pubkey: string) => Promise<void>
) => {
  const [messages, setMessages] = useState<NostrEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [subscriptions, setSubscriptions] = useState<string[]>([]);
  
  const isLoggedIn = !!nostrService.publicKey;
  
  // Setup message subscription
  useEffect(() => {
    // Only attempt to subscribe if we are connected
    if (connectionStatus !== 'connected') {
      return;
    }

    setLoading(true);
    
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
        // Add new message to state (and keep only most recent)
        setMessages(prev => {
          // Check if we already have this message
          if (prev.some(m => m.id === event.id)) return prev;
          
          // Add new message and sort by timestamp (newest first)
          const updated = [...prev, event].sort((a, b) => b.created_at - a.created_at);
          
          // Keep only the most recent MAX_MESSAGES
          return updated.slice(0, MAX_MESSAGES);
        });
        
        // Fetch profile data if we don't have it yet
        fetchProfile(event.pubkey);
      }
    );
    
    // Update subscriptions state
    setSubscriptions([messagesSub]);
    setLoading(false);
    
    // Cleanup function
    return () => {
      if (messagesSub) nostrService.unsubscribe(messagesSub);
    };
  }, [connectionStatus, fetchProfile]);

  return {
    messages,
    loading,
    isLoggedIn,
    setMessages
  };
};
