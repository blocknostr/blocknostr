
import React, { useState, useCallback } from "react";
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

// Debounce time for connection status changes (in ms)
const DEBOUNCE_TIME = 1500;

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
  
  // Create a stable display state for connection status to prevent flickering
  const [displayStatus, setDisplayStatus] = useState(connectionStatus);
  const [showConnectionAlert, setShowConnectionAlert] = useState(false);
  
  // Debounce the connection status updates to prevent rapid UI changes
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDisplayStatus(connectionStatus);
      setShowConnectionAlert(connectionStatus === 'disconnected');
    }, DEBOUNCE_TIME);
    
    return () => clearTimeout(timer);
  }, [connectionStatus]);
  
  // Only show the connection alert when explicitly disconnected
  // and not during initial loading or reconnecting phases
  const shouldShowDisconnectedAlert = 
    !loading && showConnectionAlert && displayStatus === 'disconnected';

  return (
    <Card className="flex-grow flex flex-col h-[550px]">
      <WorldChatHeader connectionStatus={displayStatus} />
      
      {error && (
        <Alert variant="destructive" className="mx-2 mt-1 mb-0 py-1">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-xs">{error}</AlertDescription>
        </Alert>
      )}
      
      {shouldShowDisconnectedAlert && (
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
        disabled={displayStatus === 'disconnected'}
      />
    </Card>
  );
};

export default WorldChat;
