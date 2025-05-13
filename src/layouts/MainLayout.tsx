
import React, { useState, useEffect } from "react";
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

  // Listen for hashtag changes from global events
  useEffect(() => {
    const handleHashtagChange = (event: CustomEvent) => {
      setActiveHashtag(event.detail);
    };
    window.addEventListener('set-hashtag', handleHashtagChange as EventListener);
    return () => {
      window.removeEventListener('set-hashtag', handleHashtagChange as EventListener);
    };
  }, []);

  const handleTopicClick = (topic: string) => {
    setActiveHashtag(topic);
    if (isMobile) {
      setRightPanelOpen(false);
    }
    window.scrollTo(0, 0);
    window.dispatchEvent(new CustomEvent('set-hashtag', { detail: topic }));
  };

  const clearHashtag = () => {
    setActiveHashtag(undefined);
    window.dispatchEvent(new CustomEvent('set-hashtag', { detail: undefined }));
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
      <div
        className={cn(
          "flex min-h-screen bg-background relative",
          preferences.uiPreferences?.compactMode ? "text-sm" : ""
        )}
      >
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
              className="flex-1 min-h-screen mt-14" /* Added mt-4 for top margin */
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
