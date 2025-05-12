
import React, { ReactNode } from "react";
import { cn } from "@/lib/utils";
import MobileNavigationHandler from "./MobileNavigationHandler";

interface AppContentProps {
  children: ReactNode;
  isMobile: boolean;
  leftPanelOpen: boolean;
  rightPanelOpen: boolean;
  setLeftPanelOpen: (open: boolean) => void;
  setRightPanelOpen: (open: boolean) => void;
}

const AppContent: React.FC<AppContentProps> = ({
  children,
  isMobile,
  leftPanelOpen,
  rightPanelOpen,
  setLeftPanelOpen,
  setRightPanelOpen
}) => {
  // Close panels when clicking on main content (mobile only)
  const handleMainContentClick = () => {
    if (isMobile) {
      setLeftPanelOpen(false);
      setRightPanelOpen(false);
    }
  };

  return (
    <MobileNavigationHandler
      isMobile={isMobile}
      rightPanelOpen={rightPanelOpen}
      leftPanelOpen={leftPanelOpen}
      setRightPanelOpen={setRightPanelOpen}
      setLeftPanelOpen={setLeftPanelOpen}
      handleMainContentClick={handleMainContentClick}
    >
      {/* Main content area */}
      <div className="flex-1 pb-safe-bottom">
        {children}
      </div>
    </MobileNavigationHandler>
  );
};

export default AppContent;
