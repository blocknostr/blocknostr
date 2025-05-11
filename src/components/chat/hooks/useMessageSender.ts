
import { useState, useCallback } from "react";
import { nostrService } from "@/lib/nostr";
import { NostrEvent } from "@/lib/nostr/types";
import { toast } from "sonner";

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
      toast.error('Not connected to relays. Please reconnect and try again.');
      return null;
    }
    
    if (!nostrService.publicKey) {
      setError('You must be logged in to send messages');
      toast.error('You must be logged in to send messages');
      return null;
    }
    
    if (!content.trim()) {
      return null;
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
      } else {
        // If we couldn't get the full event, create a temporary one
        const tempEvent: NostrEvent = {
          id: messageId,
          pubkey: nostrService.publicKey || '',
          created_at: Math.floor(Date.now() / 1000),
          kind: 1,
          tags: [['t', WORLD_CHAT_TAG]],
          content: content.trim(),
          sig: '' // Empty signature for temporary events
        };
        
        setMessages(prev => {
          return [tempEvent, ...prev].sort((a, b) => b.created_at - a.created_at);
        });
      }
      
      toast.success('Message sent');
      return messageId;
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message');
      toast.error('Failed to send message');
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
