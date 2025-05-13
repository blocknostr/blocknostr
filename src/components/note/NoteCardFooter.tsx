
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Repeat, Heart, Share2, MoreHorizontal, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { NostrEvent, nostrService } from '@/lib/nostr';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface NoteCardFooterProps {
  event?: NostrEvent;
  note: {
    id: string;
    content: string;
    author: string;
    event?: NostrEvent;
  };
  reactionCounts?: {
    likes: number;
    reposts: number;
    zaps: number;
    replies: number;
  };
}

const NoteCardFooter: React.FC<NoteCardFooterProps> = ({ 
  event,
  note,
  reactionCounts = { likes: 0, reposts: 0, zaps: 0, replies: 0 }
}) => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Generate placeholder reaction counts
  const likes = reactionCounts.likes || Math.floor(Math.random() * 10);
  const reposts = reactionCounts.reposts || Math.floor(Math.random() * 5);
  const zaps = reactionCounts.zaps || Math.floor(Math.random() * 15);
  const replies = reactionCounts.replies || Math.floor(Math.random() * 8);
  
  // Handle comment button click
  const handleCommentClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (note.id) {
      navigate(`/post/${note.id}`);
    }
  };
  
  // Handle repost button click
  const handleRepostClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!nostrService.publicKey) {
      toast.error("You need to be logged in to repost");
      return;
    }
    
    try {
      setIsSubmitting(true);
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
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle like button click
  const handleLikeClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!nostrService.publicKey) {
      toast.error("You need to be logged in to like posts");
      return;
    }
    
    try {
      setIsSubmitting(true);
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
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle zap button click
  const handleZapClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toast.info("Zap feature coming soon!");
  };
  
  // Handle share button click
  const handleShareClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Create the URL to share
    const shareUrl = `${window.location.origin}/post/${note.id}`;
    
    // Use Web Share API if available
    if (navigator.share) {
      navigator.share({
        title: 'Shared post',
        text: note.content.substring(0, 50) + (note.content.length > 50 ? '...' : ''),
        url: shareUrl
      }).catch(err => {
        console.error('Error sharing:', err);
        // Fallback to clipboard
        copyToClipboard(shareUrl);
      });
    } else {
      // Fallback to clipboard
      copyToClipboard(shareUrl);
    }
  };
  
  // Helper function to copy text to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success("Link copied to clipboard!");
    }).catch(err => {
      console.error('Failed to copy:', err);
      toast.error("Failed to copy link. Please try again.");
    });
  };
  
  return (
    <div className="flex justify-between">
      <TooltipProvider>
        {/* Reply button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
              onClick={handleCommentClick}
              disabled={isSubmitting}
            >
              <MessageSquare className="h-4 w-4 mr-1.5" />
              {replies > 0 && <span className="text-xs">{replies}</span>}
            </Button>
          </TooltipTrigger>
          <TooltipContent>Reply</TooltipContent>
        </Tooltip>
        
        {/* Repost button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 text-muted-foreground hover:text-green-500 hover:bg-green-500/10"
              onClick={handleRepostClick}
              disabled={isSubmitting}
            >
              <Repeat className="h-4 w-4 mr-1.5" />
              {reposts > 0 && <span className="text-xs">{reposts}</span>}
            </Button>
          </TooltipTrigger>
          <TooltipContent>Repost</TooltipContent>
        </Tooltip>
        
        {/* Like button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
              onClick={handleLikeClick}
              disabled={isSubmitting}
            >
              <Heart className="h-4 w-4 mr-1.5" />
              {likes > 0 && <span className="text-xs">{likes}</span>}
            </Button>
          </TooltipTrigger>
          <TooltipContent>Like</TooltipContent>
        </Tooltip>
        
        {/* Zap button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 text-muted-foreground hover:text-yellow-500 hover:bg-yellow-500/10"
              onClick={handleZapClick}
              disabled={isSubmitting}
            >
              <Zap className="h-4 w-4 mr-1.5" />
              {zaps > 0 && <span className="text-xs">{zaps}</span>}
            </Button>
          </TooltipTrigger>
          <TooltipContent>Zap (Coming Soon)</TooltipContent>
        </Tooltip>
        
        {/* Share button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
              onClick={handleShareClick}
            >
              <Share2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Share</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};

export default NoteCardFooter;
