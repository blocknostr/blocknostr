
import React from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import GlobalSearch from "@/components/GlobalSearch";
import TrendingTopics from "@/components/feed/TrendingTopics";
import WorldChat from "@/components/chat/WorldChat";

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
  // Content to display in both mobile and desktop sidebars
  const sidebarContent = (
    <div className="flex flex-col h-full space-y-2">
      <div>
        <GlobalSearch />
      </div>
      <div className="mb-0.5">
        <TrendingTopics 
          onTopicClick={onTopicClick} 
          activeHashtag={activeHashtag}
          onClearHashtag={onClearHashtag}
        />
      </div>
      <div className="flex-grow flex flex-col mt-1">
        <WorldChat />
      </div>
    </div>
  );
  
  // Mobile right panel as a sheet
  if (isMobile) {
    return (
      <Sheet open={rightPanelOpen} onOpenChange={setRightPanelOpen}>
        <SheetContent side="right" className="p-4 w-[80%] max-w-[300px] overflow-y-auto">
          <div className="pt-10">
            {sidebarContent}
          </div>
        </SheetContent>
      </Sheet>
    );
  }
  
  // Desktop right sidebar
  return (
    <aside className="w-80 p-4 sticky top-0 h-screen overflow-y-auto border-l">
      {sidebarContent}
    </aside>
  );
};

export default RightSidebar;
