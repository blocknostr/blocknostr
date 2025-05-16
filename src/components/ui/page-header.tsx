import React from "react";
import { cn } from "@/lib/utils";
interface PageHeaderProps {
  title: string;
  rightContent?: React.ReactNode;
  icon?: React.ReactNode;
  description?: string;
  className?: string;
}
export function PageHeader({
  title,
  rightContent,
  icon,
  description,
  className
}: PageHeaderProps) {
  return <header className={cn("sticky top-0 z-10 border-b bg-background/95 backdrop-blur-sm", className)}>
      
    </header>;
}