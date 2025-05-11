
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

  const formattedTime = formatDistanceToNow(new Date(message.created_at * 1000), { addSuffix: true });
  
  const isCurrentUser = nostrService.publicKey === message.pubkey;

  return (
    <div className={`flex items-start gap-2 group hover:bg-accent/20 rounded-lg p-2 transition-colors ${isCurrentUser ? 'flex-row-reverse' : 'flex-row'}`}>
      <Avatar className="h-7 w-7 mt-0.5">
        <AvatarImage src={getProfilePicture(message.pubkey)} />
        <AvatarFallback className="text-xs">{getAvatarFallback(message.pubkey)}</AvatarFallback>
      </Avatar>
      
      <div className={`min-w-0 max-w-[85%] ${isCurrentUser ? 'items-end' : 'items-start'}`}>
        <div className={`flex items-center gap-1.5 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
          <span className="font-medium text-xs">{getDisplayName(message.pubkey)}</span>
          <span className="text-[10px] text-muted-foreground">
            {formattedTime}
          </span>
        </div>
        
        <div className={`text-sm break-words whitespace-pre-wrap p-2 rounded-lg ${
          isCurrentUser 
            ? 'bg-primary text-primary-foreground' 
            : 'bg-muted'
        }`}>
          {contentFormatter.formatContent(message.content)}
        </div>
        
        {/* Reactions */}
        {emojiReactions && emojiReactions.length > 0 && (
          <div className={`flex flex-wrap gap-0.5 mt-1 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
            {emojiReactions.map((emoji, idx) => (
              <span key={idx} className="inline-flex items-center bg-muted px-1.5 py-0.5 rounded-full text-xs">
                {emoji}
              </span>
            ))}
          </div>
        )}
        
        <div className={`opacity-0 group-hover:opacity-100 transition-opacity ${isCurrentUser ? 'text-right' : 'text-left'}`}>
          <ReactionBar isLoggedIn={isLoggedIn} onAddReaction={onAddReaction} />
        </div>
      </div>
    </div>
  );
};

export default MessageItem;
