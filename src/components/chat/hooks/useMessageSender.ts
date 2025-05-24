
import { useCallback } from "react";
import { NostrEvent } from "@/lib/nostr/types";
import { chatNostrService } from "@/lib/nostr/chat-service";
import { contentFormatter } from "@/lib/nostr";
import { extractMentions } from "@/lib/nostr/utils/nip/nip27";
import { toast } from "sonner";

const MAX_MESSAGES = 15;

/**
 * Hook to handle sending messages to the world chat
 */
export const useMessageSender = (
  connectionStatus: 'connected' | 'connecting' | 'disconnected',
  setMessages: React.Dispatch<React.SetStateAction<NostrEvent[]>>,
  setError: React.Dispatch<React.SetStateAction<string | null>>,
  chatTag: string = "world-chat"
) => {
  const isLoggedIn = !!chatNostrService.publicKey;
  
  // Send message with improved error handling
  const sendMessage = useCallback(async (messageContent: string) => {
    if (!messageContent.trim() || !isLoggedIn) {
      return;
    }
    
    if (connectionStatus !== 'connected') {
      toast.error("You're offline. Can't send messages right now.");
      return;
    }

    try {
      // Process mentions and links according to NIP-27
      const processedContent = contentFormatter.processContent(messageContent);
      
      // Extract mentions to add as tags
      const mentions = extractMentions(messageContent);
      const tags = [['t', chatTag]];
      
      // Iterate through mentions and add as tags
      if (mentions && mentions.length > 0) {
        mentions.forEach(mention => {
          if (mention.startsWith('@')) {
            // Skip simple @ mentions for now as we don't have a way to resolve them to pubkeys
            // In a full implementation, you would query a directory or your contacts
            return;
          }
          
          if (mention.startsWith('nostr:npub1') || mention.startsWith('nostr:nprofile1')) {
            // Add p tag for profile mentions
            const pubkey = mention.split(':')[1];
            if (pubkey) {
              tags.push(['p', pubkey]);
            }
          } else if (mention.startsWith('nostr:note1') || mention.startsWith('nostr:nevent1')) {
            // Add e tag for event mentions
            const eventId = mention.split(':')[1];
            if (eventId) {
              tags.push(['e', eventId]);
            }
          }
        });
      }
      
      // Create a message with the specified chat tag and any mention tags
      const eventId = await chatNostrService.publishEvent({
        kind: 1, // EVENT_KINDS.TEXT_NOTE,
        content: processedContent,
        tags: tags
      });
      
      if (!eventId) {
        setError("Failed to send message. Check your connection.");
        return;
      }
      
      // Optimistically add the message to the UI for instant feedback
      const tempEvent: NostrEvent = {
        id: eventId,
        pubkey: chatNostrService.publicKey!,
        created_at: Math.floor(Date.now() / 1000),
        kind: 1, // EVENT_KINDS.TEXT_NOTE,
        tags: tags,
        content: messageContent,
        sig: ''
      };
      
      setMessages(prev => [tempEvent, ...prev.slice(0, MAX_MESSAGES - 1)]);
      setError(null);
      
    } catch (error) {
      console.error("Error sending message:", error);
      setError("Failed to send message. Please try again.");
      toast.error("Failed to send message");
    }
  }, [connectionStatus, isLoggedIn, setError, setMessages, chatTag]);

  return {
    isLoggedIn,
    sendMessage
  };
};
