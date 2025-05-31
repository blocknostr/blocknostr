import React, { useState, useEffect, useMemo } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "@/components/sidebar/Sidebar";
import GlobalSidebar from "@/components/sidebar/GlobalSidebar";
import { useIsMobile } from "@/hooks/ui/use-mobile";
import { useResponsiveProvider, useResponsiveState } from "@/hooks/ui/use-responsive-provider";
import { getLayoutConfig } from "@/hooks/ui/use-responsive";
import { cn } from "@/lib/utils";
import { useSwipeable } from "@/hooks/ui/use-swipeable";
import { useUserPreferences } from "@/hooks/business/useUserPreferences";
import { NavigationProvider } from '@/contexts/NavigationContext';
import ReduxNavigationProvider from "@/components/providers/ReduxNavigationProvider";
import { useBackgroundRelayConnection } from '@/hooks/useBackgroundRelayConnection';
import { useGlobalLoginDialog } from '@/hooks/useGlobalLoginDialog';
import LoginDialog from '@/components/auth/LoginDialog';
import { Button } from "@/components/ui/button";

import { nostrService } from "@/lib/nostr";
import { useAppSelector } from "@/hooks/redux";
import { selectUseReduxForUI } from "@/store/slices/appSlice";

export interface MainLayoutProps {
  children?: React.ReactNode;
}

