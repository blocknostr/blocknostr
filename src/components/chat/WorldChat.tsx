
import React, { lazy, Suspense, useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import WorldChatHeader from "./WorldChatHeader";
import ChatInput from "./ChatInput";
import { useWorldChat } from "./hooks";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Wifi, WifiOff, AlertCircle, RefreshCw, LogIn, Wallet, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { nostrService } from "@/lib/nostr";
import LoginDialog from "../auth/LoginDialog";
import { cn } from "@/lib/utils";

// Lazy load the MessageList component to improve initial load performance
const MessageList = lazy(() => import("./MessageList"));

// Maximum characters allowed per message
const MAX_CHARS = 140;

const WorldChat = () => {
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  // Check login status on mount and after any changes
  useEffect(() => {
    const checkLoginStatus = () => {
      setIsLoggedIn(!!nostrService.publicKey);
    };
    
    checkLoginStatus();
    
    // Set up an interval to check login status (in case user switches accounts in extension)
    const interval = setInterval(checkLoginStatus, 5000);
    
    // Check if we need to connect to relays after page load
    const lastConnection = localStorage.getItem('nostr_last_connection');
    if (lastConnection && nostrService.publicKey) {
      const connectionTime = parseInt(lastConnection, 10);
      const now = Date.now();
      
      // If last connection was recent (within 5 seconds) and we have a public key,
      // try to connect to relays if none are currently connected
      if (now - connectionTime < 5000) {
        const relays = nostrService.getRelayStatus();
        const connectedCount = relays.filter(r => r.status === 'connected').length;
        
        if (connectedCount === 0) {
          console.log("Recently logged in but no relays connected. Attempting to connect...");
          nostrService.connectToUserRelays();
        }
      }
    }
    
    return () => clearInterval(interval);
  }, []);

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
  } = useWorldChat();

  const handleLoginClick = () => {
    setLoginDialogOpen(true);
  };

  // Show login prompt if not logged in
  if (!isLoggedIn) {
    return (
      <Card className="flex flex-col h-full border shadow-md overflow-hidden rounded-lg relative bg-background/80 backdrop-blur-sm">
        <WorldChatHeader connectionStatus="disconnected" />
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

  // If logged in but still connecting to relays, show a connecting state
  if (connectionStatus === 'connecting') {
    return (
      <Card className="flex flex-col h-full border shadow-md overflow-hidden rounded-lg relative bg-background/80 backdrop-blur-sm">
        <WorldChatHeader connectionStatus={connectionStatus} />
        <div className="flex-grow flex flex-col items-center justify-center p-6 text-center">
          <div className="p-3 bg-blue-50/50 dark:bg-blue-900/20 rounded-full mb-3">
            <RefreshCw className="h-8 w-8 text-blue-500 animate-spin" />
          </div>
          <h3 className="text-lg font-medium mb-2">Connecting to relays</h3>
          <p className="text-muted-foreground mb-4 max-w-xs">
            Please wait while we connect to the Nostr network...
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col h-full border shadow-md overflow-hidden rounded-lg relative bg-background/80 backdrop-blur-sm"> 
      <WorldChatHeader connectionStatus={connectionStatus} />
      
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
              <AlertDescription className="text-xs">Not connected to relays</AlertDescription>
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
      
      <div className="flex-grow overflow-hidden relative">
        <Suspense fallback={
          <div className="flex items-center justify-center h-full">
            <RefreshCw className="h-6 w-6 animate-spin text-primary/50" />
          </div>
        }>
          <MessageList
            messages={messages}
            profiles={profiles}
            emojiReactions={emojiReactions}
            loading={loading}
            isLoggedIn={isLoggedIn}
            onAddReaction={addReaction}
          />
        </Suspense>
      </div>
      
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
