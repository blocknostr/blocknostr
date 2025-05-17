
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ChatInput from "@/components/chat/ChatInput";
import MessageList from "@/components/chat/MessageList";
import { useWorldChat } from "@/components/chat/hooks";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LogIn, Lock, RefreshCw, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { nostrService } from "@/lib/nostr";

// Maximum characters allowed per message
const MAX_CHARS = 500;

interface DAOGroupChatProps {
  daoId: string;
  daoName: string;
  currentUserPubkey: string;
  isMember: boolean;
}

const DAOGroupChat: React.FC<DAOGroupChatProps> = ({ 
  daoId, 
  daoName, 
  currentUserPubkey,
  isMember 
}) => {
  const chatTag = `dao-chat-${daoId.substring(0, 10)}`;
  const isLoggedIn = !!currentUserPubkey;

  const {
    messages,
    profiles,
    emojiReactions,
    loading,
    sendMessage,
    addReaction,
    error,
    connectionStatus,
    reconnect,
    isReconnecting
  } = useWorldChat(chatTag);

  // Wrapper to handle the return type mismatch
  const handleSendMessage = async (messageContent: string): Promise<boolean> => {
    await sendMessage(messageContent);
    return true;
  };

  if (!isLoggedIn) {
    return (
      <Card className="chat-card flex flex-col h-[500px] shadow-md overflow-hidden rounded-lg relative bg-background/90 backdrop-blur-sm border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center">
            {daoName} Chat
          </CardTitle>
        </CardHeader>
        
        <CardContent className="flex-grow flex flex-col items-center justify-center p-6 text-center">
          <div className="p-3 bg-primary/10 rounded-full mb-3">
            <LogIn className="h-10 w-10 text-primary" />
          </div>
          <h3 className="text-lg font-medium mb-2">Login to chat</h3>
          <p className="text-muted-foreground mb-4">
            You need to be logged in to view and participate in this chat.
          </p>
          <Button onClick={() => nostrService.login()}>
            Login with Nostr
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!isMember) {
    return (
      <Card className="chat-card flex flex-col h-[500px] shadow-md overflow-hidden rounded-lg relative bg-background/90 backdrop-blur-sm border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center">
            {daoName} Chat
          </CardTitle>
        </CardHeader>
        
        <CardContent className="flex-grow flex flex-col items-center justify-center p-6 text-center">
          <div className="p-3 bg-muted/80 rounded-full mb-3">
            <Lock className="h-10 w-10 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium mb-2">Members-only chat</h3>
          <p className="text-muted-foreground mb-4">
            You need to be a member of this DAO to participate in the chat.
          </p>
          <Button disabled>Join DAO to Chat</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="chat-card flex flex-col h-[500px] shadow-md overflow-hidden rounded-lg relative bg-background/90 backdrop-blur-sm border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center justify-between">
          <div>{daoName} Chat</div>
          {connectionStatus === 'disconnected' && (
            <Button 
              variant="outline" 
              size="sm" 
              className="h-8 text-xs" 
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
          )}
        </CardTitle>
      </CardHeader>
      
      {connectionStatus === 'disconnected' && (
        <Alert variant="warning" className="mx-2 mt-1 mb-0 py-1.5 rounded-md">
          <div className="flex items-center gap-2">
            <WifiOff className="h-3.5 w-3.5" />
            <AlertDescription className="text-xs">Not connected to chat relays</AlertDescription>
          </div>
        </Alert>
      )}
      
      <div className="flex-grow overflow-y-auto relative">
        <MessageList
          messages={messages}
          profiles={profiles}
          emojiReactions={emojiReactions}
          loading={loading}
          isLoggedIn={isLoggedIn}
          onAddReaction={addReaction}
        />
      </div>
      
      <ChatInput
        isLoggedIn={isLoggedIn}
        maxChars={MAX_CHARS}
        onSendMessage={handleSendMessage}
        disabled={connectionStatus === 'disconnected'}
        placeholder={`Message the ${daoName} DAO...`}
      />
    </Card>
  );
};

export default DAOGroupChat;
