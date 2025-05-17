
import React from "react";
import { Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import LoginButton from "@/components/LoginButton";
import { useTheme } from "@/hooks/use-theme";
import { useIsMobile } from "@/hooks/use-mobile";
import MobileMenu from "@/components/home/MobileMenu";
import { useLocation } from "react-router-dom";
import HeaderRelayStatus from "@/components/header/HeaderRelayStatus";
import { nostrService } from "@/lib/nostr";
import PageBreadcrumbs, { BreadcrumbItem } from "@/components/navigation/PageBreadcrumbs";
import { useMemo } from "react";

interface GlobalHeaderProps {
  leftPanelOpen: boolean;
  setLeftPanelOpen: (open: boolean) => void;
  rightPanelOpen: boolean;
  setRightPanelOpen: (open: boolean) => void;
  activeHashtag?: string;
  onClearHashtag?: () => void;
}

const GlobalHeader: React.FC<GlobalHeaderProps> = ({
  leftPanelOpen,
  setLeftPanelOpen,
  rightPanelOpen,
  setRightPanelOpen,
  activeHashtag,
  onClearHashtag
}) => {
  const { darkMode, toggleDarkMode } = useTheme();
  const isMobile = useIsMobile();
  const location = useLocation();
  const isLoggedIn = !!nostrService.publicKey;
  
  // Function to get the appropriate title based on the current route
  const getPageTitle = () => {
    const path = location.pathname;
    
    if (path === '/') return 'Home';
    if (path === '/profile') return 'Profile';
    if (path.startsWith('/profile/')) return 'Profile';
    if (path === '/settings') return 'Settings';
    if (path === '/dao') return 'DAOs';
    if (path.startsWith('/dao/')) return 'DAO';
    if (path === '/messages') return 'Messages';
    if (path === '/notifications') return 'Notifications';
    if (path.startsWith('/post/')) return 'Post';
    if (path === '/notebin') return 'Notebin';
    if (path === '/wallets') return 'Wallets';
    if (path === '/premium') return 'Premium';
    if (path === '/articles') return 'Articles';
    if (path.startsWith('/articles/')) return 'Article';
    
    return 'BlockNostr';
  };

  // Generate breadcrumb items based on the current location
  const breadcrumbItems = useMemo(() => {
    const path = location.pathname;
    const breadcrumbs: BreadcrumbItem[] = [];
    
    // Split path into segments and build breadcrumbs
    const segments = path.split('/').filter(segment => segment);
    
    if (segments.length === 0) return [];
    
    // Map segments to breadcrumb items
    segments.forEach((segment, index) => {
      // Build the path for this breadcrumb
      const breadcrumbPath = `/${segments.slice(0, index + 1).join('/')}`;
      
      // Format the label to be more readable
      let label = segment.charAt(0).toUpperCase() + segment.slice(1);
      
      // Special cases for specific routes
      if (segment === 'dao' && index === 0) {
        label = 'DAOs';
      } else if (segment.match(/^[a-f0-9]{64}$/i) || segment.includes('npub')) {
        // This is likely an ID, make it shorter
        label = `${segment.substring(0, 6)}...`;
      }
      
      breadcrumbs.push({
        label,
        path: breadcrumbPath,
        isCurrentPage: index === segments.length - 1
      });
    });
    
    return breadcrumbs;
  }, [location.pathname]);

  const title = getPageTitle();
  
  // Show active hashtag if it exists
  const displayTitle = activeHashtag ? `#${activeHashtag}` : title;

  return (
    <header className="sticky top-0 bg-transparent backdrop-blur-sm z-10">
      <div className="flex flex-col h-14 px-4">
        <div className="flex items-center justify-between h-full">
          {isMobile && (
            <MobileMenu 
              leftPanelOpen={leftPanelOpen}
              setLeftPanelOpen={setLeftPanelOpen}
              rightPanelOpen={rightPanelOpen}
              setRightPanelOpen={setRightPanelOpen}
            />
          )}
          
          <div className="flex items-center">
            <h1 className="font-semibold">
              {displayTitle}
              {activeHashtag && onClearHashtag && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="ml-2 text-xs" 
                  onClick={onClearHashtag}
                >
                  ×
                </Button>
              )}
            </h1>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Add relay status indicator when logged in */}
            {isLoggedIn && <HeaderRelayStatus />}
            <Button 
              variant="ghost"
              size="icon"
              className="rounded-full theme-toggle-button"
              onClick={(e) => toggleDarkMode(e)}
              aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
              title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
            >
              <Lightbulb className={darkMode ? "h-5 w-5" : "h-5 w-5 text-yellow-500 fill-yellow-500"} />
            </Button>
            <LoginButton />
          </div>
        </div>
        
        {/* Add breadcrumbs navigation */}
        {breadcrumbItems.length > 0 && (
          <div className="px-1 pb-2">
            <PageBreadcrumbs items={breadcrumbItems} className="text-xs text-muted-foreground" />
          </div>
        )}
      </div>
    </header>
  );
};

export default GlobalHeader;
