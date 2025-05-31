import React from "react";
import { Link } from "react-router-dom";
import { Lightbulb, Lock, Menu, UserPlus, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import BackButton from "@/components/navigation/BackButton";
import { useTheme } from "@/hooks/ui/use-theme";
import { useIsMobile } from "@/hooks/ui/use-mobile";
import { useAuth } from "@/hooks/useAuth";

export interface UnifiedPageHeaderProps {
  // Basic header props
  title?: string;
  subtitle?: string;
  description?: string;
  icon?: React.ReactNode;
  
  // Navigation
  showBackButton?: boolean;
  backPath?: string;
  backLabel?: string;
  breadcrumbs?: Array<{ label: string; path: string; isCurrentPage?: boolean }>;
  
  // Layout and styling
  variant?: 'page' | 'global' | 'sticky' | 'compact';
  className?: string;
  sticky?: boolean;
  transparent?: boolean;
  
  // Theme and display
  showThemeToggle?: boolean;
  darkMode?: boolean;
  
  // Content and actions
  leftContent?: React.ReactNode;
  rightContent?: React.ReactNode;
  children?: React.ReactNode;
  
  // Special features
  isPrivate?: boolean;
  showJoinButton?: boolean;
  joinButtonText?: string;
  onJoinClick?: () => void;
  
  // Mobile
  showMobileMenu?: boolean;
  onToggleMobileMenu?: () => void;
  leftPanelOpen?: boolean;
  setLeftPanelOpen?: (open: boolean) => void;
  rightPanelOpen?: boolean;
  setRightPanelOpen?: (open: boolean) => void;
  
  // Active state (for hashtags, etc.)
  activeTag?: string;
  onClearTag?: () => void;
}

/**
 * Unified Page Header - Consolidates all header components
 * 
 * Replaces:
 * - PageHeader.tsx (basic page header)
 * - GlobalHeader.tsx (global app header)
 * - NotificationsHeader.tsx (notifications page header)
 * - NotebinHeader.tsx (notebin page header)
 * - DAOPageHeader.tsx (DAO page header)
 * - CommunityPageHeader.tsx (community page header)
 * - Header.tsx (main app header)
 * - ui/page-header.tsx (UI page header)
 * 
 * Features:
 * - Multiple layout variants (page, global, sticky, compact)
 * - Flexible content areas (left, right, children)
 * - Navigation support (back button, breadcrumbs)
 * - Theme toggle integration
 * - Mobile menu support
 * - Authentication status
 * - Relay status indicator
 * - Join/action buttons
 * - Privacy indicators
 * - Active tag display with clear option
 */
const UnifiedPageHeader: React.FC<UnifiedPageHeaderProps> = ({
  title,
  subtitle,
  description,
  icon,
  
  showBackButton = false,
  backPath,
  backLabel,
  breadcrumbs,
  
  variant = 'page',
  className = "",
  sticky = false,
  transparent = false,
  
  showThemeToggle = true,
  darkMode,
  
  leftContent,
  rightContent,
  children,
  
  isPrivate = false,
  showJoinButton = false,
  joinButtonText = "Join",
  onJoinClick,
  
  showMobileMenu = false,
  onToggleMobileMenu,
  leftPanelOpen,
  setLeftPanelOpen,
  rightPanelOpen,
  setRightPanelOpen,
  
  activeTag,
  onClearTag
}) => {
  const { darkMode: themeDarkMode, toggleDarkMode } = useTheme();
  const isMobile = useIsMobile();
  const { isLoggedIn } = useAuth();

  // Determine display title - use activeTag if present
  const displayTitle = activeTag ? `#${activeTag}` : title;

  // Base classes for different variants
  const variantClasses = {
    page: "flex items-center justify-between mb-6",
    global: "sticky top-0 bg-transparent backdrop-blur-sm z-10 h-14",
    sticky: "sticky top-0 z-10 bg-background/95 backdrop-blur h-16 border-b",
    compact: "flex items-center justify-between py-4 px-4"
  };

  // Container classes
  const containerClasses = cn(
    variantClasses[variant],
    {
      "bg-transparent backdrop-blur-sm": transparent,
      "border-b": variant === 'global' || variant === 'sticky'
    },
    className
  );

  // Title size based on variant
  const titleSize = {
    page: "text-2xl font-bold",
    global: "font-semibold",
    sticky: "text-lg font-bold",
    compact: "text-xl font-semibold"
  };

  // Render breadcrumbs if provided
  const renderBreadcrumbs = () => {
    if (!breadcrumbs || breadcrumbs.length === 0) return null;
    
    return (
      <div className="flex items-center text-sm text-muted-foreground">
        <Link to="/" className="hover:text-primary transition-colors">Home</Link>
        {breadcrumbs.map((crumb, index) => (
          <React.Fragment key={crumb.path}>
            <ChevronRight className="h-4 w-4 mx-1" />
            {crumb.isCurrentPage ? (
              <span className="text-foreground font-medium">{crumb.label}</span>
            ) : (
              <Link to={crumb.path} className="hover:text-primary transition-colors">
                {crumb.label}
              </Link>
            )}
          </React.Fragment>
        ))}
      </div>
    );
  };

  // Render theme toggle button
  const renderThemeToggle = () => {
    if (!showThemeToggle) return null;
    
    return (
      <Button 
        variant="ghost"
        size="icon"
        className="rounded-full"
        onClick={(e) => toggleDarkMode(e)}
        aria-label={themeDarkMode ? "Switch to light mode" : "Switch to dark mode"}
        title={themeDarkMode ? "Switch to light mode" : "Switch to dark mode"}
      >
        <Lightbulb className={themeDarkMode ? "h-5 w-5" : "h-5 w-5 text-yellow-500 fill-yellow-500"} />
      </Button>
    );
  };

  // Render mobile menu button
  const renderMobileMenu = () => {
    if (!showMobileMenu || !isMobile || !onToggleMobileMenu) return null;
    
    return (
      <Button 
        variant="ghost" 
        size="icon" 
        className="mr-2 md:hidden"
        onClick={onToggleMobileMenu}
      >
        <Menu className="h-5 w-5" />
      </Button>
    );
  };

  // Render join button
  const renderJoinButton = () => {
    if (!showJoinButton || !onJoinClick || !isLoggedIn) return null;
    
    return (
      <Button 
        variant="outline" 
        size="sm" 
        onClick={onJoinClick}
        className="flex items-center gap-2"
      >
        <UserPlus className="h-4 w-4" />
        {joinButtonText}
      </Button>
    );
  };

  // Render active tag with clear button
  const renderActiveTag = () => {
    if (!activeTag || !onClearTag) return null;
    
    return (
      <Button 
        variant="ghost" 
        size="sm" 
        className="ml-2 text-xs" 
        onClick={onClearTag}
      >
        ×
      </Button>
    );
  };

  // Different layouts based on variant
  if (variant === 'global') {
    return (
      <header className={containerClasses}>
        <div className="flex flex-col h-14 px-4">
          <div className="flex items-center justify-between h-full">
            {renderMobileMenu()}
            
            <div className="flex items-center">
              <h1 className={titleSize[variant]}>
                {displayTitle}
                {renderActiveTag()}
              </h1>
            </div>
            
            <div className="flex items-center space-x-2">
              {leftContent}
              {renderThemeToggle()}
              {rightContent}
            </div>
          </div>
          
          {breadcrumbs && breadcrumbs.length > 0 && (
            <div className="px-1 pb-2">
              {renderBreadcrumbs()}
            </div>
          )}
        </div>
      </header>
    );
  }

  if (variant === 'sticky') {
    return (
      <header className={containerClasses}>
        <div className="flex items-center px-4 sm:px-6">
          <div className="container max-w-6xl mx-auto flex items-center">
            {showBackButton && <BackButton fallbackPath={backPath} className="mr-2" />}
            {renderMobileMenu()}
            
            <div className="flex-1">
              <div className="flex items-center">
                {icon && (
                  <div className="p-2 rounded-lg bg-primary/10 text-primary mr-3">
                    {icon}
                  </div>
                )}
                <h1 className={cn(titleSize[variant], "truncate")}>
                  {displayTitle}
                  {renderActiveTag()}
                </h1>
                {isPrivate && (
                  <Lock className="h-3.5 w-3.5 ml-2 text-muted-foreground" />
                )}
              </div>
              {subtitle && (
                <p className="text-sm text-muted-foreground">{subtitle}</p>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              {leftContent}
              {renderJoinButton()}
              {renderThemeToggle()}
              {rightContent}
            </div>
          </div>
        </div>
      </header>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={containerClasses}>
        <div className="flex items-center gap-3">
          {showBackButton && <BackButton fallbackPath={backPath} />}
          {renderMobileMenu()}
          {icon && (
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              {icon}
            </div>
          )}
          <h1 className={titleSize[variant]}>
            {displayTitle}
            {renderActiveTag()}
          </h1>
          {isPrivate && (
            <Lock className="h-3.5 w-3.5 ml-2 text-muted-foreground" />
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {leftContent}
          {renderJoinButton()}
          {renderThemeToggle()}
          {rightContent}
        </div>
        
        {children}
      </div>
    );
  }

  // Default 'page' variant
  return (
    <div className={containerClasses}>
      <div className="flex items-center gap-3">
        {showBackButton && <BackButton fallbackPath={backPath} />}
        {icon && (
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            {icon}
          </div>
        )}
        <div>
          <h1 className={titleSize[variant]}>
            {displayTitle}
            {renderActiveTag()}
          </h1>
          {subtitle && (
            <p className="text-lg text-muted-foreground">{subtitle}</p>
          )}
          {description && (
            <p className="text-muted-foreground mt-1">{description}</p>
          )}
          {breadcrumbs && breadcrumbs.length > 0 && (
            <div className="mt-2">
              {renderBreadcrumbs()}
            </div>
          )}
        </div>
        {isPrivate && (
          <Lock className="h-5 w-5 ml-2 text-muted-foreground" />
        )}
      </div>
      
      <div className="flex items-center gap-2">
        {leftContent}
        {renderJoinButton()}
        {renderThemeToggle()}
        {rightContent}
      </div>
      
      {children}
    </div>
  );
};

export default UnifiedPageHeader; 

