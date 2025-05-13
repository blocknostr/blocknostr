
import { useCallback } from "react";
import { NostrEvent } from "@/lib/nostr/types";
import { nostrService } from "@/lib/nostr";
import { contentFormatter } from "@/lib/nostr";
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
  const isLoggedIn = !!nostrService.publicKey;
  
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
      // Use the new processContent method which returns a string
      const processedContent = contentFormatter.processContent(messageContent);
      
      // Create a message with the specified chat tag
      const eventId = await nostrService.publishEvent({
        kind: 1, // EVENT_KINDS.TEXT_NOTE,
        content: processedContent,
        tags: [['t', chatTag]]
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
        kind: 1, // EVENT_KINDS.TEXT_NOTE,
        tags: [['t', chatTag]],
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
