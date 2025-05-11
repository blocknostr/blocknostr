
import React, { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { Copy, MessageSquare, Share2, Loader2, Heart, Repeat, Bookmark, MoreHorizontal } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAction } from './hooks/use-action';
import { Note } from '@/components/notebin/hooks/types';
import { useNavigate } from 'react-router-dom';
import { nostrService } from '@/lib/nostr';

interface NoteCardActionsProps {
  note: Note;
  setActiveReply: (note: Note | null) => void;
  isBookmarked: boolean;
  onBookmarkToggle: () => void;
}

const NoteCardActions: React.FC<NoteCardActionsProps> = ({
  note,
  setActiveReply,
  isBookmarked,
  onBookmarkToggle
}) => {
  const [isActionLoading, setIsActionLoading] = useState<
    "reply" | "like" | "repost" | "bookmark" | null
  >(null);
  const { handleLike, handleRepost } = useAction(note);
  const navigate = useNavigate();
  
  // Handler for preparing a reply
  const handleReply = useCallback(async () => {
    try {
      setIsActionLoading("reply");
      
      // Use the correct method name
      await nostrService.connectToUserRelays();
      
      setActiveReply(note);
    } catch (error) {
      console.error("Error preparing reply:", error);
      toast.error("Failed to prepare reply");
    } finally {
      setIsActionLoading(null);
    }
  }, [note, setActiveReply]);
  
  // Handler for navigating to the post page
  const handleGoToPost = useCallback(() => {
    navigate(`/post/${note.id}`);
  }, [note, navigate]);
  
  return (
    <div className="flex items-center justify-between px-2 py-1 text-sm text-muted-foreground">
      <div className="flex items-center space-x-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleReply}
          disabled={isActionLoading === "reply"}
        >
          {isActionLoading === "reply" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <MessageSquare className="h-4 w-4" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleLike}
          disabled={isActionLoading === "like"}
        >
          {isActionLoading === "like" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Heart className="h-4 w-4" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleRepost}
          disabled={isActionLoading === "repost"}
        >
          {isActionLoading === "repost" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Repeat className="h-4 w-4" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onBookmarkToggle}
          disabled={isActionLoading === "bookmark"}
        >
          {isActionLoading === "bookmark" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Bookmark className={`h-4 w-4 ${isBookmarked ? "fill-current" : ""}`} />
          )}
        </Button>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleGoToPost}>
            <MessageSquare className="h-4 w-4 mr-2" />
            Go to Post
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Copy className="h-4 w-4 mr-2" />
            Copy content
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default NoteCardActions;
