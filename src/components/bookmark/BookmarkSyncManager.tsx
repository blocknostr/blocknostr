
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { nostrService } from '@/lib/nostr';
import { BookmarkStorage } from '@/lib/nostr/bookmark';

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
        const pendingOps = await BookmarkStorage.getPendingOperations();
        
        if (pendingOps.length === 0) {
          toast.dismiss();
          toast.success("No pending bookmark operations to sync");
          return;
        }
        
        console.log(`Syncing ${pendingOps.length} pending bookmark operations`);
        
        // Process pending operations
        await nostrService.processPendingOperations();
        
        // Get updated count after processing
        const remainingOps = await BookmarkStorage.getPendingOperations();
        const successCount = pendingOps.length - remainingOps.length;
        const failCount = remainingOps.length;
        
        toast.dismiss();
        if (successCount > 0) {
          toast.success(`Successfully synced ${successCount} bookmark operations`);
        }
        
        if (failCount > 0) {
          toast.error(`Failed to sync ${failCount} bookmark operations. They will be retried later.`);
        }
      } catch (error) {
        console.error("Error in sync process:", error);
        toast.dismiss();
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
