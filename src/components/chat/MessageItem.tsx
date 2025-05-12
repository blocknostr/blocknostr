
import { useState } from 'react';
import { NostrEvent, NostrProfileMetadata } from '@/lib/nostr/types';
import { formatDistanceToNow } from 'date-fns';
import { nostrService, contentFormatter } from '@/lib/nostr';
import { Button } from '../ui/button';
import { Smile, MoreHorizontal } from 'lucide-react';

interface MessageItemProps {
  event: NostrEvent;
  profile?: NostrProfileMetadata;
  emojiReactions?: string[];
  onReaction?: (emoji: string) => void;
  showReactionPicker?: boolean;
}

export const MessageItem = ({
  event,
  profile,
  emojiReactions = [],
  onReaction,
  showReactionPicker = true,
}: MessageItemProps) => {
  const [showEmojis, setShowEmojis] = useState(false);
  const isCurrentUser = event.pubkey === nostrService.publicKey;
  
  const timeAgo = formatDistanceToNow(new Date(event.created_at * 1000), { addSuffix: true });
  
  // Emojis for quick reactions
  const quickEmojis = ['👍', '❤️', '😂', '👏', '🎉', '🔥', '💡', '🙌'];
  
  // Rendered content with links
  const renderedContent = contentFormatter.renderLinks(event.content);
  
  return (
    <div className={`flex mb-4 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
      <div 
        className={`
          max-w-[80%] md:max-w-[70%] rounded-lg p-3
          ${isCurrentUser 
            ? 'bg-primary text-primary-foreground rounded-br-none' 
            : 'bg-muted text-muted-foreground rounded-bl-none'}
        `}
      >
        <div className="flex justify-between items-start mb-1">
          <div className="font-semibold text-sm">
            {profile?.name || profile?.display_name || event.pubkey.substring(0, 8)}
          </div>
          <div className="text-xs opacity-70">{timeAgo}</div>
        </div>
        
        <div 
          className="text-sm"
          dangerouslySetInnerHTML={{ __html: renderedContent }}
        />
        
        {/* Reactions display */}
        {emojiReactions && emojiReactions.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {emojiReactions.map((emoji, index) => (
              <div 
                key={`${emoji}-${index}`}
                className={`
                  text-xs px-1.5 py-0.5 rounded-full
                  ${isCurrentUser 
                    ? 'bg-primary-foreground/20 text-primary-foreground' 
                    : 'bg-background text-foreground'}
                `}
              >
                {emoji}
              </div>
            ))}
          </div>
        )}
        
        {/* Reaction controls */}
        {showReactionPicker && onReaction && (
          <div className="flex justify-end mt-2">
            <div className="relative">
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 w-6 p-0 rounded-full"
                onClick={() => setShowEmojis(!showEmojis)}
              >
                {showEmojis ? <MoreHorizontal className="h-3 w-3" /> : <Smile className="h-3 w-3" />}
              </Button>
              
              {showEmojis && (
                <div className="absolute bottom-full right-0 mb-1 p-1 bg-background rounded shadow-md flex gap-1 border">
                  {quickEmojis.map(emoji => (
                    <button
                      key={emoji}
                      onClick={() => {
                        onReaction(emoji);
                        setShowEmojis(false);
                      }}
                      className="hover:bg-muted p-1 rounded text-sm"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
