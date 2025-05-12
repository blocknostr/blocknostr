
import React from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useHapticFeedback } from '@/hooks/use-haptic-feedback';
import { useLocation } from '@/lib/next-app-router-shim';

interface SidebarNavItemProps {
  icon: React.ElementType;
  label: string;
  path: string;
  active?: boolean;
  badge?: number;
  onClick?: () => void;
  disabled?: boolean;
  newFeature?: boolean;
}

const SidebarNavItem: React.FC<SidebarNavItemProps> = ({
  icon: Icon,
  label,
  path,
  active,
  badge,
  onClick,
  disabled = false,
  newFeature = false
}) => {
  const { triggerHaptic } = useHapticFeedback();
  const location = useLocation();
  
  // Check if this item is active based on current path
  const isActive = active || location.pathname === path || 
                  (path !== '/' && location.pathname.startsWith(path));
  
  const handleClick = () => {
    triggerHaptic('light');
    if (onClick) onClick();
  };
  
  return (
    <Link
      to={disabled ? '#' : path}
      onClick={handleClick}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sidebar-foreground relative",
        isActive 
          ? "bg-sidebar-primary/20 text-sidebar-primary font-medium" 
          : "hover:bg-sidebar-accent/10",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      <div className="flex-shrink-0">
        <Icon className={cn(
          "h-5 w-5",
          isActive ? "text-sidebar-primary" : "text-sidebar-foreground"
        )} />
      </div>
      
      <span className="flex-1 truncate">{label}</span>
      
      {badge !== undefined && badge > 0 && (
        <span className="bg-sidebar-primary text-sidebar-primary-foreground text-xs rounded-full px-2 py-0.5 font-medium">
          {badge > 99 ? '99+' : badge}
        </span>
      )}
      
      {newFeature && (
        <span className="absolute -top-1 -right-1 bg-green-500 text-white text-[10px] rounded-full px-1.5 py-0.5 font-bold">
          NEW
        </span>
      )}
    </Link>
  );
};

export default SidebarNavItem;
