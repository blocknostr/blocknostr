
import { useState, useEffect, useCallback } from "react";
import { nostrService } from "@/lib/nostr";
import { EVENT_KINDS } from "@/lib/nostr/constants";
import { NostrEvent, NostrFilter } from "@/lib/nostr/types";
import { toast } from "sonner";
import { contentFormatter } from "@/lib/nostr";

const WORLD_CHAT_TAG = "world-chat";
const MAX_MESSAGES = 15;
const RETRY_INTERVAL = 5000; // 5 seconds for retry

export type ConnectionStatus = 'connected' | 'connecting' | 'disconnected';

export const useWorldChat = () => {
  const [messages, setMessages] = useState<NostrEvent[]>([]);
  const [profiles, setProfiles] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [emojiReactions, setEmojiReactions] = useState<Record<string, string[]>>({});
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connecting');
  const [subscriptions, setSubscriptions] = useState<string[]>([]);
  
  const isLoggedIn = !!nostrService.publicKey;
  
  // Function to get relay connection status
  const updateConnectionStatus = useCallback(() => {
    const relays = nostrService.getRelayStatus();
    const connected = relays.filter(r => r.status === 'connected').length;
    
    if (connected > 0) {
      setConnectionStatus('connected');
      setError(null);
    } else if (relays.length === 0 || !navigator.onLine) {
      setConnectionStatus('disconnected');
    } else {
      setConnectionStatus('connecting');
    }
  }, []);
  
  // Fetch profile info with error handling
  const fetchProfile = useCallback(async (pubkey: string) => {
    if (!pubkey || profiles[pubkey]) return;
    
    try {
      const profile = await nostrService.getUserProfile(pubkey);
      if (profile) {
        setProfiles(prev => ({
          ...prev,
          [pubkey]: profile
        }));
      }
    } catch (error) {
      console.error(`Error fetching profile for ${pubkey}:`, error);
    }
  }, [profiles]);
  
  // Handle reactions with improved error handling
  const handleReaction = useCallback((event: NostrEvent) => {
    try {
      if (!event.content) return;
      
      // Find which message this reaction is for
      const eventTag = event.tags.find(tag => tag.length >= 2 && tag[0] === 'e');
      if (!eventTag) return;
      
      const targetId = eventTag[1];
      
      setEmojiReactions(prev => {
        const existingReactions = prev[targetId] || [];
        // Avoid duplicate emojis
        if (!existingReactions.includes(event.content)) {
          return {
            ...prev,
            [targetId]: [...existingReactions, event.content]
          };
        }
        return prev;
      });
    } catch (error) {
      console.error("Error processing reaction:", error);
    }
  }, []);

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
  }, [fetchProfile, handleReaction, updateConnectionStatus]);

  // Send message with improved error handling and NIP-01 compliance
  const sendMessage = async (messageContent: string) => {
    if (!messageContent.trim() || !isLoggedIn) {
      return;
    }

    try {
      // Process mentions and links according to NIP-27
      const processedContent = contentFormatter.parseContent(messageContent);
      
      // Create a message with the world-chat tag
      const eventId = await nostrService.publishEvent({
        kind: EVENT_KINDS.TEXT_NOTE,
        content: processedContent,
        tags: [['t', WORLD_CHAT_TAG]]
      });
      
      if (!eventId) {
        setError("Failed to send message. Check your connection.");
        return;
      }
      
      // Optimistically add the message to the UI for instant feedback
      const tempEvent: NostrEvent = {
        id: eventId,
        pubkey: nostrService.publicKey!,
        created_at: Math.floor(Date.now() / 1000),
        kind: EVENT_KINDS.TEXT_NOTE,
        tags: [['t', WORLD_CHAT_TAG]],
        content: messageContent,
        sig: ''
      };
      
      setMessages(prev => [tempEvent, ...prev.slice(0, MAX_MESSAGES - 1)]);
      setError(null);
      
    } catch (error) {
      console.error("Error sending message:", error);
      setError("Failed to send message. Please try again.");
    }
  };
  
  // Add reaction with improved error handling (NIP-25 compliant)
  const addReaction = async (emoji: string, messageId: string) => {
    if (!isLoggedIn) {
      toast.error("You must be logged in to react");
      return;
    }
    
    if (connectionStatus !== 'connected') {
      toast.error("You're offline. Can't send reactions.");
      return;
    }
    
    try {
      // Optimistically update UI
      setEmojiReactions(prev => {
        const existingReactions = prev[messageId] || [];
        if (!existingReactions.includes(emoji)) {
          return {
            ...prev,
            [messageId]: [...existingReactions, emoji]
          };
        }
        return prev;
      });
      
      // Send reaction to Nostr relays per NIP-25
      await nostrService.publishEvent({
        kind: EVENT_KINDS.REACTION,
        content: emoji,
        tags: [
          ['e', messageId],
          ['t', WORLD_CHAT_TAG]
        ]
      });
    } catch (error) {
      console.error("Failed to add reaction:", error);
      toast.error("Failed to add reaction");
    }
  };

  return {
    messages,
    profiles,
    emojiReactions,
    loading,
    isLoggedIn,
    sendMessage,
    addReaction,
    error,
    connectionStatus
  };
};
