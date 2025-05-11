
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { nostrService } from '@/lib/nostr';
import { QueuedOperation } from '@/lib/nostr/bookmark/types';
import { useLocalStorage } from '@/hooks/use-local-storage';

type BookmarkStatus = 'bookmarked' | 'not_bookmarked';

export const useBookmarkState = (eventId: string, initialIsBookmarked: boolean) => {
  const [isBookmarked, setIsBookmarked] = useState<boolean>(initialIsBookmarked);
  const [isBookmarkPending, setIsBookmarkPending] = useState<boolean>(false);
  const [relaysConnected, setRelaysConnected] = useState<boolean>(true);
  const [pendingOperations, setPendingOperations] = useLocalStorage<QueuedOperation[]>('nostr_pending_bookmarks', []);

  useEffect(() => {
    // Sync with initial state from props
    if (initialIsBookmarked !== isBookmarked) {
      setIsBookmarked(initialIsBookmarked);
    }
  }, [initialIsBookmarked]);

  useEffect(() => {
    // Check if we have pending operations for this event
    const pendingOp = pendingOperations.find(
      op => op.type === 'add' && op.data?.eventId === eventId
    );
    
    if (pendingOp) {
      // If we have a pending add operation, set bookmarked to true
      setIsBookmarked(true);
      setIsBookmarkPending(true);
    }
  }, [eventId, pendingOperations]);

  const addToPendingOperations = useCallback((operation: Omit<QueuedOperation, 'data'> & { data: any }) => {
    setPendingOperations(prev => {
      // Check if we already have this operation
      const exists = prev.some(
        op => op.type === operation.type && 
        (op.type === 'add' && op.data?.eventId === operation.data?.eventId)
      );
      
      if (exists) {
        return prev;
      }
      
      return [...prev, {
        ...operation,
        timestamp: Date.now()
      }];
    });
  }, [setPendingOperations]);

  const removeFromPendingOperations = useCallback((eventId: string) => {
    setPendingOperations(prev => 
      prev.filter(op => !(op.type === 'add' && op.data?.eventId === eventId))
    );
  }, [setPendingOperations]);

  const handleBookmark = useCallback(async () => {
    if (isBookmarkPending) return;
    
    setIsBookmarkPending(true);
    
    try {
      if (isBookmarked) {
        // Unbookmark
        const success = await nostrService.removeBookmark(eventId);
        
        if (success) {
          setIsBookmarked(false);
          toast.success("Bookmark removed");
        } else {
          toast.error("Failed to remove bookmark");
        }
      } else {
        // Bookmark
        if (!relaysConnected) {
          // Queue operation for later
          addToPendingOperations({
            type: 'add',
            data: { 
              eventId,
              timestamp: Date.now()
            }
          });
          
          toast.success("Bookmark added (offline mode)");
          setIsBookmarked(true);
          return;
        }
        
        const success = await nostrService.addBookmark(eventId);
        
        if (success) {
          setIsBookmarked(true);
          toast.success("Bookmark added");
        } else {
          toast.error("Failed to add bookmark");
        }
      }
    } catch (error) {
      console.error("Error toggling bookmark:", error);
      toast.error("Failed to update bookmark");
    } finally {
      setIsBookmarkPending(false);
    }
  }, [isBookmarked, isBookmarkPending, eventId, relaysConnected, addToPendingOperations]);
  
  return {
    isBookmarked,
    isBookmarkPending,
    relaysConnected,
    setRelaysConnected,
    handleBookmark
  };
};
