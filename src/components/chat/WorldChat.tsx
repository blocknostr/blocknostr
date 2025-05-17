
import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import WorldChatHeader, { WORLD_CHAT_CHANNELS, ChatChannel } from "./WorldChatHeader";
import ChatInput from "./ChatInput";
import { useWorldChat } from "./hooks";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Wifi, WifiOff, AlertCircle, RefreshCw, LogIn, Wallet, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { chatNostrService } from "@/lib/nostr/chat-service";
import LoginDialog from "../auth/LoginDialog";
import { cn } from "@/lib/utils";
import MessageList from "./MessageList";

// Maximum characters allowed per message
const MAX_CHARS = 140;

// Default chat tag
const DEFAULT_CHAT_TAG = "world-chat";

const WorldChat = () => {
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);
  const [currentChatTag, setCurrentChatTag] = useState(DEFAULT_CHAT_TAG);
  // Add a state to track channel switches for UI feedback
  const [isChangingChannel, setIsChangingChannel] = useState(false);
  const isLoggedIn = !!chatNostrService.publicKey;

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
  } = useWorldChat(currentChatTag);

  // Handle chat channel selection
  const handleChannelSelect = (channel: ChatChannel) => {
    if (channel.tag === currentChatTag) return;
    
    // Set changing channel state to show loading indicator
    setIsChangingChannel(true);
    setCurrentChatTag(channel.tag);
  };

  // Reset the changing channel state once messages are loaded
  useEffect(() => {
    if (!loading && isChangingChannel) {
      setIsChangingChannel(false);
    }
  }, [loading, isChangingChannel]);

  const handleLoginClick = () => {
    setLoginDialogOpen(true);
  };

  // Wrapper for sendMessage to match the expected return type of Promise<boolean>
  const handleSendMessage = async (message: string): Promise<boolean> => {
    await sendMessage(message);
    return true;
  };

  // Show login prompt if not logged in
  if (!isLoggedIn) {
    return (
      <Card className="chat-card flex flex-col h-full shadow-md overflow-hidden rounded-lg relative bg-background/90 backdrop-blur-sm border-border/50">
        <WorldChatHeader 
          connectionStatus="disconnected" 
          currentChatTag={currentChatTag} 
          onChannelSelect={handleChannelSelect}
        />
        <div className="flex-grow flex flex-col items-center justify-center p-6 text-center bg-gradient-to-b from-background to-muted/10">
          <div className="p-3 bg-primary/10 rounded-full mb-3 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/20 animate-pulse"></div>
            <Shield className="h-10 w-10 text-primary relative z-10" />
          </div>
          <h3 className="text-lg font-light tracking-tight mb-2">Join the conversation</h3>
          <p className="text-muted-foreground mb-4 max-w-xs">
            Connect your Nostr wallet to view messages and participate in the global chat.
          </p>
          <Button 
            onClick={handleLoginClick}
            className={cn(
              "gap-2 bg-gradient-to-r from-primary/90 to-primary/80",
              "hover:from-primary/80 hover:to-primary/70 group relative overflow-hidden"
            )}
          >
            <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-white/5 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
            <Wallet className="h-4 w-4" />
            Connect Wallet
          </Button>
          <p className="text-xs text-muted-foreground mt-4">
            New to Nostr? <a href="https://nostr.how" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Learn more</a>
          </p>
        </div>
        
        {/* Login Dialog */}
        <LoginDialog 
          open={loginDialogOpen}
          onOpenChange={setLoginDialogOpen}
        />
      </Card>
    );
  }

  return (
    <Card className="chat-card flex flex-col h-full shadow-md overflow-hidden rounded-lg relative bg-background/90 backdrop-blur-sm border-accent/10"> 
      <WorldChatHeader 
        connectionStatus={connectionStatus}
        currentChatTag={currentChatTag}
        onChannelSelect={handleChannelSelect}
      />
      
      {error && (
        <Alert variant="destructive" className="mx-2 mt-1 mb-0 py-1.5 rounded-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-xs">{error}</AlertDescription>
        </Alert>
      )}
      
      {connectionStatus === 'disconnected' && (
        <Alert variant="warning" className="mx-2 mt-1 mb-0 py-1.5 rounded-md">
          <div className="flex justify-between w-full items-center">
            <div className="flex items-center gap-2">
              <WifiOff className="h-3.5 w-3.5" />
              <AlertDescription className="text-xs">Not connected to chat relays</AlertDescription>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="h-7 text-xs py-0 rounded-full" 
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
        <Alert variant="warning" className="w-auto mx-2 mt-1 mb-0 py-1 px-3 border-yellow-300 dark:border-yellow-600 bg-yellow-50 dark:bg-yellow-900/30 rounded-md">
          <div className="flex items-center gap-2">
            <RefreshCw className="h-3 w-3 animate-spin text-yellow-600 dark:text-yellow-400" />
            <AlertDescription className="text-xs font-medium text-yellow-700 dark:text-yellow-300 whitespace-nowrap">
              Connecting to chat relays...
            </AlertDescription>
          </div>
        </Alert>
      )}
      
      <div className="flex-grow overflow-y-auto relative">
        <MessageList
          messages={messages}
          profiles={profiles}
          emojiReactions={emojiReactions}
          loading={isChangingChannel} // Only show loading when changing channels, not during initial load
          isLoggedIn={isLoggedIn}
          onAddReaction={addReaction}
        />
      </div>
      
      <ChatInput
        isLoggedIn={isLoggedIn}
        maxChars={MAX_CHARS}
        onSendMessage={handleSendMessage}
        disabled={connectionStatus === 'disconnected'}
      />
    </Card>
  );
};

export default WorldChat;
