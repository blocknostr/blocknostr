
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
  badge?: string; // Adding optional badge prop
}

const SidebarNavItem = ({ name, icon: Icon, href, isActive, badge }: SidebarNavItemProps) => {
  return (
    <li key={name}>
      <Link to={href}>
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start text-left font-medium",
            isActive ? "bg-accent text-accent-foreground" : ""
          )}
        >
          <Icon className="mr-2 h-5 w-5" />
          {name}
          {badge && (
            <span className="ml-auto rounded bg-primary/10 px-1.5 py-0.5 text-xs font-medium text-primary">
              {badge}
            </span>
          )}
        </Button>
      </Link>
    </li>
  );
};

export default SidebarNavItem;
