
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
  elasticEdges?: boolean; // iOS-like elastic edges
  velocityTracking?: boolean; // Track velocity for more natural-feeling swipes
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
  time: number; // For velocity tracking
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
  elasticEdges = true,
  velocityTracking = true,
}: SwipeableOptions): SwipeableHandlers {
  const touchStart = useRef<Position | null>(null);
  const touchEnd = useRef<Position | null>(null);
  const latestTouch = useRef<Position | null>(null);
  const [swiping, setSwiping] = useState(false);
  const navigation = enableNavigationGestures ? useNavigation() : null;

  // Reset touch positions when component unmounts
  useEffect(() => {
    return () => {
      touchStart.current = null;
      touchEnd.current = null;
      latestTouch.current = null;
    };
  }, []);

  // Handle touch start event
  const onTouchStart: React.TouchEventHandler = (e) => {
    touchEnd.current = null;
    const now = Date.now();
    touchStart.current = {
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
      time: now,
    };
    latestTouch.current = touchStart.current;
    setSwiping(true);
  };

  // Handle touch move event
  const onTouchMove: React.TouchEventHandler = (e) => {
    if (preventDefaultTouchmoveEvent) e.preventDefault();
    if (!touchStart.current) return;
    
    const now = Date.now();
    latestTouch.current = {
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
      time: now,
    };
    
    // Apply elastic edge resistance if enabled
    if (elasticEdges) {
      const deltaX = latestTouch.current.x - touchStart.current.x;
      const element = e.currentTarget as HTMLElement;
      const scrollElement = getScrollParent(element);
      
      if (scrollElement) {
        // If scrolling horizontally, apply resistance at edges
        if (
          (scrollElement.scrollLeft <= 0 && deltaX > 0) ||
          (scrollElement.scrollLeft + scrollElement.clientWidth >= scrollElement.scrollWidth && deltaX < 0)
        ) {
          // Apply some resistance to the movement (iOS-like)
          const resistance = 0.4;
          const newX = touchStart.current.x + deltaX * resistance;
          latestTouch.current.x = newX;
        }
      }
    }
    
    touchEnd.current = latestTouch.current;
  };

  // Handle touch end event
  const onTouchEnd: React.TouchEventHandler = (e) => {
    if (!touchStart.current || !touchEnd.current) return;
    
    const distX = touchEnd.current.x - touchStart.current.x;
    const distY = touchEnd.current.y - touchStart.current.y;
    const absDistX = Math.abs(distX);
    const absDistY = Math.abs(distY);
    
    // Calculate velocity if enabled
    let velocityX = 0;
    let velocityY = 0;
    
    if (velocityTracking && touchStart.current && touchEnd.current) {
      const duration = touchEnd.current.time - touchStart.current.time;
      if (duration > 0) {
        velocityX = distX / duration; // pixels per ms
        velocityY = distY / duration; // pixels per ms
      }
    }
    
    // Check if we have a valid swipe (distance is greater than threshold OR velocity is high)
    const isHighVelocity = Math.abs(velocityX) > 0.5 || Math.abs(velocityY) > 0.5;
    
    if (Math.max(absDistX, absDistY) > swipeThreshold || isHighVelocity) {
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
    latestTouch.current = null;
    setSwiping(false);
  };

  // Mouse handlers for testing on desktop
  const onMouseDown: React.MouseEventHandler | undefined = trackMouse
    ? (e) => {
        touchEnd.current = null;
        const now = Date.now();
        touchStart.current = { 
          x: e.clientX, 
          y: e.clientY,
          time: now
        };
        latestTouch.current = touchStart.current;
        setSwiping(true);
      }
    : undefined;

  const onMouseMove: React.MouseEventHandler | undefined = trackMouse
    ? (e) => {
        if (!touchStart.current || !swiping) return;
        const now = Date.now();
        latestTouch.current = { 
          x: e.clientX, 
          y: e.clientY,
          time: now
        };
        touchEnd.current = latestTouch.current;
      }
    : undefined;

  const onMouseUp: React.MouseEventHandler | undefined = trackMouse
    ? ((e) => {
        if (!touchStart.current || !touchEnd.current) return;
      
        const distX = touchEnd.current.x - touchStart.current.x;
        const distY = touchEnd.current.y - touchStart.current.y;
        const absDistX = Math.abs(distX);
        const absDistY = Math.abs(distY);
        
        // Calculate velocity
        let velocityX = 0;
        let velocityY = 0;
        
        if (velocityTracking && touchStart.current && touchEnd.current) {
          const duration = touchEnd.current.time - touchStart.current.time;
          if (duration > 0) {
            velocityX = distX / duration;
            velocityY = distY / duration;
          }
        }
        
        // Check if we have a valid swipe (distance is greater than threshold OR velocity is high)
        const isHighVelocity = Math.abs(velocityX) > 0.5 || Math.abs(velocityY) > 0.5;
        
        if (Math.max(absDistX, absDistY) > swipeThreshold || isHighVelocity) {
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
        latestTouch.current = null;
        setSwiping(false);
      }) as React.MouseEventHandler
    : undefined;

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    ...(trackMouse && { onMouseDown, onMouseMove, onMouseUp }),
  };
}

// Helper function to find scrollable parent
function getScrollParent(element: HTMLElement): HTMLElement | null {
  if (!element) {
    return null;
  }

  if (
    element.scrollHeight > element.clientHeight ||
    element.scrollWidth > element.clientWidth
  ) {
    return element;
  }

  return getScrollParent(element.parentElement as HTMLElement);
}
