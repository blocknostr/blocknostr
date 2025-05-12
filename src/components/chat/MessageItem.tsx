
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
}

const MessageItem: React.FC<MessageItemProps> = ({
  message,
  emojiReactions,
  profiles,
  isLoggedIn,
  onAddReaction
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

  return (
    <div className="flex items-start gap-1.5">
      <Avatar className="h-6 w-6">
        <AvatarImage src={getProfilePicture(message.pubkey)} />
        <AvatarFallback className="text-xs">{getAvatarFallback(message.pubkey)}</AvatarFallback>
      </Avatar>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1">
          <span className="font-medium text-xs truncate">{getDisplayName(message.pubkey)}</span>
          <span className="text-[10px] text-muted-foreground">
            {formatDistanceToNow(new Date(message.created_at * 1000), { addSuffix: true })}
          </span>
        </div>
        
        <div className="text-xs break-words whitespace-pre-wrap">
          {contentFormatter.formatContent(message.content)}
        </div>
        
        {/* Reactions */}
        {emojiReactions && emojiReactions.length > 0 && (
          <div className="flex flex-wrap gap-0.5 mt-0.5">
            {emojiReactions.map((emoji, idx) => (
              <span key={idx} className="inline-flex items-center bg-muted px-1 rounded-full text-[10px]">
                {emoji}
              </span>
            ))}
          </div>
        )}
        
        <ReactionBar isLoggedIn={isLoggedIn} onAddReaction={onAddReaction} />
      </div>
    </div>
  );
};

export default MessageItem;
