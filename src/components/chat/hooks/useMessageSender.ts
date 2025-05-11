
import { useState, useCallback } from "react";
import { nostrService } from "@/lib/nostr";
import { NostrEvent } from "@/lib/nostr/types";
import { toast } from "sonner";

// Tag for world chat
const WORLD_CHAT_TAG = "world-chat";
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // ms

/**
 * Hook to handle sending messages in the world chat
 * with enhanced error handling and retries
 */
export const useMessageSender = (
  connectionStatus: 'connected' | 'connecting' | 'disconnected',
  setMessages: React.Dispatch<React.SetStateAction<NostrEvent[]>>,
  setError: React.Dispatch<React.SetStateAction<string | null>>
) => {
  const [isSending, setIsSending] = useState(false);
  
  // Function to send a new message with retry mechanism
  const sendMessage = useCallback(async (content: string) => {
    // Validate connection and auth
    if (connectionStatus !== 'connected') {
      console.error('Cannot send message: Not connected to relays', { connectionStatus });
      setError('Not connected to relays');
      toast.error('Not connected to relays. Please reconnect and try again.');
      return null;
    }
    
    if (!nostrService.publicKey) {
      console.error('Cannot send message: No public key available');
      setError('You must be logged in to send messages');
      toast.error('You must be logged in to send messages');
      return null;
    }
    
    if (!content.trim()) {
      return null;
    }
    
    setIsSending(true);
    setError(null);
    
    // Retry logic
    let retries = 0;
    let messageId = null;
    
    const attemptSend = async (): Promise<string | null> => {
      try {
        console.log(`Attempting to send message (attempt ${retries + 1}/${MAX_RETRIES + 1})`);
        
        // Create the message event - IMPORTANT: using correct format for publishEvent
        const event = {
          kind: 1, // Text note
          content: content.trim(),
          tags: [
            ['t', WORLD_CHAT_TAG]
          ]
        };
        
        // Log the event being published
        console.log("Publishing event:", JSON.stringify(event));
        
        // Get connected relays to verify we have connections
        const relayStatus = nostrService.getRelayStatus();
        const connectedRelays = relayStatus.filter(r => r.status === 'connected');
        
        console.log(`Connected relays: ${connectedRelays.length}`, 
          connectedRelays.map(r => r.url).join(', '));
        
        if (connectedRelays.length === 0) {
          throw new Error('No connected relays available');
        }
        
        // Important: Call publishEvent with only one argument as per the fixed adapter
        const id = await nostrService.publishEvent(event);
        console.log("Event published with ID:", id);
        
        if (!id) {
          throw new Error('Failed to publish message (no event ID returned)');
        }
        
        return id;
      } catch (error) {
        console.error('Error sending message:', error);
        return null;
      }
    };
    
    while (retries <= MAX_RETRIES) {
      messageId = await attemptSend();
      
      if (messageId) {
        break;
      }
      
      retries++;
      
      if (retries <= MAX_RETRIES) {
        console.log(`Retrying in ${RETRY_DELAY}ms...`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      }
    }
    
    try {
      if (!messageId) {
        throw new Error('Failed to send message after multiple attempts');
      }
      
      console.log("Successfully sent message with ID:", messageId);
      
      // Get full event details
      const fullEvent = await nostrService.getEventById(messageId);
      if (fullEvent) {
        console.log("Retrieved full event details:", fullEvent);
        
        // Optimistically add to messages
        setMessages(prev => {
          // Add new message and sort by timestamp (newest first)
          return [fullEvent, ...prev].sort((a, b) => b.created_at - a.created_at);
        });
      } else {
        console.log("Could not retrieve full event, creating temporary one");
        
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
      console.error('Error finalizing message send:', error);
      setError(typeof error === 'string' ? error : error instanceof Error ? error.message : 'Failed to send message');
      toast.error('Failed to send message');
      return null;
    } finally {
      setIsSending(false);
    }
  }, [connectionStatus, setMessages, setError]);
  
  return {
    sendMessage,
    isSending
  };
};
