import { useState, useCallback, useEffect } from 'react';
import { nostrService } from "@/lib/nostr";
import { toast } from 'sonner';
import { retry } from '@/lib/utils/retry';
import { BookmarkCacheService } from '@/lib/nostr/bookmark/cache/bookmark-cache-service';
import { QueuedOperation } from '@/lib/nostr/bookmark/types';

/**
 * Improved hook to manage bookmark state and operations with:
 * - Retry mechanism
 * - Offline support
 * - Enhanced error handling
 */
export function useBookmarkState(eventId: string, initialIsBookmarked: boolean) {
  const [isBookmarked, setIsBookmarked] = useState(initialIsBookmarked);
  const [isBookmarkPending, setIsBookmarkPending] = useState(false);
  const [relaysConnected, setRelaysConnected] = useState(false);
  const isLoggedIn = !!nostrService.publicKey;
  const [queue, setQueue] = useState<({
    id: string;
    type: "add" | "remove" | "addCollection";
    data: any;
    status: "pending" | "processing" | "failed" | "completed";
    attempts: number;
    timestamp: number;
})[]>([]);
  
  // Check for cached bookmark status on mount
  useEffect(() => {
    const checkCachedStatus = async () => {
      // Only check cache if we don't have a server-provided initial value
      if (initialIsBookmarked === false) {
        const cachedStatus = await BookmarkCacheService.getCachedBookmarkStatus(eventId);
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
    const isConnected = checkRelayStatus();
    
    // Connect to relays if needed
    const connectIfNeeded = async () => {
      if (!isConnected) {
        try {
          await nostrService.connectToUserRelays();
          checkRelayStatus();
        } catch (error) {
          console.error("Failed to connect to relays during initial check:", error);
        }
      }
    };
    
    connectIfNeeded();
    
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
  
  const addToQueue = useCallback((eventId: string, collectionId?: string, tags?: string[], note?: string) => {
    setQueue(prev => [
      ...prev,
      {
        id: `add-${eventId}`,
        type: "add",
        data: { eventId, collectionId, tags, note },
        status: "pending",
        attempts: 0,
        timestamp: Date.now()
      }
    ]);
  }, []);

  const removeFromQueue = useCallback((eventId: string) => {
    setQueue(prev => [
      ...prev,
      {
        id: `remove-${eventId}`,
        type: "remove",
        data: { eventId },
        status: "pending",
        attempts: 0,
        timestamp: Date.now()
      }
    ]);
  }, []);

  const processOperation = useCallback(async (operation: {
    id: string;
    type: "add" | "remove" | "addCollection";
    data: any;
    status: "pending" | "processing" | "failed" | "completed";
    attempts: number;
    timestamp: number;
}) => {
    if (operation.status !== 'pending') return;

    try {
      setQueue(prev => prev.map(op => op.id === operation.id ? { ...op, status: 'processing' } : op));

      const success = operation.type === 'add'
        ? await nostrService.addBookmark(operation.data.eventId, operation.data.collectionId, operation.data.tags, operation.data.note)
        : await nostrService.removeBookmark(operation.data.eventId);

      if (success) {
        setQueue(prev => prev.map(op => op.id === operation.id ? { ...op, status: 'completed' } : op));
      } else {
        setQueue(prev => prev.map(op => op.id === operation.id ? { ...op, status: 'failed', attempts: op.attempts + 1 } : op));
      }
    } catch (error) {
      console.error("Error processing operation:", error);
      setQueue(prev => prev.map(op => op.id === operation.id ? { ...op, status: 'failed', attempts: op.attempts + 1 } : op));
    }
  }, []);

  useEffect(() => {
    if (!navigator.onLine) return;

    const pendingOperations = queue.filter(op => op.status === 'pending' && op.attempts < 3);

    pendingOperations.forEach(operation => {
      processOperation(operation as any);
    });
  }, [queue, processOperation]);

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
      await BookmarkCacheService.cacheBookmarkStatus(eventId, newBookmarkState);
      
      if (newBookmarkState) {
        addToQueue(eventId);
      } else {
        removeFromQueue(eventId);
      }
      
      toast.info(`Post ${newBookmarkState ? 'bookmarked' : 'bookmark removed'}.`);
    } catch (error) {
      console.error("Error bookmarking post:", error);
      // Revert UI state
      setIsBookmarked(!isBookmarked);
      await BookmarkCacheService.cacheBookmarkStatus(eventId, !isBookmarked);
      
      // Show descriptive error based on type
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      
      if (errorMsg.includes("timeout")) {
        toast.error("Operation timed out. Please try again when you have a better connection.");
      } else if (errorMsg.includes("relay")) {
        toast.error("Unable to reach relays. Please check your network connection.");
      } else {
        toast.error(`Failed to update bookmark: ${errorMsg}`);
      }
    } finally {
      setIsBookmarkPending(false);
    }
  }, [eventId, isBookmarked, isLoggedIn, isBookmarkPending, relaysConnected, addToQueue, removeFromQueue]);
  
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
