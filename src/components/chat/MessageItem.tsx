
import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { NostrEvent } from "@/lib/nostr/types";
import ReactionBar from "./ReactionBar";
import { contentFormatter } from "@/lib/nostr";
import { nostrService } from "@/lib/nostr";
import clsx from "clsx";

interface MessageItemProps {
  message: NostrEvent;
  emojiReactions: string[];
  profiles: Record<string, any>;
  isLoggedIn: boolean;
  onAddReaction: (emoji: string) => void;
  previousMessage?: NostrEvent;
}

const MessageItem: React.FC<MessageItemProps> = ({
  message,
  emojiReactions,
  profiles,
  isLoggedIn,
  onAddReaction,
  previousMessage
}) => {
  const isCurrentUser = message.pubkey === nostrService.publicKey;
  const isPreviousSameSender = previousMessage && previousMessage.pubkey === message.pubkey;
  const timeDifference = previousMessage 
    ? message.created_at - previousMessage.created_at 
    : 100000; // Large number to ensure showing avatar for first message
  const shouldGroupWithPrevious = isPreviousSameSender && timeDifference < 60; // Group messages within 1 minute

  const getDisplayName = (pubkey: string) => {
    const profile = profiles[pubkey];
    return profile?.name || profile?.display_name || `${pubkey.substring(0, 6)}...`;
  };
  
  const getProfilePicture = (pubkey: string) => {
    const profile = profiles[pubkey];
    return profile?.picture || '';
  };
  
  const getAvatarFallback = (pubkey: string) => {
    const displayName = getDisplayName(pubkey);
    return displayName.charAt(0).toUpperCase();
  };

  return (
    <div 
      className={clsx(
        "animate-fade-in my-0.5 w-full", 
        {
          "mt-2": !shouldGroupWithPrevious,
          "mt-0.5": shouldGroupWithPrevious
        }
      )}
    >
      <div className={clsx(
        "flex items-start gap-1.5 max-w-[85%]",
        isCurrentUser ? "flex-row-reverse ml-auto" : ""
      )}>
        {/* Avatar - only show for first message in a group */}
        {!shouldGroupWithPrevious && !isCurrentUser && (
          <Avatar className="h-7 w-7 flex-shrink-0 mt-1">
            <AvatarImage src={getProfilePicture(message.pubkey)} />
            <AvatarFallback className="text-xs bg-primary/10">{getAvatarFallback(message.pubkey)}</AvatarFallback>
          </Avatar>
        )}
        
        {/* Spacer when avatar is hidden but alignment needs to be maintained */}
        {shouldGroupWithPrevious && !isCurrentUser && <div className="w-7 flex-shrink-0" />}
        
        <div className="flex-1 min-w-0">
          {/* Name - only show for first message in a group */}
          {!shouldGroupWithPrevious && !isCurrentUser && (
            <div className="flex items-baseline gap-1.5">
              <span className="font-medium text-xs text-muted-foreground truncate">
                {getDisplayName(message.pubkey)}
              </span>
            </div>
          )}
          
          <div className="group relative">
            <div
              className={clsx(
                "inline-block text-sm break-words whitespace-pre-wrap px-3 py-1.5 rounded-2xl shadow-sm max-w-full",
                isCurrentUser 
                  ? "bg-primary text-primary-foreground rounded-tr-sm message-bubble-sent"
                  : "bg-muted/80 rounded-tl-sm message-bubble-received",
                {
                  "rounded-tr-2xl": isCurrentUser && shouldGroupWithPrevious,
                  "rounded-tl-2xl": !isCurrentUser && shouldGroupWithPrevious
                }
              )}
            >
              {contentFormatter.formatContent(message.content)}
              <div className={clsx(
                "text-[10px] opacity-70 mt-0.5 text-right",
                isCurrentUser ? "" : "text-muted-foreground"
              )}>
                {formatDistanceToNow(new Date(message.created_at * 1000), { addSuffix: true })}
              </div>
            </div>

            {/* Reactions below the message */}
            {emojiReactions && emojiReactions.length > 0 && (
              <div className="flex flex-wrap gap-0.5 mt-0.5 ml-1">
                {emojiReactions.map((emoji, idx) => (
                  <span key={idx} className="inline-flex items-center bg-accent/70 px-1.5 py-0.5 rounded-full text-xs shadow-sm">
                    {emoji}
                  </span>
                ))}
              </div>
            )}
            
            {/* Reaction bar - more subtle and appears on hover */}
            <div className={clsx(
              "absolute bottom-0 opacity-0 group-hover:opacity-100 transition-opacity",
              isCurrentUser ? "right-0 translate-y-4" : "left-0 translate-y-4"
            )}>
              <ReactionBar isLoggedIn={isLoggedIn} onAddReaction={onAddReaction} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageItem;
