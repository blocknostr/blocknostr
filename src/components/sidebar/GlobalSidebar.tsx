import React, { Suspense } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import GlobalSearch from "@/components/GlobalSearch";
import { useUserPreferences } from "@/hooks/business/useUserPreferences";
import { useLocation } from "react-router-dom";
import { Loader2, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import LoginDialog from "@/components/auth/LoginDialog";
import WorldChat from "@/components/chat/WorldChat";
import { useAuth } from "@/hooks/useAuth";
import { useGlobalLoginDialog } from "@/hooks/useGlobalLoginDialog";
import type { Breakpoint } from "@/store/slices/uiSlice";
import { getLayoutConfig } from "@/hooks/ui/use-responsive";
import { cn } from "@/lib/utils";

// Lazy load CryptoTracker for better performance
const CryptoTracker = React.lazy(() => import("@/components/crypto/CryptoTracker"));

interface GlobalSidebarProps {
  rightPanelOpen: boolean;
  setRightPanelOpen: (open: boolean) => void;
  onTopicClick: (topic: string) => void;
  isMobile: boolean;
  activeHashtag?: string;
  onClearHashtag?: () => void;
  breakpoint?: Breakpoint;
  layoutMode?: 'single' | 'dual' | 'triple';
}

const GlobalSidebar: React.FC<GlobalSidebarProps> = ({ 
  rightPanelOpen, 
  setRightPanelOpen, 
  onTopicClick,
  isMobile,
  activeHashtag,
  onClearHashtag,
  breakpoint = 'desktop',
  layoutMode = 'triple'
}) => {
  const { preferences } = useUserPreferences();
  const location = useLocation();
  const { isLoggedIn } = useAuth();
  const { isOpen: loginDialogOpen, openLoginDialog, setLoginDialogOpen } = useGlobalLoginDialog();
  
  // Get layout configuration for consistent sizing
  const layoutConfig = getLayoutConfig(breakpoint);
  
  // Responsive sizing based on breakpoint - use layout config
  const getSidebarWidth = () => {
    if (isMobile) {
      return 'w-[80%] max-w-[300px]';
    }
    return layoutConfig.rightSidebarWidth;
  };

  // Responsive spacing and sizing
  const getContentSpacing = () => {
    switch (breakpoint) {
      case 'mobile':
        return 'space-y-2 p-3';
      case 'tablet':
        return 'space-y-2 p-3';
      case 'laptop':
        return 'space-y-3 p-4';
      case 'desktop':
        return 'space-y-3 p-4';
      default:
        return 'space-y-3 p-4';
    }
  };

  const cryptoTrackerFallback = (
    <div className={cn(
      "flex items-center justify-center",
      breakpoint === 'mobile' ? "h-[120px]" : "h-[160px]"
    )}>
      <Loader2 className="h-4 w-4 text-primary/50 animate-spin" />
    </div>
  );
  
  const renderChatSection = () => {
    if (!isLoggedIn) {
      return (
        <div className="chat-container flex-grow mt-3 overflow-hidden relative rounded-lg border bg-gradient-to-b from-background to-muted/10">
          <div className="flex flex-col items-center justify-center h-full p-4 text-center">
            <div className="p-2 bg-primary/10 rounded-full mb-3">
              <Wallet className="h-5 w-5 text-primary" />
            </div>
            <p className={cn(
              "text-muted-foreground mb-3",
              breakpoint === 'mobile' ? "text-xs" : "text-sm"
            )}>
              Connect to join the chat
            </p>
            <Button 
              variant="outline" 
              size={breakpoint === 'mobile' ? "sm" : "sm"}
              onClick={openLoginDialog}
              className="gap-1.5 border-primary/20 hover:border-primary/30 bg-transparent hover:bg-primary/5"
            >
              <Wallet className="h-3.5 w-3.5 text-primary" />
              Connect
            </Button>
          </div>
        </div>
      );
    }

    // User is logged in - show WorldChat directly
    return (
      <div className="chat-container flex-grow mt-3 overflow-hidden relative">
        <WorldChat />
      </div>
    );
  };
  
  // Desktop right sidebar with responsive layout
  if (!isMobile) {
    // Hide sidebar on laptop when in dual layout mode if screen is too narrow
    const shouldHideSidebar = layoutMode === 'dual' && breakpoint === 'laptop';
    
    return (
      <aside className={cn(
        "h-full overflow-hidden flex-shrink-0", // Simplified for natural flow
        getSidebarWidth(),
        // Reduced minimum width to prevent layout compression issues
        breakpoint === 'desktop' ? "min-w-[280px]" : "min-w-[220px]", 
        shouldHideSidebar ? "hidden xl:block" : "block"
        // Removed margins - handled by parent container now
      )}>
        <div className={cn(
          "flex flex-col h-full overflow-hidden overflow-safe",
          getContentSpacing()
        )}>
          <div className="search-section">
            <GlobalSearch />
          </div>
          
          {/* Always show crypto section in right sidebar */}
          <div className="crypto-section">
            <Suspense fallback={cryptoTrackerFallback}>
              <CryptoTracker />
            </Suspense>
          </div>
          
          <div className="divider h-px bg-border/50 my-1" />
          
          {renderChatSection()}
        </div>
        
        {/* Login Dialog is now managed globally in MainLayout */}
      </aside>
    );
  }
  
  // Mobile right panel with responsive sizing
  if (isMobile) {
    return (
      <Sheet open={rightPanelOpen} onOpenChange={setRightPanelOpen}>
        <SheetContent side="right" className={cn(
          "overflow-hidden",
          getSidebarWidth()
        )}>
          <div className={cn(
            "flex flex-col h-full overflow-hidden",
            getContentSpacing()
          )}>
            <div className="search-section">
              <GlobalSearch />
            </div>
            
            <div className="crypto-section">
              <Suspense fallback={cryptoTrackerFallback}>
                <CryptoTracker />
              </Suspense>
            </div>
            
            <div className="divider h-px bg-border/50 my-1" />
            
            {renderChatSection()}
          </div>
          
          {/* Login Dialog is now managed globally in MainLayout */}
        </SheetContent>
      </Sheet>
    );
  }
  
  return null;
};

export default GlobalSidebar;

