
import { useCallback } from "react";

interface SwipeHandlers {
  onTouchStart: React.TouchEventHandler;
  onTouchMove: React.TouchEventHandler;
  onTouchEnd: React.TouchEventHandler;
  onMouseDown?: React.MouseEventHandler;
  onMouseMove?: React.MouseEventHandler;
  onMouseUp?: React.MouseEventHandler;
}

interface UseBookmarkSwipeParams {
  isMobile: boolean;
  leftPanelOpen: boolean;
  setLeftPanelOpen: (open: boolean) => void;
  rightPanelOpen: boolean;
  setRightPanelOpen: (open: boolean) => void;
}

interface UseBookmarkSwipeResult {
  swipeHandlers: SwipeHandlers;
  handleMainContentClick: () => void;
}

export function useBookmarkSwipe({
  isMobile,
  leftPanelOpen,
  setLeftPanelOpen,
  rightPanelOpen,
  setRightPanelOpen
}: UseBookmarkSwipeParams): UseBookmarkSwipeResult {
  // Only enable swipe on mobile
  const swipeHandlers: SwipeHandlers = isMobile
    ? {
        onTouchStart: useCallback((e) => {
          const touch = e.touches[0];
          (e.currentTarget as any).touchStartX = touch.clientX;
        }, []),
        
        onTouchMove: useCallback((e) => {
          if (!(e.currentTarget as any).touchStartX) return;
          
          const touch = e.touches[0];
          const currentX = touch.clientX;
          const startX = (e.currentTarget as any).touchStartX;
          const diff = currentX - startX;
          
          // Store diff for use in touchEnd
          (e.currentTarget as any).touchDiffX = diff;
        }, []),
        
        onTouchEnd: useCallback((e) => {
          const diff = (e.currentTarget as any).touchDiffX;
          
          if (diff > 50) {
            // Swipe right - open left panel
            setLeftPanelOpen(true);
            setRightPanelOpen(false);
          } else if (diff < -50) {
            // Swipe left - open right panel if implemented
            setLeftPanelOpen(false);
            setRightPanelOpen(true);
          }
          
          // Reset values
          (e.currentTarget as any).touchStartX = null;
          (e.currentTarget as any).touchDiffX = null;
        }, [setLeftPanelOpen, setRightPanelOpen])
      }
    : {
        onTouchStart: () => {},
        onTouchMove: () => {},
        onTouchEnd: () => {}
      };
  
  // Close panels when clicking on main content
  const handleMainContentClick = useCallback(() => {
    if (isMobile && (leftPanelOpen || rightPanelOpen)) {
      setLeftPanelOpen(false);
      setRightPanelOpen(false);
    }
  }, [isMobile, leftPanelOpen, rightPanelOpen, setLeftPanelOpen, setRightPanelOpen]);
  
  return {
    swipeHandlers,
    handleMainContentClick
  };
}
