
import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useSwipeable } from "@/hooks/use-swipeable";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { useIsMobile } from "@/hooks/use-mobile";
import { useHapticFeedback } from "@/hooks/use-haptic-feedback";
import { useRightSidebar } from "@/contexts/RightSidebarContext";
import { useLocation } from "react-router-dom";
import { useNavigation } from "@/contexts/NavigationContext";
import Sidebar from "@/components/Sidebar";
import RightSidebar from "@/components/home/RightSidebar";
import MobileSidebar from "@/components/MobileSidebar";
import PageHeader from "@/components/navigation/PageHeader";
import PageBreadcrumbs from "@/components/navigation/PageBreadcrumbs";

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const { preferences } = useUserPreferences();
  const isMobile = useIsMobile();
  const location = useLocation();
  const { parentRoute, getParentRoute } = useNavigation();
  const { triggerHaptic } = useHapticFeedback();
  const { 
    activeHashtag, 
    rightPanelOpen, 
    setRightPanelOpen,
    setActiveHashtag,
    clearHashtag 
  } = useRightSidebar();
  
  const [leftPanelOpen, setLeftPanelOpen] = useState(false);
  const [breadcrumbs, setBreadcrumbs] = useState<Array<{label: string; path: string; isCurrentPage?: boolean}>>([]);
  const [isScrolled, setIsScrolled] = useState(false);

  // Setup swipe handlers for mobile gesture navigation
  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => {
      if (isMobile && !rightPanelOpen) {
        setRightPanelOpen(true);
        setLeftPanelOpen(false);
        triggerHaptic('light');
      }
    },
    onSwipedRight: () => {
      if (isMobile && !leftPanelOpen) {
        setLeftPanelOpen(true);
        setRightPanelOpen(false);
        triggerHaptic('light');
      }
    },
    preventDefaultTouchmoveEvent: true,
    trackMouse: false,
    elasticEdges: true,
    velocityTracking: true
  });

  // Track scroll position for iOS style header behavior
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Close panels when clicking on main content (mobile only)
  const handleMainContentClick = () => {
    if (isMobile) {
      setLeftPanelOpen(false);
      setRightPanelOpen(false);
    }
  };

  const handleTopicClick = (topic: string) => {
    setActiveHashtag(topic);
    triggerHaptic('medium');
    if (isMobile) {
      setRightPanelOpen(false);
    }
    // Scroll to top of the feed with iOS inertia
    window.scrollTo({ 
      top: 0, 
      behavior: 'smooth' 
    });
  };

  // Generate breadcrumbs based on current location
  useEffect(() => {
    const path = location.pathname;
    const newBreadcrumbs = [];
    
    // Skip breadcrumbs for home page
    if (path === '/') {
      setBreadcrumbs([]);
      return;
    }
    
    // Add current page
    const pageName = getPageTitle();
    
    // If we're on a deep path, add the parent
    if (parentRoute && parentRoute !== '/') {
      // Get the parent page title
      const parentPathParts = parentRoute.split('/').filter(Boolean);
      const parentName = parentPathParts.length > 0 ? 
        parentPathParts[parentPathParts.length - 1].charAt(0).toUpperCase() + 
        parentPathParts[parentPathParts.length - 1].slice(1) : 
        "Home";
      
      newBreadcrumbs.push({
        label: parentName,
        path: parentRoute,
      });
    }
    
    // Add current page to breadcrumbs
    newBreadcrumbs.push({
      label: pageName,
      path: path,
      isCurrentPage: true
    });
    
    setBreadcrumbs(newBreadcrumbs);
  }, [location.pathname, parentRoute]);

  // Determine page title based on current route
  const getPageTitle = () => {
    const path = location.pathname;
    
    if (path === "/") return "Home";
    if (path.startsWith("/profile")) return "Profile";
    if (path.startsWith("/settings")) return "Settings";
    if (path.startsWith("/communities")) {
      if (path === "/communities") return "Communities";
      // Extract community name from path if possible
      const parts = path.split('/');
      if (parts.length > 2 && parts[2]) {
        return parts[2].charAt(0).toUpperCase() + parts[2].slice(1);
      }
      return "Community";
    }
    if (path.startsWith("/messages")) return "Messages";
    if (path.startsWith("/notifications")) return "Notifications";
    if (path.startsWith("/notebin")) return "Notebin";
    if (path.startsWith("/wallets")) return "Wallets";
    if (path.startsWith("/premium")) return "Premium";
    if (path.startsWith("/post")) return "Post";
    
    return "BlockNoster";
  };

  // Show back button on pages that aren't the home page
  const shouldShowBackButton = () => location.pathname !== '/';

  // Show breadcrumbs only on deeper pages, not top-level sections
  const shouldShowBreadcrumbs = () => breadcrumbs.length > 1;

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
          "flex-1 transition-all ios-spring duration-300 flex flex-col",
          !isMobile && "ml-64",
          "rubber-scroll overflow-fix" // iOS optimizations
        )}
      >
        {/* iOS-friendly Page Header with dynamic shadow based on scroll */}
        <div className={cn(
          "sticky top-0 z-50 w-full bg-background transition-all ios-spring duration-200 safe-top",
          isScrolled ? "shadow-sm" : ""
        )}>
          <PageHeader 
            title={getPageTitle()}
            showBackButton={shouldShowBackButton()}
          >
            {isMobile && (
              <button 
                onClick={() => {
                  setLeftPanelOpen(true);
                  triggerHaptic('light');
                }} 
                className="mr-2 p-1.5 rounded-md hover:bg-accent haptic"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-menu">
                  <line x1="4" x2="20" y1="12" y2="12"/>
                  <line x1="4" x2="20" y1="6" y2="6"/>
                  <line x1="4" x2="20" y1="18" y2="18"/>
                </svg>
              </button>
            )}
          </PageHeader>
          
          {/* Breadcrumbs - shown only on deeper pages */}
          {shouldShowBreadcrumbs() && (
            <div className="px-4 py-2">
              <PageBreadcrumbs items={breadcrumbs} />
            </div>
          )}
        </div>
        
        <div 
          className="flex w-full flex-1 overflow-fix"
          {...swipeHandlers}
          onClick={handleMainContentClick}
        >
          {/* Main content area */}
          <div className="flex-1 pb-safe-bottom">
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
