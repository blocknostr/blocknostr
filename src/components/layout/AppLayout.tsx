
import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { useSwipeable } from "@/hooks/use-swipeable";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { useIsMobile } from "@/hooks/use-mobile";
import { useRightSidebar } from "@/contexts/RightSidebarContext";
import Sidebar from "@/components/Sidebar";
import RightSidebar from "@/components/home/RightSidebar";
import MobileSidebar from "@/components/MobileSidebar";

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const { preferences } = useUserPreferences();
  const isMobile = useIsMobile();
  const { 
    activeHashtag, 
    rightPanelOpen, 
    setRightPanelOpen,
    setActiveHashtag, // Add this line to get the setActiveHashtag function
    clearHashtag 
  } = useRightSidebar();
  
  const [leftPanelOpen, setLeftPanelOpen] = useState(false);

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

  const handleTopicClick = (topic: string) => {
    setActiveHashtag(topic);
    if (isMobile) {
      setRightPanelOpen(false);
    }
    // Scroll to top of the feed
    window.scrollTo(0, 0);
  };

  return (
    <div className={cn(
      "flex min-h-screen bg-background relative",
      preferences.uiPreferences.compactMode ? "text-sm" : ""
    )}>
      {/* Desktop sidebar - only visible on non-mobile */}
      {!isMobile && <Sidebar />}
      
      {/* Mobile sidebar - shown based on state */}
      <MobileSidebar isOpen={leftPanelOpen} onOpenChange={setLeftPanelOpen} />
      
      <div 
        className={cn(
          "flex-1 transition-all duration-200",
          !isMobile && "ml-64"
        )}
        {...swipeHandlers}
        onClick={handleMainContentClick}
      >
        {children}
        
        {/* Right sidebar - either fixed or sheet based on device */}
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
  );
};

export default AppLayout;
