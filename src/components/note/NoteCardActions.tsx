
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Note } from '@/components/notebin/hooks/types';
import { Heart, MessageSquare, Repeat, Share2, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { nostrService } from '@/lib/nostr';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface NoteCardActionsProps {
  note: Note;
  replyCount?: number;
  onReplyToggle: () => void;
}

const NoteCardActions: React.FC<NoteCardActionsProps> = ({ 
  note, 
  replyCount = 0,
  onReplyToggle
}) => {
  const navigate = useNavigate();
  
  // Handle comment button click - simplified
  const handleCommentClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    
    // Toggle reply form
    onReplyToggle();
    
    // Navigate with ctrl/cmd+click
    if ((e.ctrlKey || e.metaKey) && window.location.pathname !== `/post/${note.id}`) {
      navigate(`/post/${note.id}`);
    }
  };
  
  // Handle repost button click - simplified
  const handleRepostClick = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    
    if (!nostrService.publicKey) {
      toast.error("You need to be logged in to repost");
      return;
    }
    
    try {
      // Create a repost event (kind 6)
      const repostEvent = {
        kind: 6, // Repost
        content: "", // Empty content for reposts
        tags: [
          ["e", note.id, "", "root"], // Reference to the original event
          ["p", note.author] // Reference to the original author
        ]
      };
      
      const eventId = await nostrService.publishEvent(repostEvent);
      
      if (eventId) {
        toast.success("Post reposted successfully!");
      } else {
        toast.error("Failed to repost. Please try again.");
      }
    } catch (error) {
      console.error("Error reposting:", error);
      toast.error("Failed to repost. Please try again.");
    }
  };
  
  // Handle like button click - simplified
  const handleLikeClick = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    
    if (!nostrService.publicKey) {
      toast.error("You need to be logged in to like posts");
      return;
    }
    
    try {
      // Create a reaction event (kind 7)
      const reactionEvent = {
        kind: 7, // Reaction
        content: "+", // "+" for like
        tags: [
          ["e", note.id], // Reference to the original event
          ["p", note.author] // Reference to the original author
        ]
      };
      
      const eventId = await nostrService.publishEvent(reactionEvent);
      
      if (eventId) {
        toast.success("Post liked!");
      } else {
        toast.error("Failed to like post. Please try again.");
      }
    } catch (error) {
      console.error("Error liking post:", error);
      toast.error("Failed to like post. Please try again.");
    }
  };
  
  // Handle share button click - simplified with Web Share API
  const handleShareClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const shareUrl = `${window.location.origin}/post/${note.id}`;
    
    if (navigator.share) {
      navigator.share({
        title: 'Shared post',
        text: note.content.substring(0, 50) + (note.content.length > 50 ? '...' : ''),
        url: shareUrl
      }).catch(() => copyToClipboard(shareUrl));
    } else {
      copyToClipboard(shareUrl);
    }
  };
  
  // Helper function for clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
      .then(() => toast.success("Link copied to clipboard!"))
      .catch(() => toast.error("Failed to copy link. Please try again."));
  };
  
  // Check if the current user is the author
  const isCurrentUser = note.author === nostrService.publicKey;
  
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-4">
        {/* Comment button - simplified */}
        <Button 
          variant="ghost" 
          size="sm" 
          className="p-0 h-auto text-muted-foreground hover:text-primary hover:bg-transparent"
          onClick={handleCommentClick}
        >
          <MessageSquare className="h-4 w-4 mr-1.5" />
          <span className="text-xs">Reply</span>
          {replyCount > 0 && (
            <span className="ml-1 text-xs font-medium">{replyCount}</span>
          )}
        </Button>
        
        {/* Repost button - simplified */}
        <Button 
          variant="ghost" 
          size="sm" 
          className="p-0 h-auto text-muted-foreground hover:text-green-500 hover:bg-transparent"
          onClick={handleRepostClick}
        >
          <Repeat className="h-4 w-4 mr-1.5" />
          <span className="text-xs">Repost</span>
        </Button>
        
        {/* Like button - simplified */}
        <Button 
          variant="ghost" 
          size="sm" 
          className="p-0 h-auto text-muted-foreground hover:text-red-500 hover:bg-transparent"
          onClick={handleLikeClick}
        >
          <Heart className="h-4 w-4 mr-1.5" />
          <span className="text-xs">Like</span>
        </Button>
      </div>
      
      <div className="flex items-center">
        {/* Share button - simplified */}
        <Button 
          variant="ghost" 
          size="sm" 
          className="p-0 h-auto text-muted-foreground hover:text-primary hover:bg-transparent"
          onClick={handleShareClick}
        >
          <Share2 className="h-4 w-4" />
        </Button>
        
        {/* More options dropdown (only for current user) - simplified */}
        {isCurrentUser && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="p-0 h-auto ml-2 text-muted-foreground hover:text-primary hover:bg-transparent"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
              <DropdownMenuItem className="text-destructive">
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
};

export default NoteCardActions;
