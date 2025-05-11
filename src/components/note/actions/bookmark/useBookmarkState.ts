
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { nostrService } from '@/lib/nostr';
import { QueuedOperation, BookmarkOperationType } from '@/lib/nostr/bookmark/types';
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

  const addToPendingOperations = useCallback((operation: { type: BookmarkOperationType, data: any }) => {
    const updatedOperations: QueuedOperation[] = [...pendingOperations];
    
    // Check if we already have this operation
    const exists = updatedOperations.some(
      op => op.type === operation.type && 
      (op.type === 'add' && op.data?.eventId === operation.data?.eventId)
    );
    
    if (!exists) {
      // Create complete QueuedOperation with required fields
      const completeOperation: QueuedOperation = {
        id: `op_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        timestamp: Date.now(),
        type: operation.type,
        status: 'pending',
        retryCount: 0,
        data: operation.data
      };
      
      updatedOperations.push(completeOperation);
    }
    
    setPendingOperations(updatedOperations);
  }, [pendingOperations, setPendingOperations]);

  const removeFromPendingOperations = useCallback((eventId: string) => {
    const updatedOperations = pendingOperations.filter(
      op => !(op.type === 'add' && op.data?.eventId === eventId)
    );
    setPendingOperations(updatedOperations);
  }, [pendingOperations, setPendingOperations]);

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
          // Queue operation for later with all required fields
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
