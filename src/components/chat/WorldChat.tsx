
import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import WorldChatHeader from "./WorldChatHeader";
import MessageList from "./MessageList";
import ChatInput from "./ChatInput";
import { useWorldChat } from "./useWorldChat";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Wifi, WifiOff, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

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
    addReaction,
    error,
    connectionStatus,
    reconnect
  } = useWorldChat();

  return (
    <Card className="flex-grow flex flex-col h-[550px]">
      <WorldChatHeader connectionStatus={connectionStatus} />
      
      {error && (
        <Alert variant="destructive" className="mx-2 mt-1 mb-0 py-1">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-xs">{error}</AlertDescription>
        </Alert>
      )}
      
      {connectionStatus === 'disconnected' && (
        <Alert variant="warning" className="mx-2 mt-1 mb-0 py-1">
          <div className="flex justify-between w-full items-center">
            <div className="flex items-center gap-2">
              <WifiOff className="h-3.5 w-3.5" />
              <AlertDescription className="text-xs">Not connected to relays</AlertDescription>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="h-6 text-xs py-0" 
              onClick={reconnect}
            >
              Reconnect
            </Button>
          </div>
        </Alert>
      )}
      
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
        disabled={connectionStatus === 'disconnected'}
      />
    </Card>
  );
};

export default WorldChat;
