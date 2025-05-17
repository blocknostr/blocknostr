import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { 
  Home, 
  Bell, 
  Mail, 
  Users, 
  Settings, 
  FileText, 
  Wallet, 
  Crown,
  BookOpen,
  UserRound,
  MessageSquarePlus
} from "lucide-react";
import SidebarNavItem from "./SidebarNavItem";
import { nostrService } from "@/lib/nostr";
import CreateNoteModal from "@/components/note/CreateNoteModal";

interface SidebarNavProps {
  isLoggedIn: boolean;
}

const SidebarNav = ({ isLoggedIn }: SidebarNavProps) => {
  const location = useLocation();
  const [profileUrl, setProfileUrl] = useState("/profile");
  const [showCreateNoteModal, setShowCreateNoteModal] = useState(false);
  
  // Update profile URL when auth state changes
  useEffect(() => {
    if (isLoggedIn && nostrService.publicKey) {
      try {
        const npub = nostrService.getNpubFromHex(nostrService.publicKey);
        setProfileUrl(`/profile/${npub}`);
      } catch (error) {
        console.error("Failed to convert pubkey to npub:", error);
      }
    } else {
      setProfileUrl("/profile");
    }
  }, [isLoggedIn]);
  
  const navItems = [
    {
      name: "Home",
      icon: Home,
      href: "/",
      requiresAuth: false
    },
    {
      name: "Wallets",
      icon: Wallet,
      href: "/wallets",
      requiresAuth: true
    },
    {
      name: "Profile",
      icon: UserRound,
      href: profileUrl,
      requiresAuth: false
    },
    {
      name: "Notifications",
      icon: Bell,
      href: "/notifications",
      requiresAuth: true
    },
    {
      name: "BlockMail",
      icon: Mail,
      href: "/messages",
      requiresAuth: true
    },
    {
      name: "DAOs",
      icon: Users,
      href: "/dao",
      requiresAuth: false
    },
    {
      name: "Articles",
      icon: BookOpen,
      href: "/articles",
      requiresAuth: false
    },
    {
      name: "Notebin",
      icon: FileText,
      href: "/notebin",
      requiresAuth: false
    },
    {
      name: "Premium",
      icon: Crown,
      href: "/premium",
      requiresAuth: false
    },
    {
      name: "Settings",
      icon: Settings,
      href: "/settings",
      requiresAuth: false
    }
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
      />
    );
  };

  return (
    <nav className="flex-1">
      <ul className="space-y-2">
        {navItems.map((item) => {
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
