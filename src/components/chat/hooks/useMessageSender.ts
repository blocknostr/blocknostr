
import { useState, useCallback } from "react";
import { nostrService } from "@/lib/nostr";
import { NostrEvent } from "@/lib/nostr/types";

// Tag for world chat
const WORLD_CHAT_TAG = "world-chat";

/**
 * Hook to handle sending messages in the world chat
 */
export const useMessageSender = (
  connectionStatus: 'connected' | 'connecting' | 'disconnected',
  setMessages: React.Dispatch<React.SetStateAction<NostrEvent[]>>,
  setError: React.Dispatch<React.SetStateAction<string | null>>
) => {
  const [isSending, setIsSending] = useState(false);
  
  // Function to send a new message
  const sendMessage = useCallback(async (content: string) => {
    // Validate connection and auth
    if (connectionStatus !== 'connected') {
      setError('Not connected to relays');
      return;
    }
    
    if (!nostrService.publicKey) {
      setError('You must be logged in to send messages');
      return;
    }
    
    if (!content.trim()) {
      return;
    }
    
    setIsSending(true);
    setError(null);
    
    try {
      // Create and publish the message event
      const event: Partial<NostrEvent> = {
        kind: 1, // Text note
        content: content.trim(),
        tags: [
          ['t', WORLD_CHAT_TAG]
        ]
      };
      
      // Publish the event
      const messageId = await nostrService.publishEvent(event);
      if (!messageId) {
        throw new Error('Failed to publish message');
      }
      
      // Get full event details
      const fullEvent = await nostrService.getEventById(messageId);
      if (fullEvent) {
        // Optimistically add to messages
        setMessages(prev => {
          // Add new message and sort by timestamp (newest first)
          return [fullEvent, ...prev].sort((a, b) => b.created_at - a.created_at);
        });
      }
      
      return messageId;
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message');
      return null;
    } finally {
      setIsSending(false);
    }
  }, [connectionStatus, nostrService.publicKey, setMessages, setError]);
  
  return {
    sendMessage,
    isSending
  };
};
