
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
  children?: React.ReactNode;
}

const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  showBackButton = true,
  fallbackPath,
  className = "",
  rightContent,
  showThemeToggle = true,
  children
}) => {
  const { darkMode, toggleDarkMode } = useTheme();
  
  return (
    <div className={cn("flex items-center justify-between mb-6", className)}>
      <div className="flex items-center gap-3">
        {showBackButton && <BackButton fallbackPath={fallbackPath} />}
        <h1 className="text-2xl font-bold">{title}</h1>
      </div>
      
      <div className="flex items-center gap-2">
        {rightContent}
        
        {showThemeToggle && (
          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-full"
            onClick={toggleDarkMode}
            aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
            title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
          >
            <Lightbulb className={darkMode ? "h-5 w-5" : "h-5 w-5 text-yellow-500 fill-yellow-500"} />
          </Button>
        )}
      </div>
      
      {children}
    </div>
  );
};

export default PageHeader;
