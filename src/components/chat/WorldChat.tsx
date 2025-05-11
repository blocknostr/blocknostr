
import React from "react";
import { Card } from "@/components/ui/card";
import WorldChatHeader from "./WorldChatHeader";
import MessageList from "./MessageList";
import ChatInput from "./ChatInput";
import { useWorldChat } from "./useWorldChat";

// Maximum characters allowed per message
const MAX_CHARS = 140;

const WorldChat = () => {
  const {
    messages,
    profiles,
    emojiReactions,
    loading,
    isLoggedIn,
    sendMessage,
    addReaction
  } = useWorldChat();

  return (
    <Card className="h-[400px] flex flex-col">
      <WorldChatHeader />
      
      <MessageList
        messages={messages}
        profiles={profiles}
        emojiReactions={emojiReactions}
        loading={loading}
        isLoggedIn={isLoggedIn}
        onAddReaction={addReaction}
      />
      
      <ChatInput
        isLoggedIn={isLoggedIn}
        maxChars={MAX_CHARS}
        onSendMessage={sendMessage}
      />
    </Card>
  );
};

export default WorldChat;
