import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip";

interface SidebarNavItemProps {
  name: string;
  icon: LucideIcon;
  href: string;
  isActive: boolean;
  onClick?: () => void;
  special?: boolean;
  isCollapsed?: boolean;
  isMobile?: boolean;
}

const SidebarNavItem = ({ 
  name, 
  icon: Icon, 
  href, 
  isActive, 
  onClick,
  special,
  isCollapsed = false,
  isMobile = false
}: SidebarNavItemProps) => {
  
  const buttonContent = (
    <Button
      variant="ghost"
      className={cn(
        "w-full justify-start text-left font-medium transition-all duration-200",
        isActive ? "bg-accent text-accent-foreground" : "",
        special ? "bg-primary text-primary-foreground hover:bg-primary/90" : "",
        // Responsive sizing
        isCollapsed && !isMobile ? "justify-center px-2" : "justify-start",
        isMobile ? "text-mobile-base" : isCollapsed ? "text-sm" : "text-base"
      )}
      onClick={onClick}
      size={isCollapsed && !isMobile ? "sm" : "default"}
    >
      <Icon className={cn(
        "h-5 w-5 transition-all duration-200",
        isCollapsed && !isMobile ? "mr-0" : "mr-2",
        // Responsive icon sizing
        isMobile ? "h-4 w-4" : "h-5 w-5"
      )} />
      {/* Hide text when collapsed on desktop, always show on mobile */}
      {(!isCollapsed || isMobile) && (
        <span className="truncate">{name}</span>
      )}
    </Button>
  );

  // Wrap collapsed desktop items in tooltip
  const wrappedContent = (isCollapsed && !isMobile) ? (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {buttonContent}
        </TooltipTrigger>
        <TooltipContent side="right">
          <p>{name}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  ) : buttonContent;
  
  // If there's an onClick handler or it's a special button, don't wrap in Link
  if (onClick || href === "#") {
    return <li key={name}>{wrappedContent}</li>;
  }
  
  // Otherwise wrap in Link for normal navigation
  return (
    <li key={name}>
      <Link to={href}>
        {wrappedContent}
      </Link>
    </li>
  );
};

export default SidebarNavItem;

