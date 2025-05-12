
import React, { ReactNode } from 'react';
import { useSwipeable } from "@/hooks/use-swipeable";
import { useHapticFeedback } from "@/hooks/use-haptic-feedback";

interface MobileNavigationHandlerProps {
  children: ReactNode;
  isMobile: boolean;
  rightPanelOpen: boolean;
  leftPanelOpen: boolean;
  setRightPanelOpen: (open: boolean) => void;
  setLeftPanelOpen: (open: boolean) => void;
  handleMainContentClick: () => void;
}

const MobileNavigationHandler: React.FC<MobileNavigationHandlerProps> = ({
  children,
  isMobile,
  rightPanelOpen,
  leftPanelOpen,
  setRightPanelOpen,
  setLeftPanelOpen,
  handleMainContentClick
}) => {
  const { triggerHaptic } = useHapticFeedback();
  
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

  return (
    <div 
      className="flex w-full flex-1 overflow-fix"
      {...swipeHandlers}
      onClick={handleMainContentClick}
    >
      {children}
    </div>
  );
};

export default MobileNavigationHandler;
