
import React, { ReactNode } from "react";
import { cn } from "@/lib/utils";

// Define the expected type for swipeHandlers
interface SwipeHandlers {
  onTouchStart: React.TouchEventHandler;
  onTouchMove: React.TouchEventHandler;
  onTouchEnd: React.TouchEventHandler;
  onMouseDown?: React.MouseEventHandler;
  onMouseMove?: React.MouseEventHandler;
  onMouseUp?: React.MouseEventHandler;
}

interface BookmarksPageLayoutProps {
  preferences: any;
  isMobile: boolean;
  swipeHandlers: SwipeHandlers;
  handleMainContentClick: () => void;
  children: ReactNode;
}

const BookmarksPageLayout: React.FC<BookmarksPageLayoutProps> = ({
  preferences,
  isMobile,
  swipeHandlers,
  handleMainContentClick,
  children
}) => {
  return (
    <div className={cn(
      "flex min-h-screen bg-background relative",
      preferences.uiPreferences.compactMode ? "text-sm" : ""
    )}
    {...swipeHandlers}>
      <div 
        className={cn(
          "flex-1 transition-all duration-200",
          !isMobile && "ml-64"
        )}
        onClick={handleMainContentClick}
      >
        {children}
      </div>
    </div>
  );
};

export default BookmarksPageLayout;
