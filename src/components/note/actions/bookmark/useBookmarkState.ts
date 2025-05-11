
import { useState, useCallback, useEffect } from 'react';
import { nostrService } from "@/lib/nostr";
import { toast } from 'sonner';

/**
 * Hook to manage bookmark state and operations
 */
export function useBookmarkState(eventId: string, initialIsBookmarked: boolean) {
  const [isBookmarked, setIsBookmarked] = useState(initialIsBookmarked);
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
  
  // Connect to relays if needed
  const ensureRelayConnection = async () => {
    if (!relaysConnected) {
      console.log("Attempting to connect to relays before bookmark operation...");
      try {
        await nostrService.connectToUserRelays();
        const status = nostrService.getRelayStatus();
        const connected = status.filter(r => r.status === 'connected').length;
        
        if (connected === 0) {
          toast.error("Cannot bookmark: No relays available. Please check your connection.");
          console.error("Failed to connect to any relays for bookmark operation");
          return false;
        }
        setRelaysConnected(true);
        return true;
      } catch (error) {
        toast.error("Failed to connect to relays. Please try again.");
        console.error("Error connecting to relays:", error);
        return false;
      }
    }
    return true;
  };
  
  // Handler for bookmark actions
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
    
    // Ensure relay connection
    const connected = await ensureRelayConnection();
    if (!connected) return;
    
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
  }, [eventId, isBookmarked, isLoggedIn, isBookmarkPending, relaysConnected]);
  
  return {
    isBookmarked,
    setIsBookmarked,
    isBookmarkPending,
    relaysConnected,
    setRelaysConnected,
    handleBookmark,
    ensureRelayConnection,
    isLoggedIn
  };
}
