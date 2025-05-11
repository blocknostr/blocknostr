
import React from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import GlobalSearch from "@/components/GlobalSearch";
import TrendingTopics from "@/components/feed/TrendingTopics";
import WorldChat from "@/components/chat/WorldChat";
import { useUserPreferences } from "@/hooks/useUserPreferences";

interface RightSidebarProps {
  rightPanelOpen: boolean;
  setRightPanelOpen: (open: boolean) => void;
  onTopicClick: (topic: string) => void;
  isMobile: boolean;
  activeHashtag?: string;
  onClearHashtag?: () => void;
}

const RightSidebar: React.FC<RightSidebarProps> = ({ 
  rightPanelOpen, 
  setRightPanelOpen, 
  onTopicClick,
  isMobile,
  activeHashtag,
  onClearHashtag
}) => {
  const { preferences } = useUserPreferences();
  
  // Desktop right sidebar
  if (!isMobile && preferences.uiPreferences.showTrending) {
    return (
      <aside className="w-80 p-4 hidden lg:block sticky top-14 h-[calc(100vh-3.5rem)]">
        <div className="space-y-6">
          <div className="mb-4">
            <GlobalSearch />
          </div>
          <TrendingTopics 
            onTopicClick={onTopicClick} 
            activeHashtag={activeHashtag}
            onClearHashtag={onClearHashtag}
          />
          <WorldChat />
        </div>
      </aside>
    );
  }
  
  // Mobile right panel
  if (isMobile) {
    return (
      <Sheet open={rightPanelOpen} onOpenChange={setRightPanelOpen}>
        <SheetContent side="right" className="p-4 w-[80%] max-w-[300px] overflow-y-auto">
          <div className="space-y-6">
            <div className="mb-4">
              <GlobalSearch />
            </div>
            <TrendingTopics 
              onTopicClick={onTopicClick} 
              activeHashtag={activeHashtag}
              onClearHashtag={onClearHashtag}
            />
            <WorldChat />
          </div>
        </SheetContent>
      </Sheet>
    );
  }
  
  return null;
};

export default RightSidebar;
