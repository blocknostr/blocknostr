
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
    if (path === '/communities') return 'Communities';
    if (path.startsWith('/communities/')) return 'Community';
    if (path === '/messages') return 'Messages';
    if (path === '/notifications') return 'Notifications';
    if (path.startsWith('/post/')) return 'Post';
    if (path === '/notes') return 'Notes';
    if (path === '/wallets') return 'Wallets';
    if (path === '/premium') return 'Premium';
    
    return 'BlockNostr';
  };

  const title = getPageTitle();
  
  // Show active hashtag if it exists
  const displayTitle = activeHashtag ? `#${activeHashtag}` : title;

  return (
    <header className="border-b sticky top-0 bg-background/80 backdrop-blur-sm z-10">
      <div className="flex items-center justify-between h-14 px-4">
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
    </header>
  );
};

export default GlobalHeader;
