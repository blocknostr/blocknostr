
import React from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import SidebarNav from "./SidebarNav";
import SidebarUserProfile from "./SidebarUserProfile";
import { useSidebarProfile } from "./useSidebarProfile";
import { motion } from "framer-motion";

const Sidebar = () => {
  const isMobile = useIsMobile();
  const { isLoggedIn, userProfile, isLoading } = useSidebarProfile();
  
  return (
    <aside className={cn(
      "border-r h-full py-6 bg-background",
      isMobile ? "w-full" : "w-64 fixed left-0 top-0 hidden md:block"
    )}>
      <div className="flex flex-col h-full px-4">
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="mb-8"
        >
          <Link to="/" className="text-2xl font-bold text-primary hover:opacity-80 transition-opacity tracking-tight">
            BlockNoster
          </Link>
          <div className="text-xs text-muted-foreground mt-1">Decentralized social on Alephium</div>
        </motion.div>
        
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
