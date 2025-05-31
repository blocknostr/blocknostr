import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { 
  Home, 
  Bell, 
  Users, 
  Settings, 
  FileText, 
  Wallet, 
  Crown,
  MessageSquarePlus,
  User,
  Gamepad2
} from "lucide-react";
import SidebarNavItem from "./SidebarNavItem";
import { nostrService } from "@/lib/nostr";
import CreateNoteModal from "@/components/note/CreateNoteModal";

interface SidebarNavProps {
  isLoggedIn: boolean;
  isCollapsed?: boolean;
  isMobile?: boolean;
}

const SidebarNav = ({ isLoggedIn, isCollapsed = false, isMobile = false }: SidebarNavProps) => {
  const location = useLocation();
  const [showCreateNoteModal, setShowCreateNoteModal] = useState(false);
  
  const navigationItems = [
    {
      name: "Home",
      icon: Home,
      href: "/",
      requiresAuth: false,
    },
    {
      name: "Notifications",
      icon: Bell,
      href: "/notifications",
      requiresAuth: true,
    },
    {
      name: "Wallet",
      icon: Wallet,
      href: "/wallets",
      requiresAuth: false,
    },
    {
      name: "My Communities",
      icon: Users,
      href: "/my-communities",
      requiresAuth: false,
    },
    {
      name: "Articles",
      icon: FileText,
      href: "/articles",
      requiresAuth: false,
    },
    {
      name: "Premium",
      icon: Crown,
      href: "/premium",
      requiresAuth: false,
    },
    {
      name: "Games",
      icon: Gamepad2,
      href: "/games",
      requiresAuth: false,
    },
    {
      name: "Profile",
      icon: User,
      href: "/profile",
      requiresAuth: true,
    },
    {
      name: "Settings",
      icon: Settings,
      href: "/settings",
      requiresAuth: false,
    },
  ];

  // Create a separate component for the CreateNote button
  const CreateNoteButton = () => {
    if (!isLoggedIn) return null;
    
    return (
      <SidebarNavItem
        key="create-note"
        name="Create Note"
        icon={MessageSquarePlus}
        href="#"
        isActive={false}
        onClick={() => setShowCreateNoteModal(true)}
        special={true}
        isCollapsed={isCollapsed}
        isMobile={isMobile}
      />
    );
  };

  return (
    <nav className="flex-1">
      <ul className={`space-y-2 ${isCollapsed && !isMobile ? 'space-y-1' : 'space-y-2'}`}>
        {navigationItems.map((item) => {
          if (item.requiresAuth && !isLoggedIn) {
            return null;
          }
          
          // Check if current path starts with the nav item's href
          const isActive = item.href !== "/" ? 
            location.pathname.startsWith(item.href) : 
            location.pathname === "/";
          
          return (
            <SidebarNavItem
              key={item.name}
              name={item.name}
              icon={item.icon}
              href={item.href}
              isActive={isActive}
              isCollapsed={isCollapsed}
              isMobile={isMobile}
            />
          );
        })}
        
        {/* Add the Create Note button below Settings */}
        <CreateNoteButton />
      </ul>
      
      {/* Create Note Modal */}
      {showCreateNoteModal && (
        <CreateNoteModal 
          open={showCreateNoteModal}
          onOpenChange={setShowCreateNoteModal}
        />
      )}
    </nav>
  );
};

export default SidebarNav;


