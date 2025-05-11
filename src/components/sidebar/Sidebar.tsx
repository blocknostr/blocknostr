
import React from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import SidebarNav from "./SidebarNav";
import SidebarUserProfile from "./SidebarUserProfile";
import { useSidebarProfile } from "./useSidebarProfile";

const Sidebar = () => {
  const isMobile = useIsMobile();
  const { isLoggedIn, userProfile, isLoading } = useSidebarProfile();
  
  return (
    <aside className={cn(
      "border-r h-full py-4 bg-background",
      isMobile ? "w-full" : "w-64 fixed left-0 top-0 hidden md:block"
    )}>
      <div className="flex flex-col h-full px-4">
        <div className="mb-6">
          <Link to="/" className="text-2xl font-bold text-primary hover:opacity-80 transition-opacity">
            BlockNostr
          </Link>
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
