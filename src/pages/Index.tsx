
import React, { useEffect, useState } from "react";
import { nostrService } from "@/lib/nostr";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { ConnectionStatusBanner } from "@/components/feed/ConnectionStatusBanner";
import MainFeed from "@/components/MainFeed";
import { toast } from "sonner";
import { AlertTriangle } from "lucide-react";

const Index: React.FC = () => {
  const { preferences, storageAvailable, storageQuotaReached } = useUserPreferences();
  const [activeHashtag, setActiveHashtag] = useState<string | undefined>(undefined);
  
  useEffect(() => {
    // Init connection to relays when the app loads if auto-connect is enabled
    const initNostr = async () => {
      try {
        await nostrService.connectToUserRelays();
      } catch (error) {
        console.error("Error initializing Nostr:", error);
        toast.error("Failed to connect to relays");
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
        <div className="mb-4 p-3 border rounded-lg bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-400 text-sm flex items-center space-x-2">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          <span>
            Storage limit reached. Some preferences may not persist between sessions.
          </span>
        </div>
      )}
      <ConnectionStatusBanner />
      <MainFeed activeHashtag={activeHashtag} onClearHashtag={clearHashtag} />
    </div>
  );
};

export default Index;
