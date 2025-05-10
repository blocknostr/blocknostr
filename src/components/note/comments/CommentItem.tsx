
import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';
import { nostrService } from '@/lib/nostr';

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
  
  return (
    <div className="flex items-start gap-2 group">
      <Link 
        to={`/profile/${comment.author}`} 
        className="shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        <Avatar className="h-8 w-8">
          <AvatarImage src={picture} />
          <AvatarFallback className="bg-primary/10 text-primary">
            {name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </Link>
      
      <div className="flex-1">
        <div className="bg-muted/50 p-3 rounded-lg">
          <div className="flex items-baseline gap-1.5 mb-1">
            <Link 
              to={`/profile/${comment.author}`} 
              className="font-medium text-sm hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              {name}
            </Link>
            <span className="text-xs text-muted-foreground">@{shortNpub}</span>
            <span className="text-xs text-muted-foreground">·</span>
            <span className="text-xs text-muted-foreground">{timeAgo}</span>
          </div>
          <p className="text-sm whitespace-pre-wrap break-words">{comment.content}</p>
        </div>
        
        {isAuthor && comment.id && (
          <div className="flex justify-end mt-1">
            <Button
              variant="ghost"
              size="sm"
              className="text-red-500 hover:bg-red-50 hover:text-red-600 h-6 px-2 py-0 text-xs"
              onClick={() => onDeleteClick(comment.id)}
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Delete
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommentItem;
