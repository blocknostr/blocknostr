
import React, { useEffect, useState, lazy, Suspense } from "react";
import { nostrService } from "@/lib/nostr";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { ConnectionStatusBanner } from "@/components/feed/ConnectionStatusBanner";
import { toast } from "sonner";
import { AlertTriangle, Loader2, HardDriveX } from "lucide-react";
import { Button } from "@/components/ui/button";

// Lazy load MainFeed to improve initial page load
const MainFeed = lazy(() => import("@/components/MainFeed"));

const Index: React.FC = () => {
  const { preferences, storageAvailable, storageQuotaReached } = useUserPreferences();
  const [activeHashtag, setActiveHashtag] = useState<string | undefined>(undefined);
  const [isInitializing, setIsInitializing] = useState(true);
  const [storageErrorDismissed, setStorageErrorDismissed] = useState(false);
  
  useEffect(() => {
    // Init connection to relays when the app loads if auto-connect is enabled
    const initNostr = async () => {
      try {
        await nostrService.connectToUserRelays();
      } catch (error) {
        console.error("Error initializing Nostr:", error);
        toast.error("Failed to connect to relays");
      } finally {
        setIsInitializing(false);
      }
    };
    
    initNostr();
    
    // Listen for hashtag changes from global events
    const handleHashtagChange = (event: CustomEvent) => {
      setActiveHashtag(event.detail);
    };
    
    window.addEventListener('set-hashtag', handleHashtagChange as EventListener);
    
    // Warn user if storage is not available
    if (storageAvailable === false && !storageErrorDismissed) {
      toast.warning(
        "Local storage unavailable", 
        { 
          description: "Your preferences won't be saved between sessions.",
          icon: <AlertTriangle className="h-4 w-4" />
        }
      );
    }
    
    return () => {
      window.removeEventListener('set-hashtag', handleHashtagChange as EventListener);
    };
  }, [preferences.relayPreferences?.autoConnect, storageAvailable, storageErrorDismissed]);

  const clearHashtag = () => {
    setActiveHashtag(undefined);
  };
  
  const handleClearStorageData = () => {
    try {
      // Try to clear non-essential data to free up storage
      const keysToKeep = [
        'nostr_pubkey', 
        'nostr_privkey', 
        'nostr_following'
      ];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && !keysToKeep.includes(key)) {
          localStorage.removeItem(key);
        }
      }
      
      toast.success("Storage cleared successfully. Refresh the page to continue.");
      setStorageErrorDismissed(true);
    } catch (e) {
      console.error("Error clearing storage:", e);
      toast.error("Failed to clear storage");
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-4">
      {storageQuotaReached && !storageErrorDismissed && (
        <div className="mb-4 p-4 border rounded-lg bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-200 text-sm">
          <div className="flex flex-col space-y-3">
            <div className="flex items-start">
              <HardDriveX className="h-5 w-5 flex-shrink-0 mr-2 mt-0.5" />
              <div>
                <p className="font-medium mb-1">Storage limit reached</p>
                <p>
                  Your browser's storage is full. This may affect your experience and prevent saving preferences.
                  Try clearing some storage or using a different browser.
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setStorageErrorDismissed(true)}
              >
                Dismiss
              </Button>
              <Button 
                variant="default" 
                size="sm" 
                onClick={handleClearStorageData}
              >
                Clear Storage Data
              </Button>
            </div>
          </div>
        </div>
      )}
      
      <ConnectionStatusBanner />
      
      {isInitializing ? (
        <div className="py-12 flex flex-col items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary/60 mb-3" />
          <p className="text-muted-foreground">Initializing connection...</p>
        </div>
      ) : (
        <Suspense fallback={
          <div className="py-12 flex flex-col items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary/60 mb-3" />
            <p className="text-muted-foreground">Loading feed...</p>
          </div>
        }>
          <MainFeed activeHashtag={activeHashtag} onClearHashtag={clearHashtag} />
        </Suspense>
      )}
    </div>
  );
};

export default Index;
