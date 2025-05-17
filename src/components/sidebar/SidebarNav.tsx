import React, { useState } from "react";
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
  Gamepad,
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
  const [showCreateNoteModal, setShowCreateNoteModal] = useState(false);

  // You may need to define profileUrl or replace it with a valid value
  const profileUrl = "/profile";

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
      name: "Games",
      icon: Gamepad,
      href: "/games",
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
          const isActive = location.pathname === item.href;
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
