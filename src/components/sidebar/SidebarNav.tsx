
import React from "react";
import { useLocation } from "react-router-dom";
import { 
  Home, 
  Bell, 
  Mail, 
  User, 
  Users, 
  Settings, 
  FileText, 
  Wallet, 
  Crown,
  Cube 
} from "lucide-react";
import SidebarNavItem from "./SidebarNavItem";

interface SidebarNavProps {
  isLoggedIn: boolean;
}

const SidebarNav = ({ isLoggedIn }: SidebarNavProps) => {
  const location = useLocation();
  
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
      name: "MyCube",
      icon: Cube,
      href: "/mycube",
      requiresAuth: true
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
      name: "Communities",
      icon: Users,
      href: "/communities",
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
      name: "Profile",
      icon: User,
      href: "/profile",
      requiresAuth: true
    },
    {
      name: "Settings",
      icon: Settings,
      href: "/settings",
      requiresAuth: false
    }
  ];

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
      </ul>
    </nav>
  );
};

export default SidebarNav;
