
import { useState, useEffect, useCallback } from "react";
import { chatNostrService } from "@/lib/nostr/chat-service";
import { EventKinds } from "@/lib/nostr/constants";
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
  
  const isLoggedIn = !!chatNostrService.publicKey;

  // Reset messages when chat tag changes
  useEffect(() => {
    setMessages([]);
    setLoading(true);
  }, [chatTag]);
  
  // Try to load cached messages on initial load or chat tag change
  useEffect(() => {
    try {
      const storageKey = `${chatTag}_messages`;
      const cachedMessages = safeLocalStorageGet(storageKey);
      
      if (cachedMessages) {
        const parsedMessages = JSON.parse(cachedMessages);
        if (Array.isArray(parsedMessages) && parsedMessages.length > 0) {
          setMessages(parsedMessages);
          
          // Fetch profiles for these messages
          parsedMessages.forEach((msg: NostrEvent) => {
            fetchProfile(msg.pubkey).catch(err => 
              console.warn(`Failed to fetch profile for ${msg.pubkey}:`, err)
            );
          });
        }
      }
    } catch (error) {
      console.warn(`Error loading cached messages for ${chatTag}:`, error);
    }
  }, [fetchProfile, chatTag]);
  
  // Setup message subscription
  useEffect(() => {
    // Only attempt to subscribe if we are connected
    if (connectionStatus !== 'connected') {
      return;
    }

    // Clean up any existing subscriptions
    subscriptions.forEach(subId => {
      if (subId) chatNostrService.unsubscribe(subId);
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
        const limitedMessages = updated.slice(0, MAX_MESSAGES);
        
        // Cache the messages for faster loading next time
        try {
          const storageKey = `${chatTag}_messages`;
          safeLocalStorageSet(storageKey, JSON.stringify(limitedMessages));
        } catch (e) {
          console.warn(`Failed to cache messages for ${chatTag}:`, e);
        }
        
        return limitedMessages;
      });
      
      // Fetch profile data if we don't have it yet - do this outside of state update
      fetchProfile(event.pubkey).catch(err => 
        console.warn(`Failed to fetch profile for ${event.pubkey}:`, err)
      );
    };
    
    // Subscribe to chat messages with the specific tag
    const messagesSub = chatNostrService.subscribe(
      [
        {
          kinds: [EventKinds.TEXT_NOTE],
          '#t': [chatTag], // Using '#t' for tag filtering
          limit: INITIAL_LOAD_LIMIT
        } as NostrFilter
      ],
      updateMessages
    );
    
    // Update subscriptions state
    setSubscriptions([messagesSub]);
    setLoading(false);
    
    // Cleanup function
    return () => {
      if (messagesSub) chatNostrService.unsubscribe(messagesSub);
    };
  }, [connectionStatus, fetchProfile, chatTag]);

  return {
    messages,
    loading,
    isLoggedIn,
    setMessages
  };
};
