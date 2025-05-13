
import React from "react";
import { 
  Sidebar as ShadcnSidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarProvider,
  SidebarTrigger 
} from "@/components/ui/sidebar";
import SidebarNav from "./SidebarNav";
import SidebarUserProfile from "./SidebarUserProfile";
import { useSidebarProfile } from "./useSidebarProfile";

const Sidebar = () => {
  const { userProfile, isLoading, isLoggedIn, onRetry } = useSidebarProfile();

  return (
    <SidebarProvider defaultOpen={true}>
      <ShadcnSidebar>
        <SidebarHeader>
          <div className="flex items-center justify-between px-3 py-2">
            <h2 className="text-lg font-semibold">BlockNoster</h2>
            <SidebarTrigger />
          </div>
        </SidebarHeader>
        
        <SidebarContent>
          <SidebarNav isLoggedIn={isLoggedIn} />
        </SidebarContent>
        
        <SidebarFooter>
          {isLoggedIn && (
            <SidebarUserProfile 
              userProfile={userProfile} 
              isLoading={isLoading}
              onRetry={onRetry}
            />
          )}
        </SidebarFooter>
      </ShadcnSidebar>
    </SidebarProvider>
  );
};

export default Sidebar;
