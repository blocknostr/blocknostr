
import { NostrEvent } from "@/lib/nostr/types";
import { useState, useCallback } from "react";

export const useReactionHandler = () => {
  const [emojiReactions, setEmojiReactions] = useState<Record<string, string[]>>({});
  
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

  const addReaction = useCallback(async (
    isLoggedIn: boolean,
    connectionStatus: 'connected' | 'connecting' | 'disconnected',
    emoji: string,
    messageId: string,
    publishEvent: (eventData: any) => Promise<string | null>
  ) => {
    if (!isLoggedIn) {
      return false;
    }
    
    if (connectionStatus !== 'connected') {
      return false;
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
      await publishEvent({
        kind: 7, // Reaction event kind
        content: emoji,
        tags: [
          ['e', messageId],
          ['t', 'world-chat']
        ]
      });
      
      return true;
    } catch (error) {
      console.error("Failed to add reaction:", error);
      return false;
    }
  }, []);

  return {
    emojiReactions,
    handleReaction,
    addReaction
  };
};
