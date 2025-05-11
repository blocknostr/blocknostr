
import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { useSwipeable } from "@/hooks/use-swipeable";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { useIsMobile } from "@/hooks/use-mobile";
import { useRightSidebar } from "@/contexts/RightSidebarContext";
import { useLocation } from "react-router-dom";
import Sidebar from "@/components/Sidebar";
import RightSidebar from "@/components/home/RightSidebar";
import MobileSidebar from "@/components/MobileSidebar";
import PageHeader from "@/components/navigation/PageHeader";

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const { preferences } = useUserPreferences();
  const isMobile = useIsMobile();
  const location = useLocation();
  const { 
    activeHashtag, 
    rightPanelOpen, 
    setRightPanelOpen,
    setActiveHashtag,
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

  // Determine page title based on current route
  const getPageTitle = () => {
    const path = location.pathname;
    
    if (path === "/") return "Home";
    if (path.startsWith("/profile")) return "Profile";
    if (path.startsWith("/messages")) return "Messages";
    if (path.startsWith("/notifications")) return "Notifications";
    if (path.startsWith("/communities")) return "Communities";
    if (path.startsWith("/notebin")) return "Notebin";
    if (path.startsWith("/wallets")) return "Wallets";
    if (path.startsWith("/premium")) return "Premium";
    if (path.startsWith("/settings")) return "Settings";
    if (path.startsWith("/post")) return "Post";
    
    return "BlockNoster";
  };

  // Determine which pages should show a back button
  const shouldShowBackButton = () => {
    const path = location.pathname;
    // Home, top-level sections, and settings don't need back buttons
    const noBackButtonRoutes = [
      '/',
      '/communities',
      '/settings',
      '/messages',
      '/notifications',
      '/wallets',
      '/premium',
      '/notebin'
    ];
    
    return !noBackButtonRoutes.includes(path) && !noBackButtonRoutes.some(route => 
      route !== '/' && path === `${route}/`
    );
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
          "flex-1 transition-all duration-200 flex flex-col",
          !isMobile && "ml-64"
        )}
      >
        {/* Page Header - common across all pages */}
        <PageHeader 
          title={getPageTitle()}
          showBackButton={shouldShowBackButton()}
        >
          {isMobile && (
            <button 
              onClick={() => setLeftPanelOpen(true)} 
              className="mr-2 p-1.5 rounded-md hover:bg-accent"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-menu">
                <line x1="4" x2="20" y1="12" y2="12"/>
                <line x1="4" x2="20" y1="6" y2="6"/>
                <line x1="4" x2="20" y1="18" y2="18"/>
              </svg>
            </button>
          )}
        </PageHeader>
        
        <div 
          className="flex w-full flex-1"
          {...swipeHandlers}
          onClick={handleMainContentClick}
        >
          {/* Main content area */}
          <div className="flex-1">
            {children}
          </div>
          
          {/* Right sidebar - outside of children but inside the flex container */}
          {!isMobile && preferences.uiPreferences.showTrending && (
            <RightSidebar
              rightPanelOpen={rightPanelOpen}
              setRightPanelOpen={setRightPanelOpen}
              onTopicClick={handleTopicClick}
              isMobile={isMobile}
              activeHashtag={activeHashtag}
              onClearHashtag={clearHashtag}
            />
          )}
        </div>
        
        {/* Mobile right sidebar - rendered as a sheet */}
        {isMobile && (
          <RightSidebar
            rightPanelOpen={rightPanelOpen}
            setRightPanelOpen={setRightPanelOpen}
            onTopicClick={handleTopicClick}
            isMobile={isMobile}
            activeHashtag={activeHashtag}
            onClearHashtag={clearHashtag}
          />
        )}
      </div>
    </div>
  );
};

export default AppLayout;
