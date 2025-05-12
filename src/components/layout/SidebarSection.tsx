
import React from "react";
import { cn } from "@/lib/utils";
import { useHapticFeedback } from "@/hooks/use-haptic-feedback";
import Sidebar from "@/components/Sidebar";
import MobileSidebar from "@/components/MobileSidebar";
import RightSidebar from "@/components/home/RightSidebar";

interface SidebarSectionProps {
  isMobile: boolean;
  leftPanelOpen: boolean;
  rightPanelOpen: boolean;
  activeHashtag?: string;
  setLeftPanelOpen: (open: boolean) => void;
  setRightPanelOpen: (open: boolean) => void;
  clearHashtag: () => void;
  showTrending: boolean;
}

const SidebarSection: React.FC<SidebarSectionProps> = ({
  isMobile,
  leftPanelOpen,
  rightPanelOpen,
  activeHashtag,
  setLeftPanelOpen,
  setRightPanelOpen,
  clearHashtag,
  showTrending
}) => {
  const { triggerHaptic } = useHapticFeedback();

  const handleTopicClick = (topic: string) => {
    // This is accessed from the RightSidebarContext to update the active hashtag
    setRightPanelOpen(false);
    triggerHaptic('medium');
    // Scroll to top of the feed with iOS inertia
    window.scrollTo({ 
      top: 0, 
      behavior: 'smooth' 
    });
  };

  return (
    <>
      {/* Desktop sidebar - only visible on non-mobile */}
      {!isMobile && <Sidebar />}
      
      {/* Mobile sidebar - shown based on state */}
      <MobileSidebar isOpen={leftPanelOpen} onOpenChange={setLeftPanelOpen} />
      
      {/* Right sidebar - conditionally rendered based on device */}
      <RightSidebar
        rightPanelOpen={rightPanelOpen}
        setRightPanelOpen={setRightPanelOpen}
        onTopicClick={handleTopicClick}
        isMobile={isMobile}
        activeHashtag={activeHashtag}
        onClearHashtag={clearHashtag}
      />
    </>
  );
};

export default SidebarSection;
