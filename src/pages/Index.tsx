
import React, { useEffect } from "react";
import { nostrService } from "@/lib/nostr";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { ConnectionStatusBanner } from "@/components/feed/ConnectionStatusBanner";
import MainFeed from "@/components/MainFeed";

const Index: React.FC = () => {
  const { preferences } = useUserPreferences();
  
  useEffect(() => {
    // Init connection to relays when the app loads if auto-connect is enabled
    const initNostr = async () => {
      try {
        await nostrService.connectToUserRelays();
      } catch (error) {
        console.error("Error initializing Nostr:", error);
      }
    };
    
    initNostr();
  }, [preferences.relayPreferences?.autoConnect]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-4">
      <ConnectionStatusBanner />
      <MainFeed />
    </div>
  );
};

export default Index;
