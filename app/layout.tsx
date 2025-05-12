
'use client';

import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useSwipeable } from "@/hooks/use-swipeable";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { useIsMobile } from "@/hooks/use-mobile";
import { useHapticFeedback } from "@/hooks/use-haptic-feedback";
import { NavigationProvider } from "@/contexts/NavigationContext";
import { RightSidebarProvider } from "@/contexts/RightSidebarContext";
import Sidebar from "@/components/Sidebar";
import RightSidebar from "@/components/home/RightSidebar";
import MobileSidebar from "@/components/MobileSidebar";
import PageHeader from "@/components/navigation/PageHeader";
import PageBreadcrumbs from "@/components/navigation/PageBreadcrumbs";
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
  const { triggerHaptic } = useHapticFeedback();
  const [leftPanelOpen, setLeftPanelOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

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

  return (
    <html lang="en">
      <body className={cn("font-sans dark min-h-screen", preferences?.uiPreferences?.compactMode ? "text-sm" : "")}>
        <NavigationProvider>
          <RightSidebarProvider>
            <div className="flex min-h-screen bg-background relative">
              {/* Desktop sidebar - only visible on non-mobile */}
              {!isMobile && <Sidebar />}
              
              {/* Mobile sidebar - shown based on state */}
              <MobileSidebar isOpen={leftPanelOpen} onOpenChange={setLeftPanelOpen} />
              
              <div className={cn(
                "flex-1 transition-all ios-spring duration-300 flex flex-col",
                !isMobile && "ml-64",
                "rubber-scroll overflow-fix" // iOS optimizations
              )}>
                {children}
              </div>
            </div>
            <Toaster position="bottom-right" closeButton />
          </RightSidebarProvider>
        </NavigationProvider>
      </body>
    </html>
  );
}
