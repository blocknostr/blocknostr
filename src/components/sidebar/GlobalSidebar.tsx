
import React, { lazy, Suspense, useState } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import GlobalSearch from "@/components/GlobalSearch";
import TrendingTopics from "@/components/feed/TrendingTopics";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { useLocation } from "react-router-dom";
import { Loader2, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { nostrService } from "@/lib/nostr";
import LoginDialog from "@/components/auth/LoginDialog";

// Lazy load WorldChat to improve initial sidebar load
const WorldChat = lazy(() => import("@/components/chat/WorldChat"));
// Lazy load SavedHashtags for better performance
const SavedHashtags = lazy(() => import("@/components/feed/SavedHashtags"));

interface GlobalSidebarProps {
  rightPanelOpen: boolean;
  setRightPanelOpen: (open: boolean) => void;
  onTopicClick: (topic: string) => void;
  isMobile: boolean;
  activeHashtag?: string;
  onClearHashtag?: () => void;
}

const GlobalSidebar: React.FC<GlobalSidebarProps> = ({ 
  rightPanelOpen, 
  setRightPanelOpen, 
  onTopicClick,
  isMobile,
  activeHashtag,
  onClearHashtag
}) => {
  const { preferences } = useUserPreferences();
  const location = useLocation();
  const isLoggedIn = !!nostrService.publicKey;
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);
  
  const shouldShowTrending = () => {
    return true; // Always show trending section on all pages
  };

  const chatFallback = (
    <div className="h-full flex items-center justify-center">
      <Loader2 className="h-6 w-6 text-primary/50 animate-spin" />
    </div>
  );
  
  const hashtagsFallback = (
    <div className="h-[100px] flex items-center justify-center">
      <Loader2 className="h-4 w-4 text-primary/50 animate-spin" />
    </div>
  );
  
  const handleLoginClick = () => {
    setLoginDialogOpen(true);
  };
  
  const renderChatSection = () => {
    if (!isLoggedIn) {
      return (
        <div className="flex-grow flex flex-col mt-1 overflow-hidden relative border rounded-md">
          <div className="flex flex-col items-center justify-center h-full p-4 text-center">
            <LogIn className="h-8 w-8 text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground mb-3">Connect to join the chat</p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleLoginClick}
            >
              Login
            </Button>
          </div>
        </div>
      );
    }
    
    return (
      <div className="flex-grow flex flex-col mt-1 overflow-hidden relative">
        <Suspense fallback={chatFallback}>
          <WorldChat />
        </Suspense>
      </div>
    );
  };
  
  // Desktop right sidebar
  if (!isMobile && preferences.uiPreferences?.showTrending) {
    return (
      <aside className="w-80 p-4 hidden lg:block sticky top-14 h-[calc(100vh-3.5rem)] overflow-hidden">
        <div className="flex flex-col h-full space-y-2 overflow-hidden">
          <div>
            <GlobalSearch />
          </div>
          
          <Suspense fallback={hashtagsFallback}>
            <SavedHashtags onTopicClick={onTopicClick} />
          </Suspense>
          
          {shouldShowTrending() && (
            <div className="mb-0.5">
              <TrendingTopics 
                onTopicClick={onTopicClick} 
                activeHashtag={activeHashtag}
                onClearHashtag={onClearHashtag}
              />
            </div>
          )}
          
          {renderChatSection()}
        </div>
        
        <LoginDialog 
          open={loginDialogOpen}
          onOpenChange={setLoginDialogOpen}
        />
      </aside>
    );
  }
  
  // Mobile right panel
  if (isMobile) {
    return (
      <Sheet open={rightPanelOpen} onOpenChange={setRightPanelOpen}>
        <SheetContent side="right" className="p-4 w-[80%] max-w-[300px] overflow-hidden">
          <div className="flex flex-col h-full space-y-2 overflow-hidden">
            <div>
              <GlobalSearch />
            </div>
            
            <Suspense fallback={hashtagsFallback}>
              <SavedHashtags onTopicClick={onTopicClick} />
            </Suspense>
            
            {shouldShowTrending() && (
              <div className="mb-0.5">
                <TrendingTopics 
                  onTopicClick={onTopicClick} 
                  activeHashtag={activeHashtag}
                  onClearHashtag={onClearHashtag}
                />
              </div>
            )}
            
            {renderChatSection()}
          </div>
          
          <LoginDialog 
            open={loginDialogOpen}
            onOpenChange={setLoginDialogOpen}
          />
        </SheetContent>
      </Sheet>
    );
  }
  
  return null;
};

export default GlobalSidebar;
