
import React, { useRef, useEffect } from "react";
import { CardContent } from "@/components/ui/card";
import MessageItem from "./MessageItem";
import { NostrEvent } from "@/lib/nostr/types";

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

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  if (loading) {
    return (
      <CardContent className="p-0 overflow-y-auto flex-1">
        <div className="flex items-center justify-center h-full">
          <p className="text-sm text-muted-foreground">Loading messages...</p>
        </div>
      </CardContent>
    );
  }

  if (messages.length === 0) {
    return (
      <CardContent className="p-0 overflow-y-auto flex-1">
        <div className="flex items-center justify-center h-full">
          <p className="text-sm text-muted-foreground">No messages yet. Start the conversation!</p>
        </div>
      </CardContent>
    );
  }

  return (
    <CardContent className="p-0 overflow-y-auto flex-1">
      <div className="p-2 space-y-2">
        {messages.map(message => (
          <MessageItem
            key={message.id}
            message={message}
            emojiReactions={emojiReactions[message.id] || []}
            profiles={profiles}
            isLoggedIn={isLoggedIn}
            onAddReaction={(emoji) => onAddReaction(emoji, message.id)}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>
    </CardContent>
  );
};

export default MessageList;
