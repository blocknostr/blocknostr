
import React, { lazy, Suspense } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import GlobalSearch from "@/components/GlobalSearch";
import TrendingTopics from "@/components/feed/TrendingTopics";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";

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
  
  // Now show trending on all pages by removing exclusions
  // This will make trending appear consistently across the app
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
          
          <div className="flex-grow flex flex-col mt-1 overflow-hidden relative">
            <Suspense fallback={chatFallback}>
              <WorldChat />
            </Suspense>
          </div>
        </div>
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
            
            <div className="flex-grow flex flex-col mt-1 overflow-hidden relative">
              <Suspense fallback={chatFallback}>
                <WorldChat />
              </Suspense>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    );
  }
  
  return null;
};

export default GlobalSidebar;
