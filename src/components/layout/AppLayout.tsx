
import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { useIsMobile } from "@/hooks/use-mobile";
import { useRightSidebar } from "@/contexts/RightSidebarContext";
import HeaderSection from "./HeaderSection";
import SidebarSection from "./SidebarSection";
import AppContent from "./AppContent";
import FloatingLoginButton from "@/components/auth/FloatingLoginButton";

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const { preferences } = useUserPreferences();
  const isMobile = useIsMobile();
  const { 
    activeHashtag, 
    rightPanelOpen, 
    setRightPanelOpen,
    setActiveHashtag,
    clearHashtag 
  } = useRightSidebar();
  
  const [leftPanelOpen, setLeftPanelOpen] = useState(false);
  const showTrending = preferences?.uiPreferences?.showTrending || false;
  const isCompactMode = preferences?.uiPreferences?.compactMode || false;

  return (
    <div className={cn(
      "flex min-h-screen bg-background relative",
      isCompactMode ? "text-sm" : ""
    )}>
      <SidebarSection 
        isMobile={isMobile}
        leftPanelOpen={leftPanelOpen}
        rightPanelOpen={rightPanelOpen}
        activeHashtag={activeHashtag}
        setLeftPanelOpen={setLeftPanelOpen}
        setRightPanelOpen={setRightPanelOpen}
        clearHashtag={clearHashtag}
        showTrending={showTrending}
      />
      
      <div 
        className={cn(
          "flex-1 transition-all ios-spring duration-300 flex flex-col",
          !isMobile && "ml-64",
          "rubber-scroll overflow-fix" // iOS optimizations
        )}
      >
        {/* iOS-friendly Page Header with dynamic shadow based on scroll */}
        <HeaderSection 
          isMobile={isMobile} 
          setLeftPanelOpen={setLeftPanelOpen}
        />
        
        <AppContent
          isMobile={isMobile}
          leftPanelOpen={leftPanelOpen}
          rightPanelOpen={rightPanelOpen}
          setLeftPanelOpen={setLeftPanelOpen}
          setRightPanelOpen={setRightPanelOpen}
        >
          {children}
        </AppContent>
      </div>
      
      {/* Add floating login button */}
      <FloatingLoginButton />
    </div>
  );
};

export default AppLayout;
