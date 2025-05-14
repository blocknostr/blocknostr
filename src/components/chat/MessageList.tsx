
import React, { useRef, useEffect } from "react";
import { CardContent } from "@/components/ui/card";
import MessageItem from "./MessageItem";
import { NostrEvent } from "@/lib/nostr/types";
import { Loader2, MessageSquare } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface MessageListProps {
  messages: NostrEvent[];
  profiles: Record<string, any>;
  emojiReactions: Record<string, string[]>;
  loading: boolean;
  isLoggedIn: boolean;
  onAddReaction: (emoji: string, messageId: string) => void;
}

const MessageList: React.FC<MessageListProps> = ({
  messages,
  profiles,
  emojiReactions,
  loading,
  isLoggedIn,
  onAddReaction
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  // Create a ref we can use with DOM methods
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0 && messagesEndRef.current && scrollContainerRef.current) {
      // Find the actual scroll container (viewport) which is the div inside ScrollArea
      const scrollContainer = scrollContainerRef.current.querySelector('[data-radix-scroll-area-viewport]');
      
      if (scrollContainer) {
        // Check if user is near the bottom (within 100px)
        const isAtBottom = 
          scrollContainer.scrollHeight - scrollContainer.clientHeight <= scrollContainer.scrollTop + 100;
        
        // Only auto-scroll if the user is already near the bottom
        if (isAtBottom) {
          messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
      }
    }
  }, [messages]);

  if (loading) {
    return (
      <CardContent className="p-0 overflow-hidden flex-1">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <Loader2 className="h-8 w-8 mx-auto mb-2 animate-spin text-primary/50" />
            <p className="text-sm text-muted-foreground">Loading messages...</p>
          </div>
        </div>
      </CardContent>
    );
  }

  if (messages.length === 0) {
    return (
      <CardContent className="p-0 overflow-hidden flex-1">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="rounded-full bg-primary/10 p-4 mx-auto mb-3">
              <MessageSquare className="h-8 w-8 text-primary/50" />
            </div>
            <p className="text-sm text-muted-foreground">
              No messages yet. Start the conversation!
            </p>
          </div>
        </div>
      </CardContent>
    );
  }

  return (
    <CardContent className="p-0 overflow-hidden flex-1 relative z-10">
      <div ref={scrollContainerRef} className="h-full">
        <ScrollArea 
          className="h-full custom-scrollbar"
          type="always"
          scrollHideDelay={3000} 
        >
          <div className="p-2 flex flex-col h-full">
            {/* We display messages in chronological order (oldest first) */}
            {[...messages].reverse().map((message, index) => {
              // Get previous message for grouping logic
              const previousMessage = index > 0 ? [...messages].reverse()[index - 1] : undefined;
              
              return (
                <MessageItem
                  key={message.id}
                  message={message}
                  previousMessage={previousMessage}
                  emojiReactions={emojiReactions[message.id] || []}
                  profiles={profiles}
                  isLoggedIn={isLoggedIn}
                  onAddReaction={(emoji) => onAddReaction(emoji, message.id)}
                />
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </div>
    </CardContent>
  );
};

export default MessageList;
