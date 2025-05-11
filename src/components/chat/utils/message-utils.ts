import { useState, useCallback } from "react";
import { NostrEvent } from "@/lib/nostr/types";

export const useMessageSender = () => {
  const [messages, setMessages] = useState<NostrEvent[]>([]);
  
  const updateMessages = useCallback((event: NostrEvent, maxMessages: number) => {
    setMessages(prev => {
      // Check if we already have this message
      if (prev.some(m => m.id === event.id)) return prev;
      
      // Add new message and sort by timestamp (newest first)
      const updated = [...prev, event].sort((a, b) => b.created_at - a.created_at);
      
      // Keep only the most recent maxMessages
      return updated.slice(0, maxMessages);
    });
  }, []);
  
  const sendMessage = useCallback(async (
    messageContent: string,
    isLoggedIn: boolean,
    publicKey: string | null,
    formatContent: (content: string) => any,
    publishEvent: (eventData: any) => Promise<string | null>,
    maxMessages: number
  ) => {
    if (!messageContent.trim() || !isLoggedIn) {
      return;
    }

    try {
      // Process mentions and links according to NIP-27
      const formattedContent = formatContent(messageContent);
      // Since formattedContent could be FormattedSegment[], we need to convert it to string
      const processedContent = typeof formattedContent === 'string' ? formattedContent : messageContent;
      
      // Create a message with the world-chat tag
      const eventId = await publishEvent({
        kind: 1, // TEXT_NOTE
        content: processedContent,
        tags: [['t', 'world-chat']]
      });
      
      if (!eventId) {
        return false;
      }
      
      // Optimistically add the message to the UI for instant feedback
      const tempEvent: NostrEvent = {
        id: eventId,
        pubkey: publicKey!,
        created_at: Math.floor(Date.now() / 1000),
        kind: 1, // TEXT_NOTE
        tags: [['t', 'world-chat']],
        content: messageContent,
        sig: ''
      };
      
      setMessages(prev => [tempEvent, ...prev.slice(0, maxMessages - 1)]);
      return true;
    } catch (error) {
      console.error("Error sending message:", error);
      return false;
    }
  }, []);
  
  return {
    messages,
    updateMessages,
    sendMessage
  };
};
