
import React, { useRef, useEffect, useState } from "react";
import { CardContent } from "@/components/ui/card";
import MessageItem from "./MessageItem";
import { NostrEvent } from "@/lib/nostr/types";
import { Button } from "@/components/ui/button";
import { ArrowDown } from "lucide-react";

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
  const [showScrollButton, setShowScrollButton] = useState(false);
  
  // Function to scroll to bottom
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    // Only auto-scroll if we're already at the bottom or it's the initial load
    if (containerRef.current) {
      const { scrollHeight, scrollTop, clientHeight } = containerRef.current;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
      
      if (isAtBottom) {
        scrollToBottom();
      } else if (!showScrollButton) {
        setShowScrollButton(true);
      }
    }
  }, [messages]);
  
  // Add scroll event listener to show/hide scroll button
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    const handleScroll = () => {
      const { scrollHeight, scrollTop, clientHeight } = container;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
      setShowScrollButton(!isAtBottom);
    };
    
    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

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

  // Group messages by sender and time proximity (5 minutes)
  const groupedMessages = messages.reduce((groups, message, index) => {
    const prevMessage = messages[index - 1];
    
    // Start a new group if:
    // 1. This is the first message
    // 2. The sender changed
    // 3. More than 5 minutes passed since the previous message
    if (
      !prevMessage || 
      prevMessage.pubkey !== message.pubkey ||
      message.created_at - prevMessage.created_at > 300 // 5 minutes in seconds
    ) {
      groups.push([message]);
    } else {
      // Add to existing group
      groups[groups.length - 1].push(message);
    }
    
    return groups;
  }, [] as NostrEvent[][]);

  return (
    <CardContent className="p-0 overflow-y-auto flex-1 relative" ref={containerRef}>
      {/* Scroll to bottom button */}
      {showScrollButton && (
        <Button
          className="absolute bottom-4 right-4 rounded-full h-10 w-10 p-0 shadow-md"
          onClick={scrollToBottom}
          size="icon"
        >
          <ArrowDown className="h-5 w-5" />
        </Button>
      )}
      
      <div className="p-1 space-y-1 flex flex-col-reverse">
        {/* End marker for scrolling */}
        <div ref={messagesEndRef} />
        
        {/* Render message groups */}
        {groupedMessages.map((group, groupIndex) => (
          <div key={`group-${groupIndex}`} className="space-y-0.5">
            {group.map((message, messageIndex) => (
              <MessageItem
                key={message.id}
                message={message}
                emojiReactions={emojiReactions[message.id] || []}
                profiles={profiles}
                isLoggedIn={isLoggedIn}
                onAddReaction={(emoji) => onAddReaction(emoji, message.id)}
                isFirstInGroup={messageIndex === 0}
                showAvatar={messageIndex === group.length - 1}
              />
            ))}
          </div>
        ))}
      </div>
    </CardContent>
  );
};

export default MessageList;

