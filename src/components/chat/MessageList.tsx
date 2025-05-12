
import React, { useRef, useEffect } from "react";
import { CardContent } from "@/components/ui/card";
import MessageItem from "./MessageItem";
import { NostrEvent } from "@/lib/nostr/types";
import { Loader2, MessageSquare } from "lucide-react";

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
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0 && messagesEndRef.current && containerRef.current) {
      const container = containerRef.current;
      const isAtBottom = container.scrollHeight - container.clientHeight <= container.scrollTop + 100;
      
      // Only auto-scroll if the user is already near the bottom
      if (isAtBottom) {
        messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
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
    <CardContent 
      className="p-0 overflow-hidden flex-1 relative z-10" 
      ref={containerRef}
    >
      <div className="p-2 flex flex-col overflow-y-auto h-full">
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
    </CardContent>
  );
};

export default MessageList;
