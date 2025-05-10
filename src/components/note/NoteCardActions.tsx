import { useState, useEffect } from 'react';
import { Heart, Repeat, MessageSquare, Share, Bookmark, Trash2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { nostrService } from "@/lib/nostr";
import { toast } from 'sonner';
import { 
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";

interface NoteCardActionsProps {
  eventId: string;
  pubkey: string;
  onCommentClick?: () => void;
  replyCount?: number;
  isAuthor?: boolean;
  onDelete?: () => void;
  reposterPubkey?: string | null;
  showRepostHeader?: boolean;
}

const NoteCardActions = ({ 
  eventId, 
  pubkey,
  onCommentClick,
  replyCount = 0,
  isAuthor = false,
  onDelete,
  reposterPubkey, 
  showRepostHeader
}: NoteCardActionsProps) => {
  const [isLiked, setIsLiked] = useState(false);
  const [isReposted, setIsReposted] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const isLoggedIn = !!nostrService.publicKey;
  
  // Check bookmarked status on mount
  useEffect(() => {
    const checkBookmarkStatus = async () => {
      if (isLoggedIn) {
        const bookmarked = await nostrService.isBookmarked(eventId);
        setIsBookmarked(bookmarked);
      }
    };
    
    checkBookmarkStatus();
  }, [eventId, isLoggedIn]);
  
  const handleLike = async () => {
    if (!isLoggedIn) {
      toast.error("You must be logged in to like posts");
      return;
    }
    
    try {
      // Optimistically update UI
      setIsLiked(true);
      
      // Create and publish reaction event
      const event = {
        kind: 7, // Reaction
        content: "+", // "+" means like
        tags: [
          ['e', eventId], // Reference to the post being liked
        ]
      };
      
      const result = await nostrService.publishEvent(event);
      
      if (!result) {
        // If failed, revert UI
        setIsLiked(false);
        toast.error("Failed to like post");
      }
    } catch (error) {
      console.error("Error liking post:", error);
      setIsLiked(false);
      toast.error("Failed to like post");
    }
  };
  
  const handleRepost = async () => {
    if (!isLoggedIn) {
      toast.error("You must be logged in to repost");
      return;
    }
    
    try {
      // Optimistically update UI
      setIsReposted(true);
      
      // Create repost event (kind 6)
      const event = {
        kind: 6, // Repost
        content: "", // Empty content for standard reposts
        tags: [
          ['e', eventId], // Reference to the post being reposted
        ]
      };
      
      const result = await nostrService.publishEvent(event);
      
      if (!result) {
        // If failed, revert UI
        setIsReposted(false);
        toast.error("Failed to repost");
      } else {
        toast.success("Post reposted");
      }
    } catch (error) {
      console.error("Error reposting:", error);
      setIsReposted(false);
      toast.error("Failed to repost");
    }
  };
  
  const handleBookmark = async (e: React.MouseEvent) => {
    // Prevent event bubbling to parent elements
    e.stopPropagation();
    
    if (!isLoggedIn) {
      toast.error("You must be logged in to bookmark posts");
      return;
    }
    
    try {
      if (isBookmarked) {
        // Remove bookmark
        setIsBookmarked(false); // Optimistically update UI
        const result = await nostrService.removeBookmark(eventId);
        if (result) {
          toast.success("Bookmark removed");
        } else {
          setIsBookmarked(true); // Revert if failed
          toast.error("Failed to remove bookmark");
        }
      } else {
        // Add bookmark
        setIsBookmarked(true); // Optimistically update UI
        const result = await nostrService.addBookmark(eventId);
        if (result) {
          toast.success("Post bookmarked");
        } else {
          setIsBookmarked(false); // Revert if failed
          toast.error("Failed to bookmark post");
        }
      }
    } catch (error) {
      console.error("Error bookmarking post:", error);
      setIsBookmarked(!isBookmarked); // Revert UI state
      toast.error("Failed to update bookmark");
    }
  };
  
  return (
    <div className="flex items-center justify-between pt-2">
      <div className="flex items-center space-x-5">
        <Button 
          variant="ghost" 
          size="icon" 
          className={`rounded-full hover:text-primary hover:bg-primary/10 ${isLiked ? 'text-primary' : ''}`}
          onClick={handleLike}
          title="Like"
        >
          <Heart className="h-[18px] w-[18px]" />
        </Button>
        
        <Button 
          variant="ghost" 
          size="icon"
          className={`rounded-full hover:text-green-500 hover:bg-green-500/10 ${isReposted ? 'text-green-500' : ''}`}
          onClick={handleRepost}
          title="Repost"
          disabled={!!reposterPubkey && !showRepostHeader} // Disable if already a repost
        >
          <Repeat className="h-[18px] w-[18px]" />
        </Button>
        
        <Button 
          variant="ghost" 
          size="icon" 
          className="rounded-full hover:text-blue-500 hover:bg-blue-500/10"
          onClick={onCommentClick}
          title="Reply"
        >
          <MessageSquare className="h-[18px] w-[18px]" />
          {replyCount > 0 && (
            <span className="ml-1 text-xs">{replyCount}</span>
          )}
        </Button>
        
        <ContextMenu>
          <ContextMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon"
              className={`rounded-full hover:text-yellow-500 hover:bg-yellow-500/10 ${isBookmarked ? 'text-yellow-500' : ''}`}
              title="Bookmark"
              onClick={(e) => handleBookmark(e)}
            >
              <Bookmark className="h-[18px] w-[18px]" />
            </Button>
          </ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem onClick={(e) => {
              e.preventDefault();
              handleBookmark(e as unknown as React.MouseEvent);
            }}>
              {isBookmarked ? "Remove from bookmarks" : "Add to bookmarks"}
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
        
        {isAuthor && (
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full hover:text-red-500 hover:bg-red-500/10"
            onClick={onDelete}
            title="Delete"
          >
            <Trash2 className="h-[18px] w-[18px]" />
          </Button>
        )}
      </div>
      
      <Button 
        variant="ghost" 
        size="icon" 
        className="rounded-full hover:text-primary hover:bg-primary/10"
        title="Share"
      >
        <Share className="h-[18px] w-[18px]" />
      </Button>
    </div>
  );
};

export default NoteCardActions;
