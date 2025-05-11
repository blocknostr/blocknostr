
import React from "react";
import { useHapticFeedback } from "@/hooks/use-haptic-feedback";
import { useSwipeable } from "@/hooks/use-swipeable";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { useRightSidebar } from "@/contexts/RightSidebarContext";
import RightSidebar from "@/components/home/RightSidebar";

interface AppPanelsContainerProps {
  children: React.ReactNode;
  leftPanelOpen: boolean;
  setLeftPanelOpen: (open: boolean) => void;
  showRightPanel: boolean;
}

const AppPanelsContainer: React.FC<AppPanelsContainerProps> = ({
  children,
  leftPanelOpen,
  setLeftPanelOpen,
  showRightPanel
}) => {
  const isMobile = useIsMobile();
  const { triggerHaptic } = useHapticFeedback();
  const { 
    activeHashtag,
    rightPanelOpen, 
    setRightPanelOpen,
    setActiveHashtag,
    clearHashtag 
  } = useRightSidebar();
  
  // Setup swipe handlers for mobile gesture navigation
  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => {
      if (isMobile && !rightPanelOpen) {
        setRightPanelOpen(true);
        setLeftPanelOpen(false);
        triggerHaptic('light');
      }
    },
    onSwipedRight: () => {
      if (isMobile && !leftPanelOpen) {
        setLeftPanelOpen(true);
        setRightPanelOpen(false);
        triggerHaptic('light');
      }
    },
    preventDefaultTouchmoveEvent: true,
    trackMouse: false,
    elasticEdges: true,
    velocityTracking: true
  });

  // Close panels when clicking on main content (mobile only)
  const handleMainContentClick = () => {
    if (isMobile) {
      setLeftPanelOpen(false);
      setRightPanelOpen(false);
    }
  };

  const handleTopicClick = (topic: string) => {
    setActiveHashtag(topic);
    triggerHaptic('medium');
    if (isMobile) {
      setRightPanelOpen(false);
    }
    // Scroll to top of the feed with iOS inertia
    window.scrollTo({ 
      top: 0, 
      behavior: 'smooth' 
    });
  };

  return (
    <div 
      className="flex w-full flex-1 overflow-fix"
      {...swipeHandlers}
      onClick={handleMainContentClick}
    >
      {/* Main content area */}
      <div className="flex-1 pb-safe-bottom">
        {children}
      </div>
      
      {/* Right sidebar - outside of children but inside the flex container */}
      {!isMobile && showRightPanel && (
        <RightSidebar
          rightPanelOpen={rightPanelOpen}
          setRightPanelOpen={setRightPanelOpen}
          onTopicClick={handleTopicClick}
          isMobile={isMobile}
          activeHashtag={activeHashtag}
          onClearHashtag={clearHashtag}
        />
      )}
      
      {/* Mobile right sidebar - rendered as a sheet */}
      {isMobile && (
        <RightSidebar
          rightPanelOpen={rightPanelOpen}
          setRightPanelOpen={setRightPanelOpen}
          onTopicClick={handleTopicClick}
          isMobile={isMobile}
          activeHashtag={activeHashtag}
          onClearHashtag={clearHashtag}
        />
      )}
    </div>
  );
};

export default AppPanelsContainer;
