
import React from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import GlobalSearch from "@/components/GlobalSearch";
import TrendingTopics from "@/components/feed/TrendingTopics";
import WhoToFollow from "@/components/WhoToFollow";
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
  
  // Desktop right sidebar - reduced width from 80 to 60 (25% reduction)
  if (!isMobile && preferences.uiPreferences.showTrending) {
    return (
      <aside className="w-60 p-2 hidden lg:block sticky top-14 h-[calc(100vh-3.5rem)]">
        <div className="space-y-4">
          <div className="mb-3">
            <GlobalSearch />
          </div>
          <TrendingTopics 
            onTopicClick={onTopicClick} 
            activeHashtag={activeHashtag}
            onClearHashtag={onClearHashtag}
          />
          <WhoToFollow />
        </div>
      </aside>
    );
  }
  
  // Mobile right panel - reduced width from 300px to 240px (20% reduction)
  if (isMobile) {
    return (
      <Sheet open={rightPanelOpen} onOpenChange={setRightPanelOpen}>
        <SheetContent side="right" className="p-2 w-[80%] max-w-[240px] overflow-y-auto">
          <div className="space-y-4">
            <div className="mb-3">
              <GlobalSearch />
            </div>
            <TrendingTopics 
              onTopicClick={onTopicClick} 
              activeHashtag={activeHashtag}
              onClearHashtag={onClearHashtag}
            />
            <WhoToFollow />
          </div>
        </SheetContent>
      </Sheet>
    );
  }
  
  return null;
};

export default RightSidebar;
