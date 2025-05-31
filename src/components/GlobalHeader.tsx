import React from "react";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";

import { useIsMobile } from "@/hooks/ui/use-mobile";
import MobileMenu from "@/components/home/MobileMenu";
import { useLocation } from "react-router-dom";
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
  toggleSidebar: () => void;
}

const GlobalHeader: React.FC<GlobalHeaderProps> = ({
  leftPanelOpen,
  setLeftPanelOpen,
  rightPanelOpen,
  setRightPanelOpen,
  activeHashtag,
  onClearHashtag,
  toggleSidebar
}) => {
  const isMobile = useIsMobile();
  const location = useLocation();
  const isLoggedIn = !!nostrService.publicKey;
  
  // Function to get the appropriate title based on the current route
  const getPageTitle = () => {
    const path = location.pathname;
    
    if (path === '/') return 'Home';
    if (path === '/settings') return 'Settings';
    if (path === '/notifications') return 'Notifications';
    if (path === '/notebin') return 'Notebin';
    if (path === '/wallets') return 'Wallets';
    if (path === '/my-communities') return 'My Communities';
    if (path === '/communities') return 'Communities';
    if (path.startsWith('/communities/')) return 'Community';
    if (path === '/articles') return 'Articles';
    if (path === '/articles/editor') return 'Article Editor';
    if (path === '/articles/my') return 'My Articles';
    if (path === '/articles/drafts') return 'Drafts';
    if (path === '/profile') return 'Profile';
    if (path.startsWith('/profile/')) return 'Profile';
    if (path.startsWith('/content/')) return 'Content';
    if (path === '/games') return 'Games';
    if (path === '/premium') return 'Premium';
    
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
      } else if (segment === 'profile' && index === 0) {
        label = 'Profile';
      } else if (segment.match(/^[a-f0-9]{64}$/i) || segment.includes('npub')) {
        // This is likely an ID (pubkey), make it shorter
        label = `${segment.substring(0, 8)}...`;
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
            <Button 
              variant="ghost" 
              size="icon" 
              className="mr-2 md:hidden"
              onClick={toggleSidebar}
            >
              <Menu className="h-5 w-5" />
            </Button>
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
          
          <div className="flex items-center space-x-3">
            {/* Removed login button - now only in sidebar */}
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

