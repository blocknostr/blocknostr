import React from "react";
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
  Gamepad2,
  BookOpen
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
      name: "Games",
      icon: Gamepad2,
      href: "/games",
      requiresAuth: true
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
