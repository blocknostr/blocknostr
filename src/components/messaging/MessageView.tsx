
import React, { useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, MessageSquare, Paperclip, Send, Info } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Contact, Message } from "./types";
import { nostrService } from "@/lib/nostr";
import { cn } from "@/lib/utils";

interface MessageViewProps {
  activeContact: Contact | null;
  messages: Message[];
  loading: boolean;
  newMessage: string;
  setNewMessage: (message: string) => void;
  handleSendMessage: () => void;
  sendingMessage: boolean;
  currentUserPubkey: string;
}

const MessageView: React.FC<MessageViewProps> = ({
  activeContact,
  messages,
  loading,
  newMessage,
  setNewMessage,
  handleSendMessage,
  sendingMessage,
  currentUserPubkey
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom of messages when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);
  
  const getDisplayName = (contact: Contact) => {
    return contact.profile?.display_name || 
           contact.profile?.name || 
           `${nostrService.getNpubFromHex(contact.pubkey).substring(0, 8)}...`;
  };
  
  const getAvatarFallback = (contact: Contact) => {
    const name = contact.profile?.display_name || contact.profile?.name || '';
    return name.charAt(0).toUpperCase() || 'N';
  };
  
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!activeContact) {
    return (
      <div className="w-full md:w-2/3 flex flex-col h-full bg-background overflow-hidden">
        <div className="flex flex-col items-center justify-center h-full text-center p-4 gap-4">
          <div className="rounded-full bg-primary/10 p-6">
            <MessageSquare className="h-12 w-12 text-primary" />
          </div>
          <div>
            <p className="text-xl font-semibold">Your Messages</p>
            <p className="text-sm text-muted-foreground mt-1 max-w-[300px]">
              Select a contact to start messaging or add a new contact to begin a conversation
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full md:w-2/3 flex flex-col h-full bg-background overflow-hidden">
      {/* Header */}
      <div className="p-3 border-b flex items-center gap-3 shadow-sm">
        <div className="relative">
          <Avatar className="h-9 w-9 border">
            <AvatarImage src={activeContact.profile?.picture} />
            <AvatarFallback>{getAvatarFallback(activeContact)}</AvatarFallback>
          </Avatar>
          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-background"></span>
        </div>
        <div className="flex-1 overflow-hidden">
          <div className="font-semibold truncate">{getDisplayName(activeContact)}</div>
          <div className="text-xs text-green-500">Online</div>
        </div>
        <Button variant="ghost" size="icon" className="rounded-full">
          <Info className="h-4 w-4" />
        </Button>
      </div>
      
      {/* Messages area with improved animation and visuals */}
      <ScrollArea className="flex-1 p-4">
        {loading ? (
          <div className="flex justify-center items-center h-full py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center text-muted-foreground h-40 gap-1 py-10">
            <MessageSquare className="h-12 w-12 mb-2 text-primary/20" />
            <p className="text-sm font-medium">No messages yet</p>
            <p className="text-xs max-w-[250px]">Send a message to start the conversation with {getDisplayName(activeContact)}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map(message => {
              const isCurrentUser = message.sender === currentUserPubkey;
              
              return (
                <div 
                  key={message.id}
                  className={cn(
                    "flex animate-fade-in my-2",
                    isCurrentUser ? 'justify-end' : 'justify-start'
                  )}
                >
                  {!isCurrentUser && (
                    <Avatar className="h-8 w-8 mr-2 mt-1 flex-shrink-0">
                      <AvatarImage src={activeContact.profile?.picture} />
                      <AvatarFallback>{getAvatarFallback(activeContact)}</AvatarFallback>
                    </Avatar>
                  )}
                  <div 
                    className={cn(
                      "max-w-[75%] px-4 py-2 rounded-2xl shadow-sm",
                      isCurrentUser 
                        ? 'bg-primary text-primary-foreground rounded-tr-sm'
                        : 'bg-muted rounded-tl-sm'
                    )}
                  >
                    <div className="text-sm break-words">{message.content}</div>
                    <div className={cn(
                      "text-[10px] mt-1",
                      isCurrentUser ? 'opacity-70 text-right' : 'text-muted-foreground text-left'
                    )}>
                      {formatTime(message.created_at)}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </ScrollArea>
      
      {/* Message input with improved design */}
      <div className="p-3 border-t flex gap-2 bg-background shadow-sm">
        <Button 
          variant="ghost" 
          size="icon"
          className="h-10 w-10 flex-shrink-0 rounded-full hover:bg-accent"
          disabled={sendingMessage}
        >
          <Paperclip className="h-5 w-5 text-primary" />
        </Button>
        <div className="relative flex-1">
          <Input 
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="bg-muted/50 h-10 pl-4 pr-12 rounded-full"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            disabled={sendingMessage}
          />
          <Button 
            onClick={handleSendMessage}
            className={cn(
              "h-8 w-8 absolute right-1 top-1 rounded-full p-0 flex items-center justify-center",
              !newMessage.trim() || sendingMessage ? "opacity-50" : "opacity-100"
            )}
            variant="default"
            disabled={!newMessage.trim() || sendingMessage}
          >
            {sendingMessage ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MessageView;
