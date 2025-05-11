
import { useState, useCallback, useEffect } from 'react';
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
  const [relaysConnected, setRelaysConnected] = useState(false);
  const isLoggedIn = !!nostrService.publicKey;
  
  // Check relay connections on mount and ensure connectivity
  useEffect(() => {
    const checkAndConnectRelays = async () => {
      const relayStatus = nostrService.getRelayStatus();
      const connectedCount = relayStatus.filter(r => r.status === 'connected').length;
      
      if (connectedCount === 0) {
        console.log("No connected relays found, attempting connection...");
        try {
          await nostrService.connectToUserRelays();
          const newStatus = nostrService.getRelayStatus();
          const newConnectedCount = newStatus.filter(r => r.status === 'connected').length;
          setRelaysConnected(newConnectedCount > 0);
          console.log(`Connected to ${newConnectedCount} relays`);
        } catch (error) {
          console.error("Failed to connect to relays:", error);
          setRelaysConnected(false);
        }
      } else {
        setRelaysConnected(true);
        console.log(`Already connected to ${connectedCount} relays`);
      }
    };
    
    checkAndConnectRelays();
    
    // Check connection status every 10 seconds
    const intervalId = setInterval(checkAndConnectRelays, 10000);
    
    return () => clearInterval(intervalId);
  }, []);
  
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
    
    if (!relaysConnected) {
      console.log("Attempting to connect to relays before bookmark operation...");
      try {
        await nostrService.connectToUserRelays();
        const status = nostrService.getRelayStatus();
        const connected = status.filter(r => r.status === 'connected').length;
        
        if (connected === 0) {
          toast.error("Cannot bookmark: No relays available. Please check your connection.");
          console.error("Failed to connect to any relays for bookmark operation");
          return;
        }
        setRelaysConnected(true);
      } catch (error) {
        toast.error("Failed to connect to relays. Please try again.");
        console.error("Error connecting to relays:", error);
        return;
      }
    }
    
    try {
      setIsBookmarkPending(true);
      console.log("Connected relays:", nostrService.getRelayStatus()
        .filter(r => r.status === 'connected')
        .map(r => r.url));
      
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
  }, [eventId, isBookmarked, isLoggedIn, isBookmarkPending, relaysConnected, setIsBookmarked]);

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
        {!relaysConnected && (
          <ContextMenuItem onClick={async (e) => {
            e.preventDefault();
            toast.loading("Connecting to relays...");
            try {
              await nostrService.connectToUserRelays();
              toast.success("Connected to relays");
              setRelaysConnected(true);
            } catch (error) {
              toast.error("Failed to connect to relays");
            }
          }}>
            Connect to relays
          </ContextMenuItem>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
};

export default BookmarkButton;
