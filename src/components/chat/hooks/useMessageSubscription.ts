import { useState, useEffect, useCallback } from "react";
import { nostrService } from "@/lib/nostr";
import { EVENT_KINDS } from "@/lib/nostr/constants";
import { NostrEvent, NostrFilter } from "@/lib/nostr/types";

const MAX_MESSAGES = 500; // Increased from 100 to 500 messages
const INITIAL_LOAD_LIMIT = 200; // Increased from 50 to 200 for initial batch

/**
 * Safely get an item from localStorage with error handling
 */
const safeLocalStorageGet = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch (error) {
    console.warn(`Error reading from localStorage (${key}):`, error);
    return null;
  }
};

/**
 * Safely set an item in localStorage with error handling
 */
const safeLocalStorageSet = (key: string, value: string): boolean => {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (error) {
    console.warn(`Error writing to localStorage (${key}):`, error);
    return false;
  }
};

/**
 * Hook to manage message subscriptions and state
 */
export const useMessageSubscription = (
  connectionStatus: 'connected' | 'connecting' | 'disconnected',
  fetchProfile: (pubkey: string) => Promise<void>,
  chatTag: string = "world-chat"
) => {
  const [messages, setMessages] = useState<NostrEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [subscriptions, setSubscriptions] = useState<string[]>([]);

  const isLoggedIn = !!nostrService.publicKey;

  // Reset messages when chat tag changes
  useEffect(() => {
    console.log(`[useMessageSubscription] Chat tag changed to: ${chatTag}. Resetting messages.`);
    setMessages([]);
    setLoading(true);
  }, [chatTag]);

  // Try to load cached messages on initial load or chat tag change
  useEffect(() => {
    console.log(`[useMessageSubscription] Attempting to load cached messages for ${chatTag}.`);
    try {
      const storageKey = `${chatTag}_messages`;
      const cachedMessagesJSON = safeLocalStorageGet(storageKey);

      if (cachedMessagesJSON) {
        const parsedMessages: NostrEvent[] = JSON.parse(cachedMessagesJSON);
        if (Array.isArray(parsedMessages) && parsedMessages.length > 0) {
          console.log(`[useMessageSubscription] Found ${parsedMessages.length} cached messages for ${chatTag}. Processing...`);

          const uniqueMessagesMap = new Map<string, NostrEvent>();
          parsedMessages.forEach(msg => {
            if (msg && msg.id) { // Basic validation for message and its ID
              uniqueMessagesMap.set(msg.id, msg); // Map ensures uniqueness by ID
            }
          });

          const finalCachedMessages = Array.from(uniqueMessagesMap.values())
            .sort((a, b) => b.created_at - a.created_at) // Sort newest first
            .slice(0, MAX_MESSAGES); // Adhere to max messages limit

          console.log(`[useMessageSubscription] Setting ${finalCachedMessages.length} de-duplicated cached messages for ${chatTag}.`);
          setMessages(finalCachedMessages);

          finalCachedMessages.forEach((msg: NostrEvent) => {
            fetchProfile(msg.pubkey).catch(err =>
              console.warn(`[useMessageSubscription] Failed to fetch profile for cached message ${msg.pubkey}:`, err)
            );
          });
        } else {
          console.log(`[useMessageSubscription] No valid cached messages found for ${chatTag}.`);
        }
      } else {
        console.log(`[useMessageSubscription] No cached messages string found for ${chatTag}.`);
      }
    } catch (error) {
      console.warn(`[useMessageSubscription] Error loading cached messages for ${chatTag}:`, error);
    }
  }, [fetchProfile, chatTag]);

  // Setup message subscription
  useEffect(() => {
    if (connectionStatus !== 'connected') {
      setSubscriptions([]); // Clear stored subscription IDs
      setLoading(true);   // Indicate we are not actively subscribed/loading
      return;
    }

    setLoading(true); // Indicate we are starting/restarting the subscription process

    // Use a separate state update function to prevent excessive re-renders
    const updateMessages = (event: NostrEvent) => {
      if (!event || !event.id) { // Validate event and event.id
        console.warn('[useMessageSubscription] Received invalid event or event without ID:', event);
        return;
      }
      setMessages(prevMessages => {
        if (prevMessages.some(m => m.id === event.id)) {
          return prevMessages; // Message already exists
        }

        const updatedMessages = [...prevMessages, event]
          .sort((a, b) => b.created_at - a.created_at)
          .slice(0, MAX_MESSAGES);

        try {
          const storageKey = `${chatTag}_messages`;
          safeLocalStorageSet(storageKey, JSON.stringify(updatedMessages));
        } catch (e) {
          console.warn(`[useMessageSubscription] Failed to cache messages for ${chatTag}:`, e);
        }

        return updatedMessages;
      });

      fetchProfile(event.pubkey).catch(err =>
        console.warn(`[useMessageSubscription] Failed to fetch profile for live event ${event.pubkey}:`, err)
      );
    };

    // Subscribe to chat messages with the specific tag
    const messagesSubId = nostrService.subscribe(
      [
        {
          kinds: [EVENT_KINDS.TEXT_NOTE],
          '#t': [chatTag], // Using '#t' for tag filtering
          limit: INITIAL_LOAD_LIMIT
        } as NostrFilter
      ],
      updateMessages
    );

    // Update subscriptions state
    setSubscriptions([messagesSubId]);
    setLoading(false); // Successfully subscribed

    // Cleanup function
    return () => {
      if (messagesSubId) nostrService.unsubscribe(messagesSubId);
    };
  }, [connectionStatus, fetchProfile, chatTag]);

  return {
    messages,
    loading,
    isLoggedIn,
    setMessages // Exposing setMessages for optimistic updates by useMessageSender
  };
};
