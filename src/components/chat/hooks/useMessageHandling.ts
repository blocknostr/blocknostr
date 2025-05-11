
import { useCallback } from "react";
import { toast } from "sonner";

export const useMessageHandling = (
  messages: any[],
  updateMessages: (event: any, maxMessages: number) => void,
  maxMessages: number,
  isLoggedIn: boolean,
  connectionStatus: 'connected' | 'connecting' | 'disconnected',
  setError: (error: string | null) => void,
  nostrService: any
) => {
  // Send message with improved error handling and NIP-01 compliance
  const sendMessage = useCallback(async (messageContent: string) => {
    if (!messageContent.trim() || !isLoggedIn) {
      return;
    }

    try {
      // Process mentions and links according to NIP-27
      const formattedContent = nostrService.contentFormatter.parseContent(messageContent);
      // Since formattedContent could be FormattedSegment[], we need to convert it to string
      const processedContent = typeof formattedContent === 'string' ? formattedContent : messageContent;
      
      // Create a message with the world-chat tag
      const eventId = await nostrService.publishEvent({
        kind: 1, // TEXT_NOTE
        content: processedContent,
        tags: [['t', 'world-chat']]
      });
      
      if (!eventId) {
        setError("Failed to send message. Check your connection.");
        return false;
      }
      
      // Optimistically add the message to the UI for instant feedback
      const tempEvent = {
        id: eventId,
        pubkey: nostrService.publicKey!,
        created_at: Math.floor(Date.now() / 1000),
        kind: 1, // TEXT_NOTE
        tags: [['t', 'world-chat']],
        content: messageContent,
        sig: ''
      };
      
      updateMessages(tempEvent, maxMessages);
      setError(null);
      return true;
    } catch (error) {
      console.error("Error sending message:", error);
      setError("Failed to send message. Check your connection.");
      return false;
    }
  }, [isLoggedIn, nostrService, setError, updateMessages, maxMessages]);
  
  // Add reaction wrapper with toast feedback
  const handleAddReaction = useCallback(async (emoji: string, messageId: string) => {
    if (!isLoggedIn) {
      toast.error("You must be logged in to react");
      return;
    }
    
    if (connectionStatus !== 'connected') {
      toast.error("You're offline. Can't send reactions.");
      return;
    }
    
    try {
      // Send reaction to Nostr relays per NIP-25
      await nostrService.publishEvent({
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
  }, [isLoggedIn, connectionStatus, nostrService]);
  
  return {
    sendMessage,
    handleAddReaction
  };
};
