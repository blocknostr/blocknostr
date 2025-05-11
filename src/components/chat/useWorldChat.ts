import { useState, useEffect } from "react";
import { nostrService } from "@/lib/nostr";
import { EVENT_KINDS } from "@/lib/nostr/constants";
import { NostrEvent, NostrFilter } from "@/lib/nostr/types";
import { toast } from "sonner";

const WORLD_CHAT_TAG = "world-chat";
const MAX_MESSAGES = 15;

export const useWorldChat = () => {
  const [messages, setMessages] = useState<NostrEvent[]>([]);
  const [profiles, setProfiles] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [emojiReactions, setEmojiReactions] = useState<Record<string, string[]>>({});
  const isLoggedIn = !!nostrService.publicKey;
  
  useEffect(() => {
    const fetchMessages = () => {
      try {
        setLoading(true);
        
        // Subscribe to world chat messages
        const messagesSub = nostrService.subscribe(
          [
            {
              kinds: [EVENT_KINDS.TEXT_NOTE],
              '#t': [WORLD_CHAT_TAG], // Using '#t' (with single quotes) for tag filtering
              limit: 25
            } as NostrFilter
          ],
          (event) => {
            // Add new message to state (and keep only most recent)
            setMessages(prev => {
              // Check if we already have this message
              if (prev.some(m => m.id === event.id)) return prev;
              
              // Add new message and sort by timestamp (newest first)
              const updated = [...prev, event].sort((a, b) => b.created_at - a.created_at);
              
              // Keep only the most recent MAX_MESSAGES
              return updated.slice(0, MAX_MESSAGES);
            });
            
            // Fetch profile data if we don't have it yet
            if (!profiles[event.pubkey]) {
              fetchProfile(event.pubkey);
            }
          }
        );
        
        // Subscribe to reactions
        const reactionsSub = nostrService.subscribe(
          [
            {
              kinds: [EVENT_KINDS.REACTION],
              '#t': [WORLD_CHAT_TAG],
              limit: 50
            } as NostrFilter
          ],
          (event) => {
            handleReaction(event);
          }
        );
        
        setLoading(false);
        
        // Cleanup function to unsubscribe
        return () => {
          nostrService.unsubscribe(messagesSub);
          nostrService.unsubscribe(reactionsSub);
        };
      } catch (error) {
        console.error("Error fetching world chat messages:", error);
        setLoading(false);
      }
    };
    
    fetchMessages();
  }, []);

  // Fetch profile info
  const fetchProfile = async (pubkey: string) => {
    try {
      const profile = await nostrService.getUserProfile(pubkey);
      if (profile) {
        setProfiles(prev => ({
          ...prev,
          [pubkey]: profile
        }));
      }
    } catch (error) {
      console.error(`Error fetching profile for ${pubkey}:`, error);
    }
  };
  
  // Handle reactions
  const handleReaction = (event: NostrEvent) => {
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
  };

  const sendMessage = async (messageContent: string) => {
    if (!messageContent.trim() || !isLoggedIn) {
      return;
    }

    try {
      // Create a message with the world-chat tag
      const eventId = await nostrService.publishEvent({
        kind: EVENT_KINDS.TEXT_NOTE,
        content: messageContent,
        tags: [['t', WORLD_CHAT_TAG]]
      });
      
      if (!eventId) {
        toast.error("Failed to send message");
        return;
      }
      
      // Optimistically add the message to the UI for instant feedback
      const tempEvent: NostrEvent = {
        id: eventId,
        pubkey: nostrService.publicKey!,
        created_at: Math.floor(Date.now() / 1000),
        kind: EVENT_KINDS.TEXT_NOTE,
        tags: [['t', WORLD_CHAT_TAG]],
        content: messageContent,
        sig: ''
      };
      
      setMessages(prev => [tempEvent, ...prev.slice(0, MAX_MESSAGES - 1)]);
      
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Error sending message");
    }
  };
  
  const addReaction = async (emoji: string, messageId: string) => {
    if (!isLoggedIn) {
      toast.error("You must be logged in to react");
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
      
      // Send reaction to Nostr
      await nostrService.publishEvent({
        kind: EVENT_KINDS.REACTION,
        content: emoji,
        tags: [
          ['e', messageId],
          ['t', WORLD_CHAT_TAG]
        ]
      });
    } catch (error) {
      console.error("Failed to add reaction:", error);
    }
  };

  return {
    messages,
    profiles,
    emojiReactions,
    loading,
    isLoggedIn,
    sendMessage,
    addReaction
  };
};
