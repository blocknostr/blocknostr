
import React from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import SidebarNav from "./SidebarNav";
import SidebarUserProfile from "./SidebarUserProfile";
import { useSidebarProfile } from "./useSidebarProfile";
import { Lightbulb } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";
import { Button } from "@/components/ui/button";

const Sidebar = () => {
  const isMobile = useIsMobile();
  const { isLoggedIn, userProfile, isLoading } = useSidebarProfile();
  const { darkMode, toggleDarkMode } = useTheme();
  
  return (
    <aside className={cn(
      "h-full py-4 bg-sidebar border-r border-sidebar-border",
      isMobile ? "w-full" : "w-64 fixed left-0 top-0 hidden md:block"
    )}>
      <div className="flex flex-col h-full px-4">
        <div className="mb-6 flex items-center justify-between">
          <Link to="/" className="text-2xl font-bold bn-gradient-text hover:opacity-90 transition-opacity">
            BlockNostr
          </Link>
          
          <Button 
            variant="ghost"
            size="icon"
            className="rounded-full theme-toggle-button text-sidebar-foreground"
            onClick={(e) => toggleDarkMode(e)}
            aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
            title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
          >
            <Lightbulb className={darkMode ? "h-5 w-5" : "h-5 w-5 text-yellow-500 fill-yellow-500"} />
          </Button>
        </div>
        
        <SidebarNav isLoggedIn={isLoggedIn} />
        
        <div className="mt-auto pt-4 space-y-2">
          {isLoggedIn && (
            <SidebarUserProfile userProfile={userProfile} isLoading={isLoading} />
          )}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
