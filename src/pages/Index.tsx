
import React, { useEffect } from "react";
import { nostrService } from "@/lib/nostr";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { ConnectionStatusBanner } from "@/components/feed/ConnectionStatusBanner";
import MainFeed from "@/components/MainFeed";
import { toast } from "sonner";

const Index: React.FC = () => {
  const { preferences, storageAvailable } = useUserPreferences();
  
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
    
    // Warn user if storage is not available
    if (storageAvailable === false) {
      toast.warning(
        "Local storage unavailable", 
        { description: "Your preferences won't be saved between sessions." }
      );
    }
  }, [preferences.relayPreferences?.autoConnect, storageAvailable]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-4">
      <ConnectionStatusBanner />
      <MainFeed />
    </div>
  );
};

export default Index;
