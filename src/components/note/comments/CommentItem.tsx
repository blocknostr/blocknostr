
import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Trash2, SmilePlus } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';
import { nostrService } from '@/lib/nostr';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const REACTIONS = ["👍", "❤️", "😂", "😮", "🎉", "😢", "👎"];

interface CommentItemProps {
  comment: {
    id?: string;
    content: string;
    author: string;
    created_at: number;
  };
  profile: Record<string, any>;
  onDeleteClick: (commentId: string | undefined) => void;
}

const CommentItem = ({ comment, profile, onDeleteClick }: CommentItemProps) => {
  const [reactions, setReactions] = useState<Record<string, number>>({});
  const [userReaction, setUserReaction] = useState<string | null>(null);
  
  const isAuthor = comment.author === nostrService.publicKey;
  const timeAgo = formatDistanceToNow(
    new Date(comment.created_at * 1000),
    { addSuffix: true }
  );
  
  // Get user display info
  const npub = nostrService.getNpubFromHex(comment.author);
  const shortNpub = `${npub.substring(0, 6)}...${npub.substring(npub.length - 4)}`;
  const name = profile?.name || profile?.display_name || shortNpub;
  const picture = profile?.picture || '';
  
  const handleReaction = (emoji: string) => {
    // If user already selected this reaction, remove it
    if (userReaction === emoji) {
      setUserReaction(null);
      setReactions(prev => {
        const updated = { ...prev };
        if (updated[emoji] && updated[emoji] > 1) {
          updated[emoji] -= 1;
        } else {
          delete updated[emoji];
        }
        return updated;
      });
    } else {
      // If user had a previous reaction, remove it first
      if (userReaction) {
        setReactions(prev => {
          const updated = { ...prev };
          if (updated[userReaction] && updated[userReaction] > 1) {
            updated[userReaction] -= 1;
          } else {
            delete updated[userReaction];
          }
          return updated;
        });
      }
      
      // Add the new reaction
      setUserReaction(emoji);
      setReactions(prev => {
        const updated = { ...prev };
        updated[emoji] = (updated[emoji] || 0) + 1;
        return updated;
      });
    }
  };

  return (
    <div className="group hover:bg-[#222]/20 rounded-md -mx-2 px-2 py-1 transition-colors">
      <div className="flex items-start gap-2">
        <Link 
          to={`/profile/${comment.author}`} 
          className="shrink-0 mt-1"
          onClick={(e) => e.stopPropagation()}
        >
          <Avatar className="h-8 w-8">
            <AvatarImage src={picture} />
            <AvatarFallback className="bg-[#1EAEDB]/20 text-[#1EAEDB]">
              {name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </Link>
        
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Link 
              to={`/profile/${comment.author}`} 
              className="font-medium text-sm hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              {name}
            </Link>
            <span className="text-xs text-[#8E9196]">{timeAgo}</span>
          </div>
          <p className="text-sm whitespace-pre-wrap break-words text-[#C8C8C9]">{comment.content}</p>
          
          {/* Reactions display */}
          {Object.keys(reactions).length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {Object.entries(reactions).map(([emoji, count]) => (
                <button
                  key={emoji}
                  onClick={() => handleReaction(emoji)}
                  className={`inline-flex items-center gap-1 bg-[#2A2D35] hover:bg-[#32353E] 
                    rounded-full px-2 py-0.5 text-xs ${userReaction === emoji ? 'border border-[#1EAEDB]' : ''}`}
                >
                  <span>{emoji}</span>
                  <span className="text-[#8E9196]">{count}</span>
                </button>
              ))}
            </div>
          )}

          {/* Action buttons */}
          <div className="mt-1 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs text-[#8E9196] hover:text-white hover:bg-[#2A2D35]"
                >
                  <SmilePlus className="h-3 w-3 mr-1" />
                  React
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-1 bg-[#2A2D35] border-[#403E43]">
                <div className="flex gap-1">
                  {REACTIONS.map(emoji => (
                    <Button 
                      key={emoji} 
                      variant="ghost" 
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => handleReaction(emoji)}
                    >
                      {emoji}
                    </Button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
            
            {isAuthor && comment.id && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs text-red-500/70 hover:text-red-500 hover:bg-red-500/10"
                onClick={() => onDeleteClick(comment.id)}
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Delete
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommentItem;
