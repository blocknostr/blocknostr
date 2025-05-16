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
  const {
    darkMode,
    toggleDarkMode
  } = useTheme();
  return <header className={cn("border-b sticky top-0 bg-background/80 backdrop-blur-sm z-10", className)}>
      
    </header>;
};
export default PageHeader;