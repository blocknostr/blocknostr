
import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface SidebarNavItemProps {
  name: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  href: string;
  isActive: boolean;
  onClick?: () => void;
  special?: boolean;
}

const SidebarNavItem = ({
  name,
  icon: Icon,
  href,
  isActive,
  onClick,
  special
}: SidebarNavItemProps) => {
  const content = (
    <Button
      variant="ghost"
      className={cn(
        "w-full justify-start text-left font-medium",
        isActive ? "bg-accent text-accent-foreground" : "",
        special ? "bg-primary text-primary-foreground hover:bg-primary/90" : ""
      )}
      onClick={onClick}
    >
      <Icon className="mr-2 h-5 w-5" />
      {name}
    </Button>
  );

  // If there's an onClick handler or it's a special button, don't wrap in Link
  if (onClick || href === "#") {
    return <li key={name}>{content}</li>;
  }

  // Otherwise wrap in Link for normal navigation
  return (
    <li key={name}>
      <Link to={href}>
        {content}
      </Link>
    </li>
  );
};

export default SidebarNavItem;