// Check if we're on iOS to handle safe areas
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  // Initialize responsive provider (connects to Redux)
  useResponsiveProvider();
  
  // Get responsive state from Redux
  const { breakpoint, isMobile, isTablet, isLaptop, isDesktop, isTouch, layoutMode } = useResponsiveState();
  
  // Get layout configuration for current breakpoint
  const layoutConfig = useMemo(() => getLayoutConfig(breakpoint), [breakpoint]);
  
  // Keep backward compatibility
  const isMobileLegacy = useIsMobile();
  
  const { preferences, updateNestedPreference } = useUserPreferences();
  const [activeHashtag, setActiveHashtag] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [windowHeight, setWindowHeight] = useState<number>(window.innerHeight);
  const [rightPanelOpen, setRightPanelOpen] = useState(false);
  const iOSSafeArea = isIOS;
  const useReduxForUI = useAppSelector(selectUseReduxForUI);
  
  // Use the background relay connection hook to keep connections alive
  useBackgroundRelayConnection();
  
  // Global login dialog hook
  const loginDialog = useGlobalLoginDialog();

  // Update login state
  useEffect(() => {
    const checkLoginStatus = () => {
      // Check if user is logged in by checking for publicKey
      const loggedIn = !!nostrService.publicKey;
      setIsLoggedIn(loggedIn);
    };
    
    // Check immediately
    checkLoginStatus();
    
    const handleLoginChange = () => {
      checkLoginStatus();
    };
    
    window.addEventListener('nostr:login', handleLoginChange);
    window.addEventListener('nostr:logout', handleLoginChange);
    
    return () => {
      window.removeEventListener('nostr:login', handleLoginChange);
      window.removeEventListener('nostr:logout', handleLoginChange);
    };
  }, []);
  
  // Update window height for iOS
  useEffect(() => {
    if (!iOSSafeArea) return;
    
    const updateHeight = () => {
      setWindowHeight(window.innerHeight);
    };
    
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, [iOSSafeArea]);

  // Enhanced swipe handling with responsive awareness
  const { handlers: swipeHandlers } = useSwipeable({
    onSwipedRight: () => {
      if (isMobile || isTouch) {
        // TODO: Open sidebar on mobile/touch devices
      }
    },
    onSwipedLeft: () => {
      if (isMobile || isTouch) {
        setRightPanelOpen(true);
      }
    },
  });

  // Handle topic/hashtag selection
  const handleTopicClick = (topic: string) => {
    if (topic.startsWith('#')) {
      const tag = topic.substring(1);
      setActiveHashtag(tag);
      
      // Update the feed filters with the selected tag
      if (preferences?.feedFilters) {
        const updatedTags = [...preferences.feedFilters.globalFeedTags];
        if (!updatedTags.includes(tag)) {
          updatedTags.push(tag);
          updateNestedPreference('feedFilters', 'globalFeedTags', updatedTags);
        }
      }
    }
  };

  // Clear active hashtag
  const clearHashtag = () => {
    setActiveHashtag(null);
  };
  
  // Close sidebars on main content click (mobile/tablet only)
  const handleMainContentClick = () => {
    if (isMobile || (isTablet && isTouch)) {
      // Close right panel if it's open
      if (rightPanelOpen) {
        setRightPanelOpen(false);
      }
    }
  };

  const content = (
    <div
      className={cn(
        "min-h-screen w-full transition-all duration-200",
        preferences?.uiPreferences?.theme === 'dark' ? "bg-gray-900" : "bg-background",
        // Apply responsive layout utility classes
        `layout-${breakpoint}`
      )}
    >
      {/* Twitter-style centered container */}
      <div className={cn(
        "max-w-7xl mx-auto flex min-h-screen",
        // Minimal horizontal padding for maximum content space
        isDesktop ? "px-4" : "px-3"
      )}>
        
        {/* Left Sidebar - Natural flow positioning */}
        {!isMobile && (
          <div className={cn(
            "flex-shrink-0 transition-all duration-200",
            layoutConfig.sidebarWidth
          )}>
            <div className="sticky top-0 h-screen">
              <Sidebar 
                isMobile={false}
                isCollapsed={preferences?.uiPreferences?.compactMode ?? false}
                className={cn(
                  "transition-all duration-200 h-full relative",
                  layoutConfig.sidebarWidth
                )}
              />
            </div>
          </div>
        )}

        {/* Main Content Area - Maximized width */}
        <div
          className={cn(
            "flex-1 min-w-0 transition-all duration-200",
            // Minimal spacing between columns for maximum content width
            !isMobile ? "mx-2" : "mx-0"
          )}
          {...swipeHandlers}
        >
          {/* Main content */}
          <main
            className={cn(
              "min-h-screen transition-all duration-200",
              layoutConfig.contentPadding
            )}
            onClick={handleMainContentClick}
            style={iOSSafeArea ? { minHeight: `calc(${windowHeight}px)` } : undefined}
            data-layout-mode={layoutMode}
          >
            {/* Content wrapper for proper centering */}
            <div className={cn(
              "w-full mx-auto",
              // Use responsive content width from layout config
              layoutConfig.contentMaxWidth
            )}>
              {children || <Outlet />}
            </div>
          </main>
        </div>

        {/* Right Sidebar - Natural flow positioning */}
        {!isMobile && layoutConfig.hasRightSidebar && (
          <div className={cn(
            "flex-shrink-0 transition-all duration-200",
            layoutConfig.rightSidebarWidth
          )}>
            <div className="sticky top-0 h-screen overflow-hidden">
              <GlobalSidebar
                rightPanelOpen={rightPanelOpen}
                setRightPanelOpen={setRightPanelOpen}
                onTopicClick={handleTopicClick}
                isMobile={false}
                activeHashtag={activeHashtag}
                onClearHashtag={clearHashtag}
                breakpoint={breakpoint}
                layoutMode={layoutMode}
              />
            </div>
          </div>
        )}
      </div>

      {/* Mobile sidebar overlay */}
      {isMobile && (
        <Sidebar 
          isMobile={true}
          isCollapsed={preferences?.uiPreferences?.compactMode ?? false}
          className="fixed inset-0 z-50"
        />
      )}

      {/* Global Login Dialog */}
      <LoginDialog 
        open={loginDialog.isOpen}
        onOpenChange={loginDialog.setLoginDialogOpen}
      />
    </div>
  );

  // Choose the appropriate provider based on the feature flag
  return useReduxForUI ? (
    <ReduxNavigationProvider>
      {content}
    </ReduxNavigationProvider>
  ) : (
    <NavigationProvider>
      {content}
    </NavigationProvider>
  );
};

export default MainLayout;

