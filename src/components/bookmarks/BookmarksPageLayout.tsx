
import React, { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface BookmarksPageLayoutProps {
  preferences: any;
  isMobile: boolean;
  swipeHandlers: any;
  handleMainContentClick: () => void;
  children: ReactNode;
}

const BookmarksPageLayout: React.FC<BookmarksPageLayoutProps> = ({
  preferences,
  isMobile,
  swipeHandlers,
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
      >
        {children}
      </div>
    </div>
  );
};

export default BookmarksPageLayout;
