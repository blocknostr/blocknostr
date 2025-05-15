
import React, { Suspense, useState } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import GlobalSearch from "@/components/GlobalSearch";
import TrendingTopics from "@/components/feed/TrendingTopics";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { useLocation } from "react-router-dom";
import { Loader2, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { chatNostrService } from "@/lib/nostr/chat-service";
import LoginDialog from "@/components/auth/LoginDialog";
import WorldChat from "@/components/chat/WorldChat";

// Lazy load SavedHashtags for better performance
const SavedHashtags = React.lazy(() => import("@/components/feed/SavedHashtags"));

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
  const isLoggedIn = !!chatNostrService.publicKey;
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);
  
  const shouldShowTrending = () => {
    return true; // Always show trending section on all pages
  };

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
        <div className="flex-grow flex flex-col mt-1 overflow-hidden relative border rounded-md bg-gradient-to-b from-background to-muted/10">
          <div className="flex flex-col items-center justify-center h-full p-4 text-center">
            <div className="p-2 bg-primary/10 rounded-full mb-3">
              <Wallet className="h-5 w-5 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground mb-3">Connect to join the chat</p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleLoginClick}
              className="gap-1.5 border-primary/20 hover:border-primary/30 bg-transparent hover:bg-primary/5"
            >
              <Wallet className="h-3.5 w-3.5 text-primary" />
              Connect
            </Button>
          </div>
        </div>
      );
    }
    
    return (
      <div className="flex-grow flex flex-col mt-1 overflow-hidden relative">
        <WorldChat />
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
