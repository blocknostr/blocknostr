
import { SwipeableHandlers } from "@/hooks/use-swipeable";
import { useSwipeable } from "@/hooks/use-swipeable";

interface UseBookmarkSwipeProps {
  isMobile: boolean;
  leftPanelOpen: boolean;
  setLeftPanelOpen: (open: boolean) => void;
  rightPanelOpen: boolean;
  setRightPanelOpen: (open: boolean) => void;
}

export const useBookmarkSwipe = ({
  isMobile,
  leftPanelOpen,
  setLeftPanelOpen,
  rightPanelOpen,
  setRightPanelOpen
}: UseBookmarkSwipeProps): {
  swipeHandlers: SwipeableHandlers;
  handleMainContentClick: () => void;
} => {
  // Setup swipe handlers for mobile gesture navigation
  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => {
      if (isMobile && !rightPanelOpen) {
        setRightPanelOpen(true);
        setLeftPanelOpen(false);
      }
    },
    onSwipedRight: () => {
      if (isMobile && !leftPanelOpen) {
        setLeftPanelOpen(true);
        setRightPanelOpen(false);
      }
    },
    preventDefaultTouchmoveEvent: true,
    trackMouse: false
  });

  // Close panels when clicking on main content (mobile only)
  const handleMainContentClick = () => {
    if (isMobile) {
      setLeftPanelOpen(false);
      setRightPanelOpen(false);
    }
  };

  return { swipeHandlers, handleMainContentClick };
};
