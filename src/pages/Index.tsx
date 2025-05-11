
import React, { useEffect } from "react";
import { nostrService } from "@/lib/nostr";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import MainContent from "@/components/home/MainContent";
import { useRightSidebar } from "@/contexts/RightSidebarContext";

const Index: React.FC = () => {
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
    <>
      <header className="sticky top-0 z-30 flex items-center justify-between bg-background/80 backdrop-blur-sm border-b h-14 px-4">
        <h1 className="font-semibold text-lg">Home</h1>
      </header>
      <MainContent
        activeHashtag={activeHashtag}
        onClearHashtag={clearHashtag}
      />
    </>
  );
};

export default Index;
