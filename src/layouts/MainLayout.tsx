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
  const [iOSSafeArea, setIOSSafeArea] = useState(false);
  const [windowHeight, setWindowHeight] = useState(window.innerHeight);
  
  // Check for iOS device and set up dynamic viewport height
  useEffect(() => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIOSSafeArea(isIOS);
    
    // Add class to body for iOS-specific styling
    if (isIOS) {
      document.body.classList.add('ios-device');
      document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
      
      // Update on resize or orientation change
      const updateHeight = () => {
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
        setWindowHeight(window.innerHeight);
      };
      
      window.addEventListener('resize', updateHeight);
      window.addEventListener('orientationchange', updateHeight);
      
      // Initial call to set the height
      updateHeight();
      
      return () => {
        window.removeEventListener('resize', updateHeight);
        window.removeEventListener('orientationchange', updateHeight);
        document.body.classList.remove('ios-device');
      };
    }
  }, []);
  
  // Setup swipe handlers for mobile gesture navigation with improved sensitivity
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
    trackMouse: false,
    swipeThreshold: 10, // Make swipe detection more sensitive for iOS
    swipeDuration: 250 // Reduce duration needed for swipe on iOS
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
      setRightPanelOpen(false); // Assuming right panel is GlobalSidebar on mobile
      setLeftPanelOpen(false); // Close left panel if topic is clicked from there
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
    <div // Outermost div
      className={cn(
        "flex h-screen bg-background text-foreground",
        iOSSafeArea && "h-[var(--vh)] overflow-hidden" // Dynamically adjust height for iOS
      )}
      style={iOSSafeArea ? { height: `calc(${windowHeight}px * 0.01 * 100)` } : {}} // Apply dynamic height
      {...swipeHandlers} // Apply swipe handlers for mobile navigation
    >
      <NavigationProvider>
        {/* Centering container for sidebars and main content */}
        <div className="flex w-full max-w-7xl mx-auto"> {/* MODIFIED: Changed max-w-5xl to max-w-7xl */}
          {preferences.uiPreferences.showTrending && ( // Corrected: Assuming showTrending maps to showLeftSidebar
            <Sidebar // This is the LEFT sidebar (previously GlobalSidebar component was here)
              // The Sidebar component seems to be the one with navigation and profile, typically on the left.
              // className is handled internally by Sidebar based on isMobile.
              // Props like onTopicClick, onClose are not directly on Sidebar, it has its own nav.
              // We need to ensure Sidebar can be controlled for mobile (open/close) if it's the main left panel.
              // For now, assuming Sidebar's internal logic handles its display.
              // If Sidebar needs to be controlled:
              isOpen={leftPanelOpen} // Pass state for mobile sheet
              onClose={() => setLeftPanelOpen(false)} // Handler to close mobile sheet
            />
          )}

          {/* Main content area + Right Sidebar wrapper */}
          <div className="flex flex-col flex-1 overflow-hidden">
            <GlobalHeader
              leftPanelOpen={leftPanelOpen}
              setLeftPanelOpen={setLeftPanelOpen}
              rightPanelOpen={rightPanelOpen}
              setRightPanelOpen={setRightPanelOpen}
              activeHashtag={activeHashtag}
              onClearHashtag={clearHashtag}
              // onMenuClick={() => setLeftPanelOpen(true)} // GlobalHeader takes setLeftPanelOpen directly
            />

            <div className="flex flex-1 overflow-hidden">
              <main
                className={cn(
                  "flex-1 overflow-y-auto p-4 md:p-6 lg:p-8",
                  "w-full" // MODIFIED: Removed max-w-5xl mx-auto, main content now fills its column
                )}
                onClick={handleMainContentClick} // Close mobile panels on main content click
              >
                {children || <Outlet />}
              </main>

              {preferences.uiPreferences.showTrending && ( // Corrected: Assuming showTrending maps to showRightSidebar (e.g. for topics/search)
                <GlobalSidebar // This is the RIGHT sidebar (previously Sidebar component was here)
                  // className is handled internally by GlobalSidebar.
                  rightPanelOpen={rightPanelOpen} // For mobile control
                  setRightPanelOpen={setRightPanelOpen} // For mobile control
                  onTopicClick={handleTopicClick}
                  isMobile={isMobile}
                  activeHashtag={activeHashtag}
                  onClearHashtag={clearHashtag}
                />
              )}
            </div>
          </div>
        </div> {/* END Centering container */}
      </NavigationProvider>
    </div>
  );
};

export default MainLayout;
