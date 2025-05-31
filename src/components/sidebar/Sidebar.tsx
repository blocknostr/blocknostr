import * as React from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/ui/use-mobile";
import SidebarNav from "./SidebarNav";
import { useAuth } from "@/hooks/useAuth";
import ProfileButton from "@/components/LoginButton";
import HeaderRelayStatus from "@/components/Header/HeaderRelayStatus";

interface SidebarProps {
  isMobile?: boolean;
  isCollapsed?: boolean;
  className?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  isMobile: isMobileProp, 
  isCollapsed = false, 
  className 
}) => {
  // Use provided prop or fallback to hook for backward compatibility
  const isMobileHook = useIsMobile();
  const isMobile = isMobileProp ?? isMobileHook;
  const { isLoggedIn } = useAuth();
  
  return (
    <aside
      className={cn(
        "border-r h-full py-4 bg-background transition-all duration-200 flex flex-col",
        // Responsive width handling
        isMobile ? "w-full" : isCollapsed ? "w-16" : "w-64",
        // Responsive positioning
        isMobile ? "relative" : "fixed left-0 top-0 hidden md:block",
        // Custom responsive className from layout config
        className
      )}
    >
      <div className="flex flex-col h-full px-4">
        {/* Theme-aware, thick wordmark with subtle white glow */}
        <div className={cn(
          "mb-6 flex items-center justify-center",
          // Hide wordmark when collapsed on desktop
          isCollapsed && !isMobile && "hidden"
        )}>
          <Link
            to="/"
            className={cn(
              "text-3xl",                   // larger size
              "font-extrabold",             // heavy weight
              "tracking-tight",             // tight kerning
              "hover:opacity-80 transition-opacity",
              // subtle white glow
              "filter drop-shadow-[0_0_4px_rgba(255,255,255,0.4)]",
              // text color: black in light, white in dark
              "text-black dark:text-white",
              // Responsive text sizing
              isMobile ? "text-2xl" : "text-3xl"
            )}
          >
            {isCollapsed && !isMobile ? "BN" : "BlockNostr"}
          </Link>
        </div>
        
        {/* Navigation - flex-1 to push status section to bottom */}
        <div className="flex-1">
          <SidebarNav 
            isLoggedIn={isLoggedIn} 
            isCollapsed={isCollapsed}
            isMobile={isMobile}
          />
        </div>
        
        {/* Status Section - Lower left corner */}
        {!isMobile && (
          <div className="mt-auto pt-4 border-t border-border/50 space-y-3">
            {/* Relay Status */}
            <div className="flex justify-center">
              <HeaderRelayStatus />
            </div>
            
            {/* Profile Button */}
            <div className="flex justify-center">
              <ProfileButton 
                size="sm"
                showText={!isCollapsed}
                className={cn(
                  "transition-all duration-200",
                  isCollapsed ? "w-8 h-8 p-0" : "w-full"
                )}
              />
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;

