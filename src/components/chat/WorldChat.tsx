import React, { useState, useEffect, useRef } from "react";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SmilePlus, SendHorizontal } from "lucide-react";
import { nostrService } from "@/lib/nostr";
import { formatDistanceToNow } from "date-fns";
import { EVENT_KINDS } from "@/lib/nostr/constants";
import { NostrEvent } from "@/lib/nostr/types";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";

const MAX_CHARS = 140;
const MAX_MESSAGES = 15;
const WORLD_CHAT_TAG = "world-chat";
const COMMON_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "😡"];

const WorldChat = () => {
  const [newMessage, setNewMessage] = useState("");
  const [messages, setMessages] = useState<NostrEvent[]>([]);
  const [profiles, setProfiles] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [emojiReactions, setEmojiReactions] = useState<Record<string, string[]>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isLoggedIn = !!nostrService.publicKey;

  // Fetch messages on component mount
  useEffect(() => {
    const fetchMessages = () => {
      try {
        setLoading(true);
        
        // Subscribe to world chat messages
        const messagesSub = nostrService.subscribe(
          [
            {
              kinds: [EVENT_KINDS.TEXT_NOTE],
              '#t': [WORLD_CHAT_TAG], // Filter by the world-chat tag
              limit: 25
            }
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
            }
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
  
  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);
  
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

  const sendMessage = async () => {
    if (!newMessage.trim() || !isLoggedIn) {
      return;
    }
    
    if (newMessage.length > MAX_CHARS) {
      toast.error(`Message too long, maximum ${MAX_CHARS} characters`);
      return;
    }

    try {
      // Create a message with the world-chat tag
      const eventId = await nostrService.publishEvent({
        kind: EVENT_KINDS.TEXT_NOTE,
        content: newMessage,
        tags: [['t', WORLD_CHAT_TAG]]
      });
      
      if (!eventId) {
        toast.error("Failed to send message");
        return;
      }
      
      // Clear input after sending
      setNewMessage("");
      
      // Optimistically add the message to the UI for instant feedback
      const tempEvent: NostrEvent = {
        id: eventId,
        pubkey: nostrService.publicKey!,
        created_at: Math.floor(Date.now() / 1000),
        kind: EVENT_KINDS.TEXT_NOTE,
        tags: [['t', WORLD_CHAT_TAG]],
        content: newMessage,
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

  const getDisplayName = (pubkey: string) => {
    const profile = profiles[pubkey];
    return profile?.name || profile?.display_name || `${pubkey.substring(0, 6)}...`;
  };
  
  const getProfilePicture = (pubkey: string) => {
    const profile = profiles[pubkey];
    return profile?.picture || '';
  };
  
  const getAvatarFallback = (pubkey: string) => {
    const displayName = getDisplayName(pubkey);
    return displayName.charAt(0).toUpperCase();
  };

  return (
    <Card className="h-[400px] flex flex-col">
      <CardHeader className="py-2 px-3 border-b">
        <CardTitle className="text-base">World Chat</CardTitle>
      </CardHeader>
      
      {/* Messages area */}
      <CardContent className="p-0 overflow-y-auto flex-1">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-muted-foreground">Loading messages...</p>
          </div>
        ) : messages.length > 0 ? (
          <div className="p-2 space-y-2">
            {messages.map(message => (
              <div key={message.id} className="flex items-start gap-1.5">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={getProfilePicture(message.pubkey)} />
                  <AvatarFallback className="text-xs">{getAvatarFallback(message.pubkey)}</AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="font-medium text-xs truncate">{getDisplayName(message.pubkey)}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {formatDistanceToNow(new Date(message.created_at * 1000), { addSuffix: true })}
                    </span>
                  </div>
                  
                  <p className="text-xs break-words whitespace-pre-wrap">{message.content}</p>
                  
                  {/* Reactions */}
                  {emojiReactions[message.id] && emojiReactions[message.id].length > 0 && (
                    <div className="flex flex-wrap gap-0.5 mt-0.5">
                      {emojiReactions[message.id].map((emoji, idx) => (
                        <span key={idx} className="inline-flex items-center bg-muted px-1 rounded-full text-[10px]">
                          {emoji}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  {/* Reaction button */}
                  <div className="mt-0.5">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-5 px-1 text-[10px]">
                          <SmilePlus className="h-3 w-3 mr-1" />
                          React
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-1">
                        <div className="flex gap-1">
                          {COMMON_EMOJIS.map(emoji => (
                            <Button 
                              key={emoji} 
                              variant="ghost" 
                              size="sm"
                              className="h-7 w-7 p-0"
                              onClick={() => addReaction(emoji, message.id)}
                            >
                              {emoji}
                            </Button>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-muted-foreground">No messages yet. Start the conversation!</p>
          </div>
        )}
      </CardContent>
      
      {/* Input area */}
      <div className="border-t p-2">
        {isLoggedIn ? (
          <div className="flex items-center gap-1">
            <Input
              placeholder="Send a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              maxLength={MAX_CHARS}
              className="text-xs h-8"
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            />
            <div className="flex items-center gap-1">
              <span className={`text-[10px] ${newMessage.length > MAX_CHARS ? 'text-destructive font-bold' : 'text-muted-foreground'}`}>
                {newMessage.length}/{MAX_CHARS}
              </span>
              <Button 
                onClick={sendMessage} 
                disabled={!newMessage.trim() || newMessage.length > MAX_CHARS}
                size="sm"
                className="h-8 w-8 p-0"
              >
                <SendHorizontal className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-xs text-center text-muted-foreground p-1">
            Login to join the conversation
          </p>
        )}
      </div>
    </Card>
  );
};

export default WorldChat;
