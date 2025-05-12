import React from 'react';
import { Avatar } from '@/components/ui/avatar';
import { contentFormatter } from '@/lib/nostr';
import { NostrEvent } from '@/lib/nostr/types';

interface MessageItemProps {
  message: NostrEvent;
  previousMessage?: NostrEvent;
  emojiReactions: string[];
  profiles: Record<string, any>;
  isLoggedIn: boolean;
  onAddReaction: (emoji: string) => void;
}

export const MessageItem: React.FC<MessageItemProps> = ({
  message,
  profiles,
  isLoggedIn,
  emojiReactions,
  // Other props can be used as needed
}) => {
  // Extract needed properties from the message
  const { content, pubkey, created_at, tags } = message;
  
  // Get profile info if available
  const profile = profiles[pubkey] || {};
  const profileName = profile.name || profile.display_name;
  const profileImage = profile.picture;
  
  // Check if this is the user's own message
  const isOwnMessage = isLoggedIn && pubkey === 'your-pubkey'; // Replace with actual check

  const formattedContent = React.useMemo(() => {
    return contentFormatter.formatContent(content, tags);
  }, [content, tags]);

  const formattedTime = React.useMemo(() => {
    return contentFormatter.formatDate(created_at);
  }, [created_at]);

  return (
    <div className={`flex gap-3 mb-4 ${isOwnMessage ? 'flex-row-reverse' : ''}`}>
      <div className="flex-shrink-0">
        <Avatar className="h-8 w-8">
          {profileImage ? (
            <img
              src={profileImage}
              alt={profileName || pubkey.slice(0, 8)}
              className="aspect-square h-full w-full"
            />
          ) : (
            <div className="bg-primary/10 flex h-full w-full items-center justify-center rounded-full text-xs font-semibold uppercase text-primary">
              {(profileName?.[0] || pubkey[0] || '?').toUpperCase()}
            </div>
          )}
        </Avatar>
      </div>
      
      <div className={`flex max-w-[80%] flex-col ${isOwnMessage ? 'items-end' : ''}`}>
        <div className="flex items-center gap-2 text-sm">
          <span className="font-medium">
            {profileName || pubkey.slice(0, 8)}
          </span>
          <span className="text-xs text-muted-foreground">{formattedTime}</span>
        </div>
        
        <div
          className={`mt-1 rounded-lg px-4 py-2 ${
            isOwnMessage
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted'
          }`}
        >
          <div 
            className="text-sm break-words"
            dangerouslySetInnerHTML={{ __html: formattedContent }}
          />
        </div>
      </div>
    </div>
  );
};

export default MessageItem;
