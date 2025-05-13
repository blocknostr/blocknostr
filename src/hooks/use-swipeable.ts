
import { useCallback } from 'react';

interface SwipeableHandlers {
  onTouchStart: (e: TouchEvent | React.TouchEvent) => void;
  onTouchMove: (e: TouchEvent | React.TouchEvent) => void;
  onTouchEnd: (e: TouchEvent | React.TouchEvent) => void;
  onMouseDown: (e: MouseEvent | React.MouseEvent) => void;
  onMouseMove: (e: MouseEvent | React.MouseEvent) => void;
  onMouseUp: (e: MouseEvent | React.MouseEvent) => void;
  onMouseLeave: (e: MouseEvent | React.MouseEvent) => void;
}

interface UseSwipeableOptions {
  onSwipedLeft?: (e: TouchEvent | MouseEvent | React.TouchEvent | React.MouseEvent) => void;
  onSwipedRight?: (e: TouchEvent | MouseEvent | React.TouchEvent | React.MouseEvent) => void;
  onSwipedUp?: (e: TouchEvent | MouseEvent | React.TouchEvent | React.MouseEvent) => void;
  onSwipedDown?: (e: TouchEvent | MouseEvent | React.TouchEvent | React.MouseEvent) => void;
  preventDefaultTouchmoveEvent?: boolean;
  trackMouse?: boolean;
  minDistance?: number;
}

export function useSwipeable({
  onSwipedLeft,
  onSwipedRight,
  onSwipedUp,
  onSwipedDown,
  preventDefaultTouchmoveEvent = false,
  trackMouse = false,
  minDistance = 50,
}: UseSwipeableOptions): SwipeableHandlers {
  // Internal state
  let startX = 0;
  let startY = 0;
  let isMouseDown = false;

  const handleSwipeStart = useCallback((clientX: number, clientY: number) => {
    startX = clientX;
    startY = clientY;
  }, []);

  const handleSwipeEnd = useCallback((e: TouchEvent | MouseEvent | React.TouchEvent | React.MouseEvent, endX: number, endY: number) => {
    const deltaX = endX - startX;
    const deltaY = endY - startY;
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);
    
    if (absX < minDistance && absY < minDistance) {
      return; // Not a swipe
    }
    
    // Determine which direction is the swipe
    if (absX > absY) {
      // Horizontal swipe
      if (deltaX > 0 && onSwipedRight) onSwipedRight(e);
      else if (deltaX < 0 && onSwipedLeft) onSwipedLeft(e);
    } else {
      // Vertical swipe
      if (deltaY > 0 && onSwipedDown) onSwipedDown(e);
      else if (deltaY < 0 && onSwipedUp) onSwipedUp(e);
    }
  }, [onSwipedLeft, onSwipedRight, onSwipedUp, onSwipedDown, minDistance]);

  // Touch event handlers
  const onTouchStart = useCallback((e: TouchEvent | React.TouchEvent) => {
    const touch = e.touches[0];
    handleSwipeStart(touch.clientX, touch.clientY);
  }, [handleSwipeStart]);

  const onTouchMove = useCallback((e: TouchEvent | React.TouchEvent) => {
    if (preventDefaultTouchmoveEvent) e.preventDefault();
  }, [preventDefaultTouchmoveEvent]);

  const onTouchEnd = useCallback((e: TouchEvent | React.TouchEvent) => {
    const touch = e.changedTouches[0];
    handleSwipeEnd(e, touch.clientX, touch.clientY);
  }, [handleSwipeEnd]);

  // Mouse event handlers
  const onMouseDown = useCallback((e: MouseEvent | React.MouseEvent) => {
    if (!trackMouse) return;
    isMouseDown = true;
    handleSwipeStart(e.clientX, e.clientY);
  }, [trackMouse, handleSwipeStart]);

  const onMouseMove = useCallback(() => {
    // Just for compatibility - no action needed
  }, []);

  const onMouseUp = useCallback((e: MouseEvent | React.MouseEvent) => {
    if (!trackMouse || !isMouseDown) return;
    isMouseDown = false;
    handleSwipeEnd(e, e.clientX, e.clientY);
  }, [trackMouse, handleSwipeEnd]);

  const onMouseLeave = useCallback((e: MouseEvent | React.MouseEvent) => {
    if (!trackMouse || !isMouseDown) return;
    isMouseDown = false;
    handleSwipeEnd(e, e.clientX, e.clientY);
  }, [trackMouse, handleSwipeEnd]);

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    onMouseDown,
    onMouseMove,
    onMouseUp,
    onMouseLeave
  };
}
