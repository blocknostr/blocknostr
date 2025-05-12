
import React, { useEffect } from "react";
import { nostrService } from "@/lib/nostr";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import MainContent from "@/components/home/MainContent";
import { useRightSidebar } from "@/contexts/RightSidebarContext";

export const Index: React.FC = () => {
  const { preferences } = useUserPreferences();
  const { activeHashtag, clearHashtag } = useRightSidebar();
  
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
  }, [preferences.relayPreferences.autoConnect]);

  return (
    <MainContent
      activeHashtag={activeHashtag}
      onClearHashtag={clearHashtag}
    />
  );
};

export default Index;
