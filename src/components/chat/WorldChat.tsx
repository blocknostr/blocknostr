import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import WorldChatHeader, { WORLD_CHAT_CHANNELS, ChatChannel } from "./WorldChatHeader";
import ChatInput from "./ChatInput";
import { useWorldChatRedux } from "./hooks";
import { RefreshCw, MessageSquare, ChevronDown, Minimize2, Maximize2, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";
import MessageList from "./MessageList";
import { useAuth } from "@/hooks/useAuth";
import { useGlobalLoginDialog } from "@/hooks/useGlobalLoginDialog";
import WorldChatWelcome from './WorldChatWelcome';
import { useAppSelector, useAppDispatch } from '@/hooks/redux';
import { 
  setMinimized, 
  setShowScrollToBottom,
  selectIsMinimized,
  selectShowScrollToBottom,
  selectCurrentChatTag,
  selectIsChangingChannel,
  setCurrentChatTag,
  setIsChangingChannel
} from '@/store/slices/chatSlice';

// Maximum characters allowed per message
const MAX_CHARS = 140;

// Default chat tag
const DEFAULT_CHAT_TAG = "world-chat";

const WorldChat = () => {
  // ✅ MOVED TO REDUX: 100% Redux state management - NO MORE LOCAL STATE
  const dispatch = useAppDispatch();
  const currentChatTag = useAppSelector(selectCurrentChatTag);
  const isChangingChannel = useAppSelector(selectIsChangingChannel);
  const isMinimized = useAppSelector(selectIsMinimized);
  const showScrollToBottom = useAppSelector(selectShowScrollToBottom);
  
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { isLoggedIn } = useAuth();
  const { isOpen: loginDialogOpen, openLoginDialog, setLoginDialogOpen } = useGlobalLoginDialog();

  const {
    messages,
    profiles,
    loading,
    sendMessage,
    error,
    connectionStatus,
    isConnected,
    isLoadingMore,
    hasMoreHistory,
    loadMoreHistory,
    draft,
    saveDraft,
    clearDraft,
    refetch
  } = useWorldChatRedux();

  // ✅ FIXED: Memoize current channel name to prevent re-renders
  const currentChannelName = useMemo(() => {
    return WORLD_CHAT_CHANNELS.find(c => c.tag === currentChatTag)?.name || 'World Chat';
  }, [currentChatTag]);

  // Handle scroll events
  useEffect(() => {
    const scrollContainer = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]');
    if (!scrollContainer) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      dispatch(setShowScrollToBottom(!isNearBottom));
    };

    scrollContainer.addEventListener('scroll', handleScroll);
    return () => scrollContainer.removeEventListener('scroll', handleScroll);
  }, [dispatch]);

  const scrollToBottom = () => {
    const scrollContainer = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]');
    if (scrollContainer) {
      scrollContainer.scrollTo({ top: scrollContainer.scrollHeight, behavior: 'smooth' });
    } else {
      // Fallback to messagesEndRef
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleChannelSelect = useCallback((channel: ChatChannel) => {
    if (channel.tag === currentChatTag) return;
    dispatch(setIsChangingChannel(true));
    dispatch(setCurrentChatTag(channel.tag));
  }, [currentChatTag, dispatch]);

  const handleSendMessage = useCallback(async (content: string) => {
    let messageContent = content;
    
    await sendMessage(messageContent);
    scrollToBottom();
  }, [sendMessage]);

  // ✅ FIXED: Use Redux state management for minimize
  const handleMinimize = useCallback(() => {
    dispatch(setMinimized(true));
  }, [dispatch]);

  // ✅ FIXED: Use Redux state management for expand
  const handleExpand = useCallback(() => {
    dispatch(setMinimized(false));
  }, [dispatch]);

  useEffect(() => {
    if (!loading && isChangingChannel) {
      dispatch(setIsChangingChannel(false));
    }
  }, [loading, isChangingChannel, dispatch]);

  // Minimized view
  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={handleExpand}
          className="h-12 w-12 rounded-full shadow-lg bg-primary hover:bg-primary/90 relative"
        >
          <MessageSquare className="h-6 w-6" />
        </Button>
      </div>
    );
  }

  // Read-only interface if not logged in
  if (!isLoggedIn) {
    return (
      <Card className="chat-card flex flex-col h-full w-full max-w-full shadow-xl overflow-hidden rounded-xl relative bg-gradient-to-br from-background via-background to-muted/10 border-2 border-border/50 backdrop-blur-sm">
        <WorldChatHeader 
          connectionStatus={connectionStatus} 
          currentChatTag={currentChatTag} 
          onChannelSelect={handleChannelSelect}
          onMinimize={handleMinimize}
        />
        
        <ScrollArea className="flex-grow overflow-hidden relative min-h-0" ref={scrollAreaRef}>
          {messages.length > 0 && hasMoreHistory && (
            <div className="p-2 border-b bg-muted/20">
              <Button
                onClick={loadMoreHistory}
                disabled={isLoadingMore}
                variant="ghost"
                size="sm"
                className="w-full text-xs h-8"
              >
                {isLoadingMore ? (
                  <>
                    <RefreshCw className="h-3 w-3 mr-2 animate-spin" />
                    Loading older messages...
                  </>
                ) : (
                  <>Load More History</>
                )}
              </Button>
            </div>
          )}
          
          <MessageList
            messages={messages}
            profiles={profiles}
            loading={isChangingChannel}
            isLoggedIn={isLoggedIn}
            messagesEndRef={messagesEndRef}
          />
          
          {/* Scroll to bottom button */}
          {showScrollToBottom && messages.length > 0 && (
            <Button
              onClick={scrollToBottom}
              className="absolute bottom-4 right-4 h-10 w-10 rounded-full shadow-lg z-10"
              size="sm"
            >
              <ArrowDown className="h-4 w-4" />
            </Button>
          )}
        </ScrollArea>
        
        <div className="p-3 border-t bg-muted/30 flex-shrink-0">
          <div className="flex items-center justify-center text-sm text-muted-foreground">
            <MessageSquare className="h-4 w-4 mr-2" />
            <span>Sign in to join the conversation</span>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="chat-card flex flex-col h-full w-full max-w-full shadow-xl overflow-hidden rounded-xl relative bg-gradient-to-br from-background via-background to-primary/5 border-2 border-primary/20 backdrop-blur-sm">
      <WorldChatHeader 
        connectionStatus={connectionStatus}
        currentChatTag={currentChatTag}
        onChannelSelect={handleChannelSelect}
        onMinimize={handleMinimize}
      />
      
      <ScrollArea className="flex-grow overflow-hidden relative min-h-0" ref={scrollAreaRef}>
        {messages.length > 0 && hasMoreHistory && (
          <div className="p-2 border-b bg-muted/20">
            <Button
              onClick={loadMoreHistory}
              disabled={isLoadingMore}
              variant="ghost"
              size="sm"
              className="w-full text-xs h-8"
            >
              {isLoadingMore ? (
                <>
                  <RefreshCw className="h-3 w-3 mr-2 animate-spin" />
                  Loading older messages...
                </>
              ) : (
                <>Load More History</>
              )}
            </Button>
          </div>
        )}
        
        {messages.length === 0 && !loading && !isChangingChannel && !error && (
          <WorldChatWelcome
            currentChannelName={currentChannelName}
            isLoggedIn={isLoggedIn}
            onSendTestMessage={isLoggedIn ? () => (window as any).sendTestMessage?.() : undefined}
          />
        )}
        
        <MessageList
          messages={messages}
          profiles={profiles}
          loading={isChangingChannel}
          isLoggedIn={isLoggedIn}
          messagesEndRef={messagesEndRef}
        />
        
        {/* Scroll to bottom button */}
        {showScrollToBottom && messages.length > 0 && (
          <Button
            onClick={scrollToBottom}
            className="absolute bottom-4 right-4 h-10 w-10 rounded-full shadow-lg z-10 bg-primary/90 hover:bg-primary"
            size="sm"
          >
            <ArrowDown className="h-4 w-4" />
          </Button>
        )}
      </ScrollArea>
      
      <div className="flex-shrink-0 border-t border-primary/10">
        <ChatInput
          isLoggedIn={isLoggedIn}
          maxChars={MAX_CHARS}
          onSendMessage={handleSendMessage}
          disabled={connectionStatus === 'disconnected'}
        />
      </div>
    </Card>
  );
};

export default WorldChat;

