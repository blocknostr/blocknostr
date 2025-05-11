
import React, { useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import WorldChatHeader from "./WorldChatHeader";
import MessageList from "./MessageList";
import ChatInput from "./ChatInput";
import { useWorldChat } from "./hooks";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Wifi, WifiOff, AlertCircle, RefreshCw } from "lucide-react";
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
    reconnect,
    isReconnecting
  } = useWorldChat();

  return (
    <Card className="flex-grow flex flex-col h-[550px] mb-14 overflow-hidden border-muted">
      <WorldChatHeader connectionStatus={connectionStatus} />
      
      {error && (
        <Alert variant="destructive" className="mx-2 mt-1 mb-0 py-1 rounded-sm">
          <AlertCircle className="h-3 w-3" />
          <AlertDescription className="text-xs">{error}</AlertDescription>
        </Alert>
      )}
      
      {connectionStatus === 'disconnected' && (
        <Alert variant="warning" className="mx-2 mt-1 mb-0 py-1 rounded-sm">
          <div className="flex justify-between w-full items-center">
            <div className="flex items-center gap-1">
              <WifiOff className="h-3 w-3" />
              <AlertDescription className="text-[10px]">Not connected to relays</AlertDescription>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="h-5 text-[10px] py-0 px-2" 
              onClick={reconnect}
              disabled={isReconnecting}
            >
              {isReconnecting ? (
                <>
                  <RefreshCw className="h-2.5 w-2.5 mr-1 animate-spin" />
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
        <Alert className="mx-2 mt-1 mb-0 py-1 rounded-sm bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-1">
            <RefreshCw className="h-3 w-3 animate-spin text-blue-500" />
            <AlertDescription className="text-[10px] text-blue-700 dark:text-blue-400">
              Connecting to relays...
            </AlertDescription>
          </div>
        </Alert>
      )}
      
      {/* Message list with flex-grow to take available space */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <MessageList
          messages={messages}
          profiles={profiles}
          emojiReactions={emojiReactions}
          loading={loading}
          isLoggedIn={isLoggedIn}
          onAddReaction={addReaction}
        />
      </div>
      
      {/* Fixed input area at bottom */}
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
