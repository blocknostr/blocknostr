
import { useEffect, useState } from 'react';
import { nostrService } from '@/lib/nostr';
import { toast } from 'sonner';

/**
 * A component that handles background synchronization of offline bookmark operations
 * This component doesn't render anything visible but processes pending operations
 * when the app comes back online.
 */
const BookmarkSyncManager = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Process pending operations when coming back online
  useEffect(() => {
    const processPendingOperations = async () => {
      if (!navigator.onLine || isProcessing) return;
      
      try {
        setIsProcessing(true);
        await nostrService.processPendingOperations();
      } catch (error) {
        console.error("Error processing pending operations:", error);
      } finally {
        setIsProcessing(false);
      }
    };
    
    const handleOnline = () => {
      toast.success("You're back online. Syncing your bookmarks...");
      processPendingOperations();
    };
    
    // Process on mount if we're online
    processPendingOperations();
    
    // Add event listener for online events
    window.addEventListener('online', handleOnline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, [isProcessing]);
  
  // This component doesn't render anything
  return null;
};

export default BookmarkSyncManager;
