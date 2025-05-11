
import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import WorldChatHeader from "./WorldChatHeader";
import MessageList from "./MessageList";
import ChatInput from "./ChatInput";
import { useWorldChat } from "./hooks";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Wifi, WifiOff, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

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
    reconnect,
    isReconnecting
  } = useWorldChat();

  return (
    <Card className="flex-grow flex flex-col h-[550px] mb-14">
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
              disabled={isReconnecting}
            >
              {isReconnecting ? (
                <>
                  <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                  Reconnecting...
                </>
              ) : (
                <>Reconnect</>
              )}
            </Button>
          </div>
        </Alert>
      )}
      
      {connectionStatus === 'connecting' && (
        <Alert className="mx-2 mt-1 mb-0 py-1 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-2">
            <RefreshCw className="h-3.5 w-3.5 animate-spin text-blue-500" />
            <AlertDescription className="text-xs text-blue-700 dark:text-blue-400">
              Connecting to relays...
            </AlertDescription>
          </div>
        </Alert>
      )}
      
      <ScrollArea className="flex-1">
        <MessageList
          messages={messages}
          profiles={profiles}
          emojiReactions={emojiReactions}
          loading={loading}
          isLoggedIn={isLoggedIn}
          onAddReaction={addReaction}
        />
      </ScrollArea>
      
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
