
import { useState, useCallback, useEffect } from "react";
import { nostrService } from "@/lib/nostr";
import { EVENT_KINDS } from "@/lib/nostr/constants";
import { NostrEvent, NostrFilter } from "@/lib/nostr/types";
import { toast } from "sonner";

const WORLD_CHAT_TAG = "world-chat";

/**
 * Hook to manage emoji reactions to messages
 */
export const useReactionHandler = (
  connectionStatus: 'connected' | 'connecting' | 'disconnected'
) => {
  const [emojiReactions, setEmojiReactions] = useState<Record<string, string[]>>({});
  const [subscriptions, setSubscriptions] = useState<string[]>([]);
  
  const isLoggedIn = !!nostrService.publicKey;
  
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

  // Setup reaction subscription
  useEffect(() => {
    // Only attempt to subscribe if we are connected
    if (connectionStatus !== 'connected') {
      return;
    }
    
    // Clean up any existing subscriptions
    subscriptions.forEach(subId => {
      if (subId) nostrService.unsubscribe(subId);
    });
    
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
    
    setSubscriptions([reactionsSub]);
    
    // Cleanup function
    return () => {
      if (reactionsSub) nostrService.unsubscribe(reactionsSub);
    };
  }, [connectionStatus, handleReaction]);

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
    emojiReactions,
    addReaction
  };
};
