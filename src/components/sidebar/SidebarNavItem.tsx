
import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useLocation } from "react-router-dom";
import { LucideIcon } from "lucide-react";

interface SidebarNavItemProps {
  name: string;
  icon: LucideIcon;
  href: string;
  isActive: boolean;
  isPremium?: boolean;
}

const SidebarNavItem = ({ name, icon: Icon, href, isActive, isPremium }: SidebarNavItemProps) => {
  const buttonClassName = cn(
    "w-full justify-start text-left font-medium",
    isActive ? "bg-accent text-accent-foreground" : "",
    isPremium ? "group hover:scale-105 transition-transform duration-200" : ""
  );

  const iconClassName = cn(
    "mr-2 h-5 w-5",
    isPremium ? "text-yellow-400 group-hover:animate-pulse" : ""
  );

  const textClassName = cn(
    isPremium ? "premium-text" : ""
  );

  return (
    <li key={name}>
      <Link to={href}>
        <Button
          variant="ghost"
          className={buttonClassName}
        >
          <Icon className={iconClassName} />
          <span className={textClassName}>{name}</span>
        </Button>
      </Link>
    </li>
  );
};

export default SidebarNavItem;
