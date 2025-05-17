
import React, { useState, useEffect, useRef } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useProfileCache } from "@/hooks/useProfileCache";
import { nostrService } from "@/lib/nostr";
import { formatDistanceToNow } from "date-fns";
import { Send, Loader2 } from "lucide-react";
import { formatDAOSerialNumber } from "@/lib/dao/serial-number";
import { DAO } from "@/types/dao";
import { NostrEvent } from "@/lib/nostr";
import { EVENT_KINDS } from "@/lib/nostr/constants";
import { toast } from "sonner";
import { useRelays } from '@/hooks/useRelays';

interface DAOGroupChatProps {
  dao: DAO;
  currentUserPubkey: string | null;
}

interface ChatMessage {
  id: string;
  pubkey: string;
  content: string;
  createdAt: number;
  profile?: any;
}

const DAOGroupChat: React.FC<DAOGroupChatProps> = ({ dao, currentUserPubkey }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [connected, setConnected] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const profileCache = useProfileCache();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { connectToRelays } = useRelays();
  
  // Format channel name for our DAO
  const channelName = `blocknostr-dao-${formatDAOSerialNumber(dao.serialNumber || 1).replace('#', '').toLowerCase()}`;
  
  useEffect(() => {
    // Scroll to bottom on new messages
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        // Connect to relays first instead of checking for pool
        await connectToRelays();
        
        setConnected(true);
        setLoading(true);
        
        // Subscribe to channel messages
        const filter = {
          kinds: [EVENT_KINDS.CHANNEL_MESSAGE],
          '#e': [dao.id], // Use DAO ID as a reference
          '#t': [channelName], // Channel tag
          limit: 50
        };
        
        // Create subscription for chat messages
        const chatSubId = nostrService.subscribe([filter], (event) => {
          try {
            handleNewMessage(event);
          } catch (error) {
            console.error("Error processing chat message:", error);
          }
        });
        
        return () => {
          if (chatSubId) {
            nostrService.unsubscribe(chatSubId);
          }
        };
      } catch (error) {
        console.error("Error setting up chat subscription:", error);
        toast.error("Failed to connect to chat");
        setLoading(false);
      }
    };
    
    fetchMessages();
  }, [dao.id, channelName, connectToRelays]);
  
  const handleNewMessage = async (event: NostrEvent) => {
    setLoading(false);
    
    // Process the new message
    const newMessage: ChatMessage = {
      id: event.id,
      pubkey: event.pubkey,
      content: event.content,
      createdAt: event.created_at || Math.floor(Date.now() / 1000),
    };
    
    // Check if we already have this message (by ID)
    if (messages.some(msg => msg.id === newMessage.id)) {
      return;
    }
    
    // Add the new message
    setMessages(prevMessages => {
      const newMessages = [...prevMessages, newMessage].sort((a, b) => a.createdAt - b.createdAt);
      
      // Get unique pubkeys from all messages for profile fetching
      const uniquePubkeys = Array.from(new Set(newMessages.map(msg => msg.pubkey)));
      
      // Fetch profiles for messages
      profileCache.fetchProfiles(uniquePubkeys).then(profiles => {
        setMessages(prevMsgs => 
          prevMsgs.map(msg => ({
            ...msg, 
            profile: profiles[msg.pubkey] || null
          }))
        );
      });
      
      return newMessages;
    });
  };
  
  const sendMessage = async () => {
    if (!message.trim() || !currentUserPubkey || sending) return;
    
    setSending(true);
    try {
      const event = {
        kind: EVENT_KINDS.CHANNEL_MESSAGE,
        content: message,
        tags: [
          ["e", dao.id], // Reference to DAO event
          ["t", channelName], // Channel tag
          ["subject", `DAO Chat: ${dao.name}`] // Subject as DAO name
        ]
      };
      
      const msgId = await nostrService.publishEvent(event);
      if (msgId) {
        setMessage("");
        toast.success("Message sent");
      } else {
        toast.error("Failed to send message");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    } finally {
      setSending(false);
    }
  };
  
  // Handle Enter key to submit
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };
  
  const getProfileName = (pubkey: string, profile?: any): string => {
    if (profile?.name) return profile.name;
    if (profile?.displayName) return profile.displayName;
    return pubkey.substring(0, 8) + "..." + pubkey.substring(pubkey.length - 4);
  };
  
  const getAvatarLetters = (pubkey: string, profile?: any): string => {
    if (profile?.name) return profile.name.substring(0, 2).toUpperCase();
    if (profile?.displayName) return profile.displayName.substring(0, 2).toUpperCase();
    return pubkey.substring(0, 2).toUpperCase();
  };
  
  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center space-x-2">
          <span># {channelName}</span>
          {dao.isPrivate && <span className="text-xs bg-secondary py-1 px-2 rounded-full">Private</span>}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-grow px-2 pb-2 flex flex-col h-[calc(100%-4rem)]">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">Connecting to chat...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center h-full text-muted-foreground p-4">
            <p className="mb-2">No messages yet</p>
            <p className="text-sm">Be the first to start the conversation!</p>
          </div>
        ) : (
          <ScrollArea className="flex-grow pr-2 h-full" ref={scrollAreaRef}>
            <div className="space-y-4 py-4">
              {messages.map((msg) => (
                <div 
                  key={msg.id} 
                  className={`flex items-start gap-3 ${msg.pubkey === currentUserPubkey ? 'justify-end' : ''}`}
                >
                  {msg.pubkey !== currentUserPubkey && (
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={msg.profile?.picture} />
                      <AvatarFallback>{getAvatarLetters(msg.pubkey, msg.profile)}</AvatarFallback>
                    </Avatar>
                  )}
                  
                  <div className={`flex flex-col ${msg.pubkey === currentUserPubkey ? 'items-end' : 'items-start'}`}>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {getProfileName(msg.pubkey, msg.profile)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(msg.createdAt * 1000), { addSuffix: true })}
                      </span>
                    </div>
                    
                    <div className={`px-3 py-2 rounded-lg ${
                      msg.pubkey === currentUserPubkey 
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                  
                  {msg.pubkey === currentUserPubkey && (
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={msg.profile?.picture} />
                      <AvatarFallback>{getAvatarLetters(msg.pubkey, msg.profile)}</AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
        )}
        
        <div className="flex items-center gap-2 pt-3">
          <Input
            placeholder={currentUserPubkey ? "Type a message..." : "Login to chat"}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={!currentUserPubkey || !connected}
            className="flex-grow"
          />
          <Button 
            size="icon" 
            onClick={sendMessage} 
            disabled={!message.trim() || !currentUserPubkey || sending || !connected}
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default DAOGroupChat;
