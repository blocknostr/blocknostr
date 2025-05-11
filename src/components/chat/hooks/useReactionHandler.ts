
import { useState, useCallback, useEffect } from "react";
import { nostrService } from "@/lib/nostr";
import { EVENT_KINDS } from "@/lib/nostr/constants";
import { NostrFilter } from "@/lib/nostr/types";

// Tag for emoji reactions
const WORLD_CHAT_TAG = "world-chat";

/**
 * Hook to handle emoji reactions for messages
 */
export const useReactionHandler = (
  connectionStatus: 'connected' | 'connecting' | 'disconnected'
) => {
  const [emojiReactions, setEmojiReactions] = useState<Record<string, string[]>>({});
  const [subscriptions, setSubscriptions] = useState<string[]>([]);
  
  // Subscribe to reactions
  useEffect(() => {
    // Only attempt to subscribe if we are connected
    if (connectionStatus !== 'connected') {
      return;
    }
    
    // Clean up any existing subscriptions
    subscriptions.forEach(subId => {
      if (subId) nostrService.unsubscribe(subId);
    });
    
    // Subscribe to emoji reactions
    const reactionsSub = nostrService.subscribe(
      [
        {
          kinds: [EVENT_KINDS.REACTION],
          '#t': [WORLD_CHAT_TAG]
        } as NostrFilter
      ],
      (event) => {
        try {
          // Extract the message ID being reacted to
          const messageIdTag = event.tags.find(tag => tag[0] === 'e');
          if (!messageIdTag || !messageIdTag[1]) return;
          
          const messageId = messageIdTag[1];
          const emoji = event.content;
          
          // Add emoji to reactions list
          setEmojiReactions(prev => {
            const currentReactions = prev[messageId] || [];
            if (currentReactions.includes(emoji)) return prev;
            
            return {
              ...prev,
              [messageId]: [...currentReactions, emoji]
            };
          });
        } catch (error) {
          console.error('Error processing reaction:', error);
        }
      }
    );
    
    // Update subscriptions state
    setSubscriptions([reactionsSub]);
    
    // Cleanup function
    return () => {
      if (reactionsSub) nostrService.unsubscribe(reactionsSub);
    };
  }, [connectionStatus]);
  
  // Function to add a reaction to a message
  const addReaction = useCallback(async (emoji: string, messageId: string) => {
    try {
      if (!nostrService.publicKey) {
        console.log('User not logged in');
        return;
      }
      
      // Publish reaction event
      await nostrService.publishEvent({
        kind: EVENT_KINDS.REACTION,
        content: emoji,
        tags: [
          ['e', messageId],
          ['t', WORLD_CHAT_TAG]
        ]
      });
      
      // Optimistically update UI
      setEmojiReactions(prev => {
        const currentReactions = prev[messageId] || [];
        if (currentReactions.includes(emoji)) return prev;
        
        return {
          ...prev,
          [messageId]: [...currentReactions, emoji]
        };
      });
    } catch (error) {
      console.error('Error adding reaction:', error);
    }
  }, []);
  
  return {
    emojiReactions,
    addReaction
  };
};
