
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
  
  // Check for iOS device and set viewport height
  useEffect(() => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIOSSafeArea(isIOS);
    
    // Add class to body for iOS-specific styling
    if (isIOS) {
      document.body.classList.add('ios-device');
      
      // Set custom viewport height property
      const setVhProperty = () => {
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
      };
      
      // Initial set
      setVhProperty();
      
      // Update on resize or orientation change for better adaptability
      window.addEventListener('resize', setVhProperty);
      window.addEventListener('orientationchange', setVhProperty);
      
      // Handle safe area insets for notches and home indicators
      document.body.classList.add('ios-safe-area');
      
      return () => {
        window.removeEventListener('resize', setVhProperty);
        window.removeEventListener('orientationchange', setVhProperty);
        document.body.classList.remove('ios-device');
        document.body.classList.remove('ios-safe-area');
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
    if (iMobile) {
      setLeftPanelOpen(false);
      setRightPanelOpen(false);
    }
  };

  return (
    <NavigationProvider>
      <div
        className={cn(
          "flex min-h-screen bg-background relative overscroll-none",
          iOSSafeArea ? "ios-full-height" : "",
          preferences.uiPreferences?.compactMode ? "text-sm" : ""
        )}
      >
        {/* Desktop sidebar - only visible on non-mobile */}
        {!isMobile && <Sidebar />}

        <div
          className={cn(
            "flex-1 transition-all duration-200 flex-fill-screen",
            !isMobile && "ml-64",
            iOSSafeArea && "ios-safe-padding-bottom"
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

          <div className="flex stretch-content">
            <main
              className={cn(
                "flex-1 min-h-screen mt-14 stretch-content", /* Added top margin for header */
                iOSSafeArea && "ios-safe-padding-bottom"
              )}
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
