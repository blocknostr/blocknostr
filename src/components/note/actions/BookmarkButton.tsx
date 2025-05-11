
import { useState, useCallback } from 'react';
import { Bookmark } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { nostrService } from "@/lib/nostr";
import { toast } from 'sonner';
import { 
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";

interface BookmarkButtonProps {
  eventId: string;
  isBookmarked: boolean;
  setIsBookmarked: (value: boolean) => void;
}

const BookmarkButton = ({ 
  eventId, 
  isBookmarked, 
  setIsBookmarked 
}: BookmarkButtonProps) => {
  const [isBookmarkPending, setIsBookmarkPending] = useState(false);
  const isLoggedIn = !!nostrService.publicKey;
  
  // Use useCallback to prevent unnecessary recreations of the function
  const handleBookmark = useCallback(async (e: React.MouseEvent) => {
    // Prevent event bubbling to parent elements
    e.stopPropagation();
    
    if (!isLoggedIn) {
      toast.error("You must be logged in to bookmark posts");
      return;
    }
    
    // If an operation is already pending, don't allow another one
    if (isBookmarkPending) {
      return;
    }
    
    try {
      setIsBookmarkPending(true);
      
      if (isBookmarked) {
        // Remove bookmark
        console.log("Attempting to remove bookmark for event:", eventId);
        setIsBookmarked(false); // Optimistically update UI
        const result = await nostrService.removeBookmark(eventId);
        if (result) {
          toast.success("Bookmark removed");
          console.log("Bookmark removed successfully");
        } else {
          setIsBookmarked(true); // Revert if failed
          console.error("Bookmark removal failed, but no error was thrown");
          toast.error("Failed to remove bookmark");
        }
      } else {
        // Add bookmark
        console.log("Attempting to add bookmark for event:", eventId);
        setIsBookmarked(true); // Optimistically update UI
        const result = await nostrService.addBookmark(eventId);
        if (result) {
          toast.success("Post bookmarked");
          console.log("Bookmark added successfully");
        } else {
          setIsBookmarked(false); // Revert if failed
          console.error("Bookmark addition failed, but no error was thrown");
          toast.error("Failed to bookmark post");
        }
      }
    } catch (error) {
      console.error("Error bookmarking post:", error);
      setIsBookmarked(!isBookmarked); // Revert UI state
      toast.error(`Failed to update bookmark: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsBookmarkPending(false);
    }
  }, [eventId, isBookmarked, isLoggedIn, isBookmarkPending, setIsBookmarked]);

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon"
          className={`rounded-full hover:text-yellow-500 hover:bg-yellow-500/10 ${isBookmarked ? 'text-yellow-500' : ''}`}
          title="Bookmark"
          onClick={handleBookmark}
          disabled={isBookmarkPending}
        >
          <Bookmark className="h-[18px] w-[18px]" />
        </Button>
      </ContextMenuTrigger>
      <ContextMenuContent onClick={(e) => e.stopPropagation()}>
        <ContextMenuItem onClick={(e) => {
          e.preventDefault();
          handleBookmark(e as unknown as React.MouseEvent);
        }}>
          {isBookmarked ? "Remove from bookmarks" : "Add to bookmarks"}
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
};

export default BookmarkButton;
