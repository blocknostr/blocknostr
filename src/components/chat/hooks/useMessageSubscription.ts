import { useState, useEffect, useCallback } from "react";
import { nostrService } from "@/lib/nostr";
import { EVENT_KINDS } from "@/lib/nostr/constants";
import { NostrEvent, NostrFilter } from "@/lib/nostr/types";

const WORLD_CHAT_TAG = "world-chat";
const MAX_MESSAGES = 100; // Keeping at 100 messages

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
    
    // Use a separate state update function to prevent excessive re-renders
    const updateMessages = (event: NostrEvent) => {
      setMessages(prev => {
        // Check if we already have this message
        if (prev.some(m => m.id === event.id)) return prev;
        
        // Add new message and sort by timestamp (newest first)
        // Using a more efficient approach to avoid unnecessary re-renders
        const updated = [...prev, event].sort((a, b) => b.created_at - a.created_at);
        
        // Keep only the most recent MAX_MESSAGES
        return updated.slice(0, MAX_MESSAGES);
      });
      
      // Fetch profile data if we don't have it yet - do this outside of state update
      fetchProfile(event.pubkey);
    };
    
    // Subscribe to world chat messages with a smaller batch size and throttled updates
    const messagesSub = nostrService.subscribe(
      [
        {
          kinds: [EVENT_KINDS.TEXT_NOTE],
          '#t': [WORLD_CHAT_TAG], // Using '#t' for tag filtering
          limit: 50 // Reduced from 100 to 50 for faster initial load
        } as NostrFilter
      ],
      updateMessages
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
