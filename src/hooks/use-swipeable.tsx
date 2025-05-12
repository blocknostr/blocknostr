
import { useRef, useEffect, useState } from "react";
import { useNavigation } from "@/contexts/NavigationContext";

interface SwipeableOptions {
  onSwipedLeft?: () => void;
  onSwipedRight?: () => void;
  onSwipedUp?: () => void;
  onSwipedDown?: () => void;
  preventDefaultTouchmoveEvent?: boolean;
  trackMouse?: boolean;
  swipeThreshold?: number;
  enableNavigationGestures?: boolean;
}

interface SwipeableHandlers {
  onTouchStart: React.TouchEventHandler;
  onTouchMove: React.TouchEventHandler;
  onTouchEnd: React.TouchEventHandler;
  onMouseDown?: React.MouseEventHandler;
  onMouseMove?: React.MouseEventHandler;
  onMouseUp?: React.MouseEventHandler;
}

interface Position {
  x: number;
  y: number;
}

export function useSwipeable({
  onSwipedLeft,
  onSwipedRight,
  onSwipedUp,
  onSwipedDown,
  preventDefaultTouchmoveEvent = false,
  trackMouse = false,
  swipeThreshold = 50,
  enableNavigationGestures = true,
}: SwipeableOptions): SwipeableHandlers {
  const touchStart = useRef<Position | null>(null);
  const touchEnd = useRef<Position | null>(null);
  const [swiping, setSwiping] = useState(false);
  const navigation = enableNavigationGestures ? useNavigation() : null;

  // Reset touch positions when component unmounts
  useEffect(() => {
    return () => {
      touchStart.current = null;
      touchEnd.current = null;
    };
  }, []);

  // Handle touch start event
  const onTouchStart: React.TouchEventHandler = (e) => {
    touchEnd.current = null;
    touchStart.current = {
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
    };
    setSwiping(true);
  };

  // Handle touch move event
  const onTouchMove: React.TouchEventHandler = (e) => {
    if (preventDefaultTouchmoveEvent) e.preventDefault();
    if (!touchStart.current) return;
    
    touchEnd.current = {
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
    };
  };

  // Handle touch end event
  const onTouchEnd: React.TouchEventHandler = () => {
    if (!touchStart.current || !touchEnd.current) return;
    
    const distX = touchEnd.current.x - touchStart.current.x;
    const distY = touchEnd.current.y - touchStart.current.y;
    const absDistX = Math.abs(distX);
    const absDistY = Math.abs(distY);
    
    // Check if we have a valid swipe (distance is greater than threshold)
    if (Math.max(absDistX, absDistY) > swipeThreshold) {
      if (absDistX > absDistY) {
        // Horizontal swipe
        if (distX > 0) {
          // Right swipe - can be used for back navigation
          if (navigation?.canGoBack && enableNavigationGestures) {
            navigation.goBack();
          }
          onSwipedRight?.();
        } else {
          onSwipedLeft?.();
        }
      } else {
        // Vertical swipe
        if (distY > 0) {
          onSwipedDown?.();
        } else {
          onSwipedUp?.();
        }
      }
    }
    
    // Reset
    touchStart.current = null;
    touchEnd.current = null;
    setSwiping(false);
  };

  // Mouse handlers for testing on desktop
  const onMouseDown: React.MouseEventHandler | undefined = trackMouse
    ? (e) => {
        touchEnd.current = null;
        touchStart.current = { x: e.clientX, y: e.clientY };
        setSwiping(true);
      }
    : undefined;

  const onMouseMove: React.MouseEventHandler | undefined = trackMouse
    ? (e) => {
        if (!touchStart.current || !swiping) return;
        touchEnd.current = { x: e.clientX, y: e.clientY };
      }
    : undefined;

  const onMouseUp: React.MouseEventHandler | undefined = trackMouse
    ? onTouchEnd as unknown as React.MouseEventHandler
    : undefined;

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    ...(trackMouse && { onMouseDown, onMouseMove, onMouseUp }),
  };
}
