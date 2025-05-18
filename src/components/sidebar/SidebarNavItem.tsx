
import React from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface SidebarNavItemProps {
  name: string;
  icon: LucideIcon;
  href: string;
  isActive?: boolean;
  special?: boolean;
  onClick?: () => void;
}

const SidebarNavItem = ({ 
  name, 
  icon: Icon, 
  href, 
  isActive = false,
  special = false,
  onClick
}: SidebarNavItemProps) => {
  const Component = onClick ? 'button' : Link;
  const componentProps = onClick ? { onClick } : { to: href };
  
  return (
    <li>
      <Component
        {...componentProps}
        className={cn(
          "flex items-center px-3 py-2 rounded-md transition-colors w-full",
          isActive 
            ? "bg-primary text-primary-foreground font-medium" 
            : "text-foreground hover:bg-muted hover:text-foreground",
          special && "bg-primary text-primary-foreground hover:bg-primary/90"
        )}
      >
        <Icon className="h-5 w-5 mr-2" />
        <span>{name}</span>
      </Component>
    </li>
  );
};

export default SidebarNavItem;
