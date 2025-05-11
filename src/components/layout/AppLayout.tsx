
import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { useScrollTracking } from "@/hooks/useScrollTracking";
import Sidebar from "@/components/sidebar/Sidebar";
import MobileSidebar from "@/components/MobileSidebar";
import Header from "@/components/Header/Header";
import AppPanelsContainer from "./AppPanelsContainer";

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const { preferences } = useUserPreferences();
  const isMobile = useIsMobile();
  const isScrolled = useScrollTracking();
  const [leftPanelOpen, setLeftPanelOpen] = useState(false);
  
  const showRightPanel = preferences.uiPreferences.showTrending;

  return (
    <div className={cn(
      "flex min-h-screen bg-background relative",
      preferences.uiPreferences.compactMode ? "text-sm" : ""
    )}>
      {/* Desktop sidebar - only visible on non-mobile */}
      {!isMobile && <Sidebar />}
      
      {/* Mobile sidebar - shown based on state */}
      <MobileSidebar isOpen={leftPanelOpen} onOpenChange={setLeftPanelOpen} />
      
      <div 
        className={cn(
          "flex-1 transition-all ios-spring duration-300 flex flex-col",
          !isMobile && "ml-64",
          "rubber-scroll overflow-fix" // iOS optimizations
        )}
      >
        {/* Application header */}
        <Header toggleSidebar={() => setLeftPanelOpen(!leftPanelOpen)} />
        
        {/* Main content with panels */}
        <AppPanelsContainer
          leftPanelOpen={leftPanelOpen}
          setLeftPanelOpen={setLeftPanelOpen}
          showRightPanel={showRightPanel}
        >
          {children}
        </AppPanelsContainer>
      </div>
    </div>
  );
};

export default AppLayout;
