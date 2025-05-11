
import React, { createContext, useState, useContext, ReactNode } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

interface RightSidebarContextProps {
  activeHashtag?: string;
  rightPanelOpen: boolean;
  setRightPanelOpen: (open: boolean) => void;
  setActiveHashtag: (hashtag?: string) => void;
  clearHashtag: () => void;
}

const RightSidebarContext = createContext<RightSidebarContextProps | undefined>(undefined);

export const useRightSidebar = () => {
  const context = useContext(RightSidebarContext);
  if (context === undefined) {
    throw new Error("useRightSidebar must be used within a RightSidebarProvider");
  }
  return context;
};

interface RightSidebarProviderProps {
  children: ReactNode;
}

export const RightSidebarProvider: React.FC<RightSidebarProviderProps> = ({ children }) => {
  const [activeHashtag, setActiveHashtag] = useState<string | undefined>(undefined);
  const [rightPanelOpen, setRightPanelOpen] = useState(false);
  const isMobile = useIsMobile();

  // Initialize panel state based on device
  React.useEffect(() => {
    // Only auto-open on desktop
    if (!isMobile) {
      setRightPanelOpen(true);
    }
  }, [isMobile]);

  // Listen for hashtag setting events
  React.useEffect(() => {
    const handleSetHashtag = (e: CustomEvent) => {
      setActiveHashtag(e.detail);
    };

    window.addEventListener('set-hashtag', handleSetHashtag as EventListener);
    
    return () => {
      window.removeEventListener('set-hashtag', handleSetHashtag as EventListener);
    };
  }, []);

  const clearHashtag = () => setActiveHashtag(undefined);

  const value = {
    activeHashtag,
    rightPanelOpen,
    setRightPanelOpen,
    setActiveHashtag,
    clearHashtag
  };

  return (
    <RightSidebarContext.Provider value={value}>
      {children}
    </RightSidebarContext.Provider>
  );
};
