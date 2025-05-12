
import React from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import GlobalSearch from "@/components/GlobalSearch";
import TrendingTopics from "@/components/feed/TrendingTopics";
import WorldChat from "@/components/chat/WorldChat";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { useLocation } from "react-router-dom";

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
  
  // Desktop right sidebar
  if (!isMobile && preferences.uiPreferences?.showTrending) {
    return (
      <aside className="w-80 p-4 hidden lg:block sticky top-14 h-[calc(100vh-3.5rem)] overflow-hidden">
        <div className="flex flex-col h-full space-y-2 overflow-hidden">
          <div>
            <GlobalSearch />
          </div>
          
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
            <div className="h-[550px] relative">
              <WorldChat />
            </div>
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
              <div className="h-[550px] relative">
                <WorldChat />
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    );
  }
  
  return null;
};

export default GlobalSidebar;
