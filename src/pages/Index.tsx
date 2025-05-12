
import React, { useEffect, useState, lazy, Suspense } from "react";
import { nostrService } from "@/lib/nostr";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { ConnectionStatusBanner } from "@/components/feed/ConnectionStatusBanner";
import { toast } from "sonner";
import { AlertTriangle, Loader2 } from "lucide-react";

// Lazy load MainFeed to improve initial page load
const MainFeed = lazy(() => import("@/components/MainFeed"));

const Index: React.FC = () => {
  const { preferences, storageAvailable, storageQuotaReached } = useUserPreferences();
  const [activeHashtag, setActiveHashtag] = useState<string | undefined>(undefined);
  const [isInitializing, setIsInitializing] = useState(true);
  
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
    if (storageAvailable === false) {
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
  }, [preferences.relayPreferences?.autoConnect, storageAvailable]);

  const clearHashtag = () => {
    setActiveHashtag(undefined);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-4">
      {storageQuotaReached && (
        <div className="mb-4 p-3 border rounded-lg bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-200 text-sm flex items-center space-x-2">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          <span>
            Storage limit reached. Some preferences may not persist between sessions.
          </span>
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
