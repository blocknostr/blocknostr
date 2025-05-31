import React, { useRef, useEffect } from "react";
import { CardContent } from "@/components/ui/card";
import MessageItem from "./MessageItem";
import { NostrEvent } from "@/lib/nostr/types";
import { MessageSquare, Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import WorldChatWelcome from "./WorldChatWelcome";

interface MessageListProps {
  messages: NostrEvent[];
  profiles?: Record<string, any>;
  loading: boolean;
  isLoggedIn: boolean;
  messagesEndRef?: React.RefObject<HTMLDivElement>;
}

const MessageList: React.FC<MessageListProps> = ({
  messages,
  profiles = {},
  loading,
  isLoggedIn,
  messagesEndRef
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0 && messagesEndRef?.current && scrollContainerRef.current) {
      const scrollContainer = scrollContainerRef.current.querySelector('[data-radix-scroll-area-viewport]');
      
      if (scrollContainer) {
        const isAtBottom = 
          scrollContainer.scrollHeight - scrollContainer.clientHeight <= scrollContainer.scrollTop + 200;
        
        if (isAtBottom) {
          requestAnimationFrame(() => {
            if (scrollContainer.scrollHeight - scrollContainer.clientHeight <= scrollContainer.scrollTop + 200) {
              messagesEndRef.current?.scrollIntoView({ behavior: "auto", block: "end" });
            }
          });
        }
      }
    }
  }, [messages.length, messagesEndRef]);

  if (loading && messages.length > 0) {
    return (
      <CardContent className="p-0 overflow-hidden flex-1 relative z-10 w-full max-w-full">
        <div ref={scrollContainerRef} className="h-full w-full max-w-full">
          <ScrollArea 
            className="h-full w-full scrollbar-hide"
            type="always"
            scrollHideDelay={600}
          >
            <div className="p-4 flex flex-col h-full w-full max-w-full space-y-1">
              {[...messages].reverse().map((message, index) => {
                const previousMessage = index > 0 ? [...messages].reverse()[index - 1] : undefined;
                
                return (
                  <MessageItem
                    key={message.id}
                    message={message}
                    previousMessage={previousMessage}
                    profiles={profiles}
                    isLoggedIn={isLoggedIn}
                  />
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
        </div>
      </CardContent>
    );
  }

  if (loading) {
    return (
      <CardContent className="p-0 overflow-hidden flex-1 w-full max-w-full">
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
      <CardContent className="p-0 overflow-hidden flex-1 w-full max-w-full">
        <WorldChatWelcome
          currentChannelName="World Chat"
          isLoggedIn={isLoggedIn}
          onSendTestMessage={isLoggedIn ? () => (window as any).sendTestMessage?.() : undefined}
        />
      </CardContent>
    );
  }

  return (
    <CardContent className="p-0 overflow-hidden flex-1 relative z-10 w-full max-w-full">
      <div ref={scrollContainerRef} className="h-full w-full max-w-full">
        <ScrollArea 
          className="h-full w-full scrollbar-hide"
          type="always"
          scrollHideDelay={600}
        >
          <div className="p-4 flex flex-col h-full w-full max-w-full space-y-1">
            {[...messages].reverse().map((message, index) => {
              const previousMessage = index > 0 ? [...messages].reverse()[index - 1] : undefined;
              
              return (
                <MessageItem
                  key={message.id}
                  message={message}
                  previousMessage={previousMessage}
                  profiles={profiles}
                  isLoggedIn={isLoggedIn}
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

