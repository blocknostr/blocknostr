
import React, { useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SendHorizontal, Loader2 } from "lucide-react";
import { NostrEvent } from "@/lib/nostr/types";
import { formatDistanceToNow } from "date-fns";

interface MessageViewProps {
  activeContact: any;
  messages: NostrEvent[];
  loading: boolean;
  newMessage: string;
  setNewMessage: (value: string) => void;
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

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  if (!activeContact) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-muted/30">
        <div className="text-center max-w-md">
          <h3 className="text-xl font-medium mb-2">Select a conversation</h3>
          <p className="text-muted-foreground">
            Choose a contact from the list or start a new conversation.
          </p>
        </div>
      </div>
    );
  }

  return (
    <Card className="flex-1 flex flex-col overflow-hidden border-0 rounded-none shadow-none">
      {/* Contact header */}
      <div className="border-b p-3 flex items-center">
        <div className="font-medium">{activeContact.name || activeContact.pubkey.substring(0, 8) + '...'}</div>
      </div>
      
      {/* Messages area */}
      <CardContent className="flex-1 overflow-hidden p-0 flex flex-col">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <ScrollArea className="flex-1 p-4 subtle-scrollbar" type="hover" scrollHideDelay={1000}>
            {messages.length > 0 ? (
              <div className="space-y-4">
                {messages.map((msg) => {
                  const isSentByMe = msg.pubkey === currentUserPubkey;
                  const timestamp = formatDistanceToNow(new Date(msg.created_at * 1000), { addSuffix: true });
                  
                  return (
                    <div 
                      key={msg.id} 
                      className={`flex ${isSentByMe ? 'justify-end' : 'justify-start'}`}
                    >
                      <div 
                        className={`max-w-[80%] rounded-xl px-4 py-2 ${
                          isSentByMe 
                            ? 'bg-primary text-primary-foreground' 
                            : 'bg-muted text-foreground'
                        }`}
                      >
                        <div className="text-sm">{msg.content}</div>
                        <div className="text-xs opacity-70 mt-1 text-right">{timestamp}</div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            ) : (
              <div className="h-full flex items-center justify-center">
                <p className="text-muted-foreground text-center">
                  No messages yet. Start the conversation!
                </p>
              </div>
            )}
          </ScrollArea>
        )}
        
        {/* Input area */}
        <div className="border-t p-4">
          <form 
            className="flex gap-2" 
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
          >
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1"
            />
            <Button 
              type="submit" 
              size="icon"
              disabled={!newMessage.trim() || sendingMessage}
            >
              {sendingMessage ? 
                <Loader2 className="h-4 w-4 animate-spin" /> : 
                <SendHorizontal className="h-4 w-4" />
              }
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
};

export default MessageView;
