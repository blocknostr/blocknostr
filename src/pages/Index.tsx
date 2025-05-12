import React, { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import { nostrService } from "@/lib/nostr";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { useSwipeable } from "@/hooks/use-swipeable";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import PageHeader from "@/components/home/PageHeader";
import MainContent from "@/components/home/MainContent";
import RightSidebar from "@/components/home/RightSidebar";

const Index: React.FC = () => {
  const { preferences } = useUserPreferences();
  const [activeHashtag, setActiveHashtag] = useState<string | undefined>(undefined);
  const isMobile = useIsMobile();
  const [rightPanelOpen, setRightPanelOpen] = useState(false);
  const [leftPanelOpen, setLeftPanelOpen] = useState(false);
  
  useEffect(() => {
    // Init connection to relays when the app loads if auto-connect is enabled
    const initNostr = async () => {
      try {
        // Use the correct method name
        await nostrService.connectToUserRelays();
      } catch (error) {
        console.error("Error initializing Nostr:", error);
      }
    };
    
    initNostr();
  }, [preferences.relayPreferences.autoConnect]);

  useEffect(() => {
    // Listen for hashtag setting events
    const handleSetHashtag = (e: CustomEvent) => {
      setActiveHashtag(e.detail);
    };

    window.addEventListener('set-hashtag', handleSetHashtag as EventListener);
    
    return () => {
      window.removeEventListener('set-hashtag', handleSetHashtag as EventListener);
    };
  }, []);

  const handleTopicClick = (topic: string) => {
    setActiveHashtag(topic);
    if (isMobile) {
      setRightPanelOpen(false);
    }
    // Scroll to top of the feed
    window.scrollTo(0, 0);
  };

  const clearHashtag = () => {
    setActiveHashtag(undefined);
  };

  // Setup swipe handlers for mobile gesture navigation
  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => {
      if (isMobile && !rightPanelOpen) {
        setRightPanelOpen(true);
        setLeftPanelOpen(false);
      }
    },
    onSwipedRight: () => {
      if (isMobile && !leftPanelOpen) {
        setLeftPanelOpen(true);
        setRightPanelOpen(false);
      }
    },
    preventDefaultTouchmoveEvent: true,
    trackMouse: false
  });

  // Close panels when clicking on main content (mobile only)
  const handleMainContentClick = () => {
    if (isMobile) {
      setLeftPanelOpen(false);
      setRightPanelOpen(false);
    }
  };

  return (
    <div className={cn(
      "flex min-h-screen bg-background relative",
      preferences.uiPreferences.compactMode ? "text-sm" : ""
    )}>
      {/* Desktop sidebar - only visible on non-mobile */}
      {!isMobile && <Sidebar />}
      
      <div 
        className={cn(
          "flex-1 transition-all duration-200",
          !isMobile && "ml-64"
        )}
        {...swipeHandlers}
      >
        <PageHeader
          leftPanelOpen={leftPanelOpen}
          setLeftPanelOpen={setLeftPanelOpen}
          rightPanelOpen={rightPanelOpen}
          setRightPanelOpen={setRightPanelOpen}
        />
        
        <div className="flex">
          <MainContent
            activeHashtag={activeHashtag}
            onClearHashtag={clearHashtag}
            handleMainContentClick={handleMainContentClick}
          />
          
          <RightSidebar
            rightPanelOpen={rightPanelOpen}
            setRightPanelOpen={setRightPanelOpen}
            onTopicClick={handleTopicClick}
            isMobile={isMobile}
            activeHashtag={activeHashtag}
            onClearHashtag={clearHashtag}
          />
        </div>
      </div>
    </div>
  );
};

export default Index;
