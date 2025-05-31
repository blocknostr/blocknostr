import React, { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { NostrEvent } from "@/lib/nostr/types";
import { contentFormatter } from "@/lib/nostr";
import { nostrService } from "@/lib/nostr";
import { useNavigate } from "react-router-dom";
import clsx from "clsx";

interface MessageItemProps {
  message: NostrEvent;
  profiles?: Record<string, any>;
  isLoggedIn: boolean;
  previousMessage?: NostrEvent;
}

const MessageItem: React.FC<MessageItemProps> = ({
  message,
  profiles = {},
  isLoggedIn,
  previousMessage
}) => {
  const navigate = useNavigate();
  
  const isCurrentUser = message.pubkey === nostrService.publicKey;
  const isPreviousSameSender = previousMessage && previousMessage.pubkey === message.pubkey;
  const timeDifference = previousMessage 
    ? message.created_at - previousMessage.created_at 
    : 100000;
  const shouldGroupWithPrevious = isPreviousSameSender && timeDifference < 60;

  // Compact date formatting function
  const getCompactDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInHours * 60);
      return diffInMinutes < 1 ? "now" : `${diffInMinutes}m`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h`;
    } else if (diffInHours < 24 * 7) {
      return `${Math.floor(diffInHours / 24)}d`;
    } else {
      return format(date, "MMM d");
    }
  };

  // Enhanced NOSTR display name handling
  const getDisplayName = (pubkey: string) => {
    if (!profiles || !profiles[pubkey]) {
      return "Anon";
    }
    const profile = profiles[pubkey];
    return profile?.metadata?.display_name || 
           profile?.metadata?.name || 
           profile?.display_name || 
           profile?.name || 
           profile?.metadata?.nip05?.split('@')[0] || 
           "Anon";
  };
  
  const getProfilePicture = (pubkey: string) => {
    if (!profiles || !profiles[pubkey]) {
      return '';
    }
    const profile = profiles[pubkey];
    const picture = profile?.metadata?.picture || 
                   profile?.metadata?.image || 
                   profile?.picture || 
                   profile?.image || 
                   '';
    
    return picture;
  };
  
  const getAvatarFallback = (pubkey: string) => {
    const displayName = getDisplayName(pubkey);
    return displayName.charAt(0).toUpperCase();
  };

  const handleProfileClick = (pubkey: string) => {
    navigate(`/profile/${pubkey}`);
  };

  // Process message content for @mentions
  const processMessageContent = (content: string) => {
    const mentionRegex = /@(npub[a-zA-Z0-9]+|[a-zA-Z0-9_]+)/g;
    const parts = content.split(mentionRegex);
    
    return parts.map((part, index) => {
      if (index % 2 === 1) {
        return (
          <span 
            key={`mention-${index}-${part}`}
            className="text-primary cursor-pointer hover:underline font-medium bg-primary/10 px-1 rounded"
            onClick={() => handleProfileClick(part)}
          >
            @{part.startsWith('npub') ? getDisplayName(part) : part}
          </span>
        );
      }
      return (
        <span key={`text-${index}`}>
          {contentFormatter.formatContent(part)}
        </span>
      );
    });
  };

  return (
    <div 
      id={`message-${message.id}`}
      className={clsx(
        "animate-fade-in w-full transition-all duration-200 group", 
        {
          "mt-3": !shouldGroupWithPrevious,
          "mt-1": shouldGroupWithPrevious,
        }
      )}
    >
      <div className={clsx(
        "flex items-start gap-3 w-full",
        isCurrentUser ? "flex-row-reverse" : "flex-row"
      )}>
        {/* Avatar - always show for current user, conditionally for others */}
        {(!shouldGroupWithPrevious || isCurrentUser) && (
          <div 
            className="cursor-pointer hover:scale-105 transition-transform flex-shrink-0"
            onClick={() => handleProfileClick(message.pubkey)}
          >
            <Avatar className="h-8 w-8 ring-2 ring-transparent hover:ring-primary/20 transition-all">
              <AvatarImage src={getProfilePicture(message.pubkey)} />
              <AvatarFallback className="text-xs bg-primary/10 font-semibold">
                {getAvatarFallback(message.pubkey)}
              </AvatarFallback>
            </Avatar>
          </div>
        )}
        
        {/* Spacer when avatar is hidden for non-current users */}
        {shouldGroupWithPrevious && !isCurrentUser && <div className="w-8 flex-shrink-0" />}
        
        <div className={clsx(
          "relative flex flex-col", 
          isCurrentUser ? "items-end max-w-[75%]" : "items-start max-w-[75%]"
        )}>
          {/* Name and timestamp */}
          {(!shouldGroupWithPrevious || isCurrentUser) && (
            <div className={clsx(
              "flex items-center gap-2 mb-1",
              isCurrentUser ? "flex-row-reverse" : "flex-row"
            )}>
              <button
                className="font-semibold text-sm text-foreground hover:text-primary transition-colors cursor-pointer"
                onClick={() => handleProfileClick(message.pubkey)}
              >
                {getDisplayName(message.pubkey)}
              </button>
              <span className="text-xs text-muted-foreground">
                {getCompactDate(message.created_at)}
              </span>
            </div>
          )}
          
          <div className="relative">
            {/* Message bubble with hover reactions */}
            <div
              className={clsx(
                "inline-block text-sm break-words whitespace-pre-wrap px-4 py-2 rounded-2xl shadow-sm border max-w-full relative",
                isCurrentUser 
                  ? "bg-primary text-primary-foreground border-primary/20"
                  : "bg-background border-border/50 hover:border-border transition-colors",
                {
                  "rounded-tr-lg": isCurrentUser && shouldGroupWithPrevious,
                  "rounded-tl-lg": !isCurrentUser && shouldGroupWithPrevious
                }
              )}
            >
              <div className="leading-relaxed">
                {processMessageContent(message.content)}
              </div>
              
              {shouldGroupWithPrevious && (
                <div className={clsx(
                  "text-xs opacity-70 mt-1",
                  isCurrentUser ? "text-left" : "text-right"
                )}>
                  {getCompactDate(message.created_at)}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageItem;

