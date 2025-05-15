
import { useState, useCallback, useEffect } from "react";
import { chatNostrService } from "@/lib/nostr/chat-service";
import { EVENT_KINDS } from "@/lib/nostr/constants";
import { NostrEvent, NostrFilter } from "@/lib/nostr/types";
import { toast } from "sonner";
import { Filter } from "nostr-tools";

/**
 * Hook to manage emoji reactions to messages
 */
export const useReactionHandler = (
  connectionStatus: 'connected' | 'connecting' | 'disconnected',
  chatTag: string = "world-chat"
) => {
  const [emojiReactions, setEmojiReactions] = useState<Record<string, string[]>>({});
  const [subscriptions, setSubscriptions] = useState<string[]>([]);
  
  const isLoggedIn = !!chatNostrService.publicKey;
  
  // Reset reactions when chat tag changes
  useEffect(() => {
    setEmojiReactions({});
  }, [chatTag]);
  
  // Handle reactions with improved error handling
  const handleReaction = useCallback((event: NostrEvent) => {
    try {
      if (!event.content) return;
      
      // Find which message this reaction is for
      const eventTag = event.tags.find(tag => tag.length >= 2 && tag[0] === 'e');
      if (!eventTag) return;
      
      const targetId = eventTag[1];
      
      // Verify this reaction belongs to our chat channel
      const chatTagMatch = event.tags.find(tag => 
        tag.length >= 2 && tag[0] === 't' && tag[1] === chatTag
      );
      
      if (!chatTagMatch) return;
      
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
  }, [chatTag]);

  // Setup reaction subscription
  useEffect(() => {
    // Only attempt to subscribe if we are connected
    if (connectionStatus !== 'connected') {
      return;
    }
    
    // Clean up any existing subscriptions
    subscriptions.forEach(subId => {
      if (subId) chatNostrService.unsubscribe(subId);
    });
    
    // Subscribe to reactions (NIP-25) for this specific chat tag
    const reactionsSub = chatNostrService.subscribe(
      [
        {
          kinds: [EVENT_KINDS.REACTION],
          '#t': [chatTag],
          limit: 50
        } as Filter
      ],
      handleReaction
    );
    
    setSubscriptions([reactionsSub]);
    
    // Cleanup function
    return () => {
      if (reactionsSub) chatNostrService.unsubscribe(reactionsSub);
    };
  }, [connectionStatus, handleReaction, chatTag]);

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
      
      // Send reaction to Nostr relays per NIP-25 with channel tag
      await chatNostrService.publishEvent({
        kind: EVENT_KINDS.REACTION,
        content: emoji,
        tags: [
          ['e', messageId],
          ['t', chatTag]
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
