
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface SidebarNavItemProps {
  icon?: LucideIcon;
  text: string;
  to?: string;
  onClick?: () => void;
  active?: boolean;
  badge?: React.ReactNode;
}

export function SidebarNavItem({
  icon: Icon,
  text,
  to,
  onClick,
  active,
  badge
}: SidebarNavItemProps) {
  const commonClasses = cn(
    "flex w-full items-center gap-2 justify-start rounded-lg px-3 py-2 hover:bg-accent transition-colors",
    active && "bg-primary/10 text-primary"
  );
  
  const content = (
    <>
      {Icon && <Icon className="h-5 w-5 shrink-0" />}
      <span className="grow text-sm font-medium">{text}</span>
      {badge}
    </>
  );
  
  if (onClick) {
    return (
      <Button 
        variant="ghost" 
        className={commonClasses} 
        onClick={onClick}
        asChild={false}
      >
        {content}
      </Button>
    );
  }
  
  if (to) {
    return (
      <Button 
        variant="ghost" 
        asChild 
        className={commonClasses}
      >
        <Link to={to}>{content}</Link>
      </Button>
    );
  }
  
  return null;
}
