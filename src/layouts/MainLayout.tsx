
import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "@/components/sidebar/Sidebar";
import GlobalSidebar from "@/components/sidebar/GlobalSidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { useSwipeable } from "@/hooks/use-swipeable";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import GlobalHeader from "@/components/GlobalHeader";
import { NavigationProvider } from '@/contexts/NavigationContext';

export interface MainLayoutProps {
  children?: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const { preferences } = useUserPreferences();
  const [activeHashtag, setActiveHashtag] = useState<string | undefined>(undefined);
  const isMobile = useIsMobile();
  const [rightPanelOpen, setRightPanelOpen] = useState(false);
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

  const handleTopicClick = (topic: string) => {
    setActiveHashtag(topic);
    if (isMobile) {
      setRightPanelOpen(false);
    }
    // Scroll to top of the feed
    window.scrollTo(0, 0);
    
    // Dispatch custom event for components that need to know about hashtag changes
    const event = new CustomEvent('set-hashtag', { detail: topic });
    window.dispatchEvent(event);
  };

  const clearHashtag = () => {
    setActiveHashtag(undefined);
    
    // Dispatch custom event to clear hashtag
    const event = new CustomEvent('set-hashtag', { detail: undefined });
    window.dispatchEvent(event);
  };

  // Close panels when clicking on main content (mobile only)
  const handleMainContentClick = () => {
    if (isMobile) {
      setLeftPanelOpen(false);
      setRightPanelOpen(false);
    }
  };

  return (
    <NavigationProvider>
      <div className={cn(
        "flex min-h-screen bg-background relative",
        preferences.uiPreferences?.compactMode ? "text-sm" : ""
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
          <GlobalHeader
            leftPanelOpen={leftPanelOpen}
            setLeftPanelOpen={setLeftPanelOpen}
            rightPanelOpen={rightPanelOpen}
            setRightPanelOpen={setRightPanelOpen}
            activeHashtag={activeHashtag}
            onClearHashtag={clearHashtag}
          />
          
          <div className="flex">
            <main 
              className="flex-1 min-h-screen" 
              onClick={handleMainContentClick}
            >
              {children || <Outlet />}
            </main>
            
            <GlobalSidebar
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
    </NavigationProvider>
  );
};

export default MainLayout;
