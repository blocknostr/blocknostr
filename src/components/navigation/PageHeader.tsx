
import React from "react";
import BackButton from "@/components/navigation/BackButton";
import { Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/use-theme";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  showBackButton?: boolean;
  fallbackPath?: string;
  className?: string;
  rightContent?: React.ReactNode;
  showThemeToggle?: boolean;
  children?: React.ReactNode; // Add children prop for mobile menu
}

const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  showBackButton = true,
  fallbackPath,
  className = "",
  rightContent,
  showThemeToggle = true,
  children // Accept children for mobile menu
}) => {
  const { darkMode, toggleDarkMode } = useTheme();
  
  return (
    <header className={cn(
      "border-b sticky top-0 bg-background/80 backdrop-blur-sm z-10",
      className
    )}>
      <div className="flex items-center justify-between h-14 px-4">
        <div className="flex items-center gap-3">
          {/* Render children (mobile menu) first if provided */}
          {children}
          
          {showBackButton && <BackButton fallbackPath={fallbackPath} />}
          <h1 className="font-semibold">{title}</h1>
        </div>
        
        <div className="flex items-center space-x-2">
          {showThemeToggle && (
            <Button 
              variant="ghost"
              size="icon"
              className="rounded-full theme-toggle-button"
              onClick={(e) => toggleDarkMode(e)}
              aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
              title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
            >
              <Lightbulb className={darkMode ? "h-5 w-5" : "h-5 w-5 text-yellow-500 fill-yellow-500"} />
            </Button>
          )}
          {rightContent}
        </div>
      </div>
    </header>
  );
};

export default PageHeader;
