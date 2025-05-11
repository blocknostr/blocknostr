import { useState, useCallback, useEffect } from 'react';
import { nostrService } from "@/lib/nostr";
import { toast } from 'sonner';
import { retry } from '@/lib/utils/retry';
import { BookmarkStorage } from '@/lib/nostr/bookmark';

/**
 * Hook to manage bookmark state and operations with:
 * - Retry mechanism
 * - Offline support
 * - Enhanced error handling
 */
export function useBookmarkState(eventId: string, initialIsBookmarked: boolean) {
  const [isBookmarked, setIsBookmarked] = useState(initialIsBookmarked);
  const [isBookmarkPending, setIsBookmarkPending] = useState(false);
  const [relaysConnected, setRelaysConnected] = useState(false);
  const isLoggedIn = !!nostrService.publicKey;
  
  // Check for cached bookmark status on mount
  useEffect(() => {
    const checkCachedStatus = async () => {
      // Only check cache if we don't have a server-provided initial value
      if (initialIsBookmarked === false) {
        const cachedStatus = await BookmarkStorage.getCachedBookmarkStatus(eventId);
        if (cachedStatus !== null) {
          setIsBookmarked(cachedStatus);
          console.log(`Using cached bookmark status for ${eventId}: ${cachedStatus}`);
        }
      }
    };
    
    checkCachedStatus();
  }, [eventId, initialIsBookmarked]);
  
  // Check relay connections and set up event listeners
  useEffect(() => {
    const checkRelayStatus = () => {
      const relayStatus = nostrService.getRelayStatus();
      const connectedCount = relayStatus.filter(r => r.status === 'connected').length;
      setRelaysConnected(connectedCount > 0);
      return connectedCount > 0;
    };
    
    // Initial check
    checkRelayStatus();
    
    // Set up interval to check connections periodically
    const intervalId = setInterval(() => {
      checkRelayStatus();
    }, 10000);
    
    return () => clearInterval(intervalId);
  }, []);
  
  // Connect to relays if needed
  const ensureRelayConnection = async () => {
    if (!relaysConnected) {
      // When showing loading state, use the toast.loading with a unique ID
      const loadingId = toast.loading("Connecting to relays...");
      
      try {
        await retry(
          () => nostrService.connectToUserRelays(),
          { 
            maxAttempts: 3,
            onRetry: (attempt) => {
              toast.loading(`Connection attempt ${attempt}/3...`, { id: loadingId });
            }
          }
        );
        
        const status = nostrService.getRelayStatus();
        const connected = status.filter(r => r.status === 'connected').length;
        
        if (connected === 0) {
          toast.error("No relays available. Please check your network connection.", { id: loadingId });
          console.error("Failed to connect to any relays for bookmark operation");
          return false;
        }
        
        setRelaysConnected(true);
        toast.success("Connected to relays", { id: loadingId });
        return true;
      } catch (error) {
        toast.error("Failed to connect to relays. Please try again later.", { id: loadingId });
        console.error("Error connecting to relays:", error);
        return false;
      }
    }
    return true;
  };
  
  // Handler for bookmark actions with retry mechanism
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
      
      // Update the local state immediately for responsive UI
      const newBookmarkState = !isBookmarked;
      setIsBookmarked(newBookmarkState);
      
      // Cache optimistically
      await BookmarkStorage.cacheBookmarkStatus(eventId, newBookmarkState);
      
      // If offline, queue the operation for later and show appropriate message
      if (!navigator.onLine) {
        await BookmarkStorage.queueOperation({
          type: newBookmarkState ? 'add' : 'remove',
          eventId,
          tags: [],
          note: '',
        });
        
        toast.info(`Post ${newBookmarkState ? 'bookmarked' : 'bookmark removed'}. Changes will sync when you're back online.`);
        return;
      }
      
      // Try to connect to relays if needed
      const connected = await ensureRelayConnection();
      if (!connected) {
        // Keep the optimistic UI update but queue the operation for later
        await BookmarkStorage.queueOperation({
          type: newBookmarkState ? 'add' : 'remove',
          eventId,
          tags: [],
          note: '',
        });
        return;
      }
      
      // Execute the operation with retry logic
      const operation = newBookmarkState 
        ? () => nostrService.addBookmark(eventId)
        : () => nostrService.removeBookmark(eventId);
        
      const result = await retry(
        operation,
        {
          maxAttempts: 3,
          onRetry: (attempt, error) => {
            console.log(`Retry attempt ${attempt} for bookmark operation:`, error);
          }
        }
      );
      
      if (result) {
        toast.success(newBookmarkState ? "Post bookmarked" : "Bookmark removed");
      } else {
        // Revert UI state on failure
        setIsBookmarked(!newBookmarkState);
        await BookmarkStorage.cacheBookmarkStatus(eventId, !newBookmarkState);
        toast.error(newBookmarkState ? "Failed to bookmark post" : "Failed to remove bookmark");
      }
    } catch (error) {
      console.error("Error bookmarking post:", error);
      // Revert UI state
      setIsBookmarked(!isBookmarked);
      await BookmarkStorage.cacheBookmarkStatus(eventId, !isBookmarked);
      
      // Show descriptive error
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      toast.error(`Failed to update bookmark: ${errorMsg}`);
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
    ensureRelayConnection
  };
}
