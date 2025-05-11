
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { nostrService } from '@/lib/nostr';
import { BookmarkCacheService } from '@/lib/nostr/bookmark/cache/bookmark-cache-service';

/**
 * Component that handles sync of pending bookmark operations when coming online
 * This is meant to be included near the root of the app
 */
export function BookmarkSyncManager() {
  const [isProcessing, setIsProcessing] = useState(false);
  const isLoggedIn = !!nostrService.publicKey;

  // Process pending operations when coming online
  useEffect(() => {
    if (!isLoggedIn) return;

    const handleOnline = async () => {
      // Don't run multiple sync processes simultaneously
      if (isProcessing) return;
      
      try {
        setIsProcessing(true);
        toast.loading("Syncing bookmarks...");
        
        // Wait a bit for connection to stabilize
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Get pending operations
        const pendingOps = await BookmarkCacheService.getPendingOperations();
        
        if (pendingOps.length === 0) {
          toast.success("No pending bookmark operations to sync");
          return;
        }
        
        // Import the service to use its processing method
        const { nostrService } = await import('@/lib/nostr');
        
        // Ensure connected to relays
        await nostrService.connectToUserRelays();
        
        // Process each pending operation
        let successCount = 0;
        let failCount = 0;
        
        for (const op of pendingOps) {
          try {
            if (op.type === 'add') {
              await nostrService.addBookmark(
                op.data.eventId,
                op.data.collectionId,
                op.data.tags,
                op.data.note
              );
              successCount++;
            } else if (op.type === 'remove') {
              await nostrService.removeBookmark(op.data.eventId);
              successCount++;
            }
            
            // Mark as completed
            await BookmarkCacheService.completeOperation(op.id);
          } catch (error) {
            console.error(`Error processing pending operation ${op.id}:`, error);
            failCount++;
            
            // Update operation status
            await BookmarkCacheService.updateOperationStatus(
              op.id,
              'failed',
              op.attempts + 1
            );
          }
        }
        
        if (successCount > 0) {
          toast.success(`Successfully synced ${successCount} bookmark operations`);
        }
        
        if (failCount > 0) {
          toast.error(`Failed to sync ${failCount} bookmark operations. They will be retried later.`);
        }
      } catch (error) {
        console.error("Error in sync process:", error);
        toast.error("Failed to sync bookmarks. Please try again later.");
      } finally {
        setIsProcessing(false);
      }
    };

    // Listen for online event
    window.addEventListener('online', handleOnline);
    
    // Also try to process on mount if we're online
    if (navigator.onLine) {
      handleOnline();
    }

    // Cleanup
    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, [isLoggedIn, isProcessing]);

  // This is a utility component that doesn't render anything
  return null;
}

export default BookmarkSyncManager;
