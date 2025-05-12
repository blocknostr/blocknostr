
import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import PageHeader from "@/components/navigation/PageHeader";
import PageBreadcrumbs from "@/components/navigation/PageBreadcrumbs";
import { useHapticFeedback } from "@/hooks/use-haptic-feedback";
import { useLocation } from "@/lib/next-app-router-shim";
import { useNavigation } from "@/contexts/NavigationContext";

interface HeaderSectionProps {
  isMobile: boolean;
  setLeftPanelOpen: (open: boolean) => void;
}

const HeaderSection: React.FC<HeaderSectionProps> = ({
  isMobile,
  setLeftPanelOpen,
}) => {
  const location = useLocation();
  const { parentRoute, getParentRoute } = useNavigation();
  const { triggerHaptic } = useHapticFeedback();
  const [breadcrumbs, setBreadcrumbs] = useState<Array<{label: string; path: string; isCurrentPage?: boolean}>>([]);
  const [isScrolled, setIsScrolled] = useState(false);

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
    const pageName = getPageTitle(path);
    
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
  }, [location.pathname, parentRoute, getParentRoute]);

  // Determine page title based on current route
  const getPageTitle = (path: string) => {
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

  const handleToggleSidebar = () => {
    setLeftPanelOpen(true);
    triggerHaptic('light');
  };

  return (
    <div className={cn(
      "sticky top-0 z-50 w-full bg-background transition-all ios-spring duration-200 safe-top",
      isScrolled ? "shadow-sm" : ""
    )}>
      <PageHeader 
        title={getPageTitle(location.pathname)}
        showBackButton={shouldShowBackButton()}
      >
        {isMobile && (
          <button 
            onClick={handleToggleSidebar} 
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
  );
};

export default HeaderSection;
