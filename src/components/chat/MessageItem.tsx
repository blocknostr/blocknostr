
import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { NostrEvent } from "@/lib/nostr/types";
import ReactionBar from "./ReactionBar";
import { contentFormatter } from "@/lib/nostr";

interface MessageItemProps {
  message: NostrEvent;
  emojiReactions: string[];
  profiles: Record<string, any>;
  isLoggedIn: boolean;
  onAddReaction: (emoji: string) => void;
  isFirstInGroup: boolean;
  showAvatar: boolean;
}

const MessageItem: React.FC<MessageItemProps> = ({
  message,
  emojiReactions,
  profiles,
  isLoggedIn,
  onAddReaction,
  isFirstInGroup,
  showAvatar
}) => {
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

  const formattedTime = formatDistanceToNow(new Date(message.created_at * 1000), { addSuffix: true });
  const isCurrentUser = isLoggedIn && message.pubkey === profiles?._currentUser?.pubkey;

  return (
    <div 
      className={`flex items-end gap-1 group hover:bg-accent/10 rounded-md transition-colors
        ${isCurrentUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {/* Avatar is only shown for the last message in a group */}
      {showAvatar ? (
        <Avatar className="h-6 w-6 mb-0.5 flex-shrink-0">
          <AvatarImage src={getProfilePicture(message.pubkey)} />
          <AvatarFallback className="text-xs">{getAvatarFallback(message.pubkey)}</AvatarFallback>
        </Avatar>
      ) : (
        <div className="w-6 flex-shrink-0"></div> // Spacer to keep alignment
      )}
      
      <div className={`min-w-0 max-w-[85%] ${isCurrentUser ? 'items-end' : 'items-start'}`}>
        {/* Show name only for first message in group */}
        {isFirstInGroup && (
          <div className={`flex items-center gap-1 ${isCurrentUser ? 'justify-end' : 'justify-start'} mb-0.5`}>
            <span className="font-medium text-[10px] text-muted-foreground">{getDisplayName(message.pubkey)}</span>
          </div>
        )}
        
        <div className={`relative text-xs break-words whitespace-pre-wrap py-1 px-2 rounded-lg ${
          isCurrentUser 
            ? 'bg-primary text-primary-foreground rounded-br-none' 
            : 'bg-muted rounded-bl-none'
        }`}>
          {contentFormatter.formatContent(message.content)}
          <span className="text-[8px] ml-1 opacity-70 inline-block align-bottom">
            {formattedTime.includes('less than a minute') ? 'now' : formattedTime}
          </span>
        </div>
        
        {/* Reactions */}
        {emojiReactions && emojiReactions.length > 0 && (
          <div className={`flex flex-wrap gap-0.5 mt-0.5 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
            {emojiReactions.map((emoji, idx) => (
              <span key={idx} className="inline-flex items-center bg-muted/70 px-1 py-0.5 rounded-full text-[10px]">
                {emoji}
              </span>
            ))}
          </div>
        )}
        
        {/* Reaction button - only shows on hover */}
        <div className={`opacity-0 group-hover:opacity-100 transition-opacity ${isCurrentUser ? 'text-right' : 'text-left'}`}>
          <ReactionBar isLoggedIn={isLoggedIn} onAddReaction={onAddReaction} />
        </div>
      </div>
    </div>
  );
};

export default MessageItem;
