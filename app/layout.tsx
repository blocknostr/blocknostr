
'use client';

import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { useIsMobile } from "@/hooks/use-mobile";
import { NavigationProvider } from "@/contexts/NavigationContext";
import { RightSidebarProvider } from "@/contexts/RightSidebarContext";
import SidebarSection from "@/components/layout/SidebarSection";
import FloatingLoginButton from "@/components/auth/FloatingLoginButton";
import { Toaster } from "sonner";
import "../src/index.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { preferences } = useUserPreferences();
  const isMobile = useIsMobile();
  const [leftPanelOpen, setLeftPanelOpen] = useState(false);
  const [rightPanelOpen, setRightPanelOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeHashtag, setActiveHashtag] = useState<string | undefined>(undefined);

  // Track scroll position for iOS style header behavior
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const clearHashtag = () => setActiveHashtag(undefined);
  const showTrending = preferences?.uiPreferences?.showTrending || false;

  return (
    <html lang="en">
      <body className={cn("font-sans dark min-h-screen", preferences?.uiPreferences?.compactMode ? "text-sm" : "")}>
        <NavigationProvider>
          <RightSidebarProvider>
            <div className="flex min-h-screen bg-background relative">
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
              
              <div className={cn(
                "flex-1 transition-all ios-spring duration-300 flex flex-col",
                !isMobile && "ml-64",
                "rubber-scroll overflow-fix" // iOS optimizations
              )}>
                {children}
              </div>
            </div>
            <Toaster position="bottom-right" closeButton />
            <FloatingLoginButton />
          </RightSidebarProvider>
        </NavigationProvider>
      </body>
    </html>
  );
}
