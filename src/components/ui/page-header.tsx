
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
  return (
    <header className={cn(
      "sticky top-0 z-10 border-b bg-background/95 backdrop-blur-sm",
      className
    )}>
      <div className="flex items-center justify-between h-14 px-4">
        <div className="flex items-center gap-2">
          {icon && <span className="text-muted-foreground">{icon}</span>}
          <div>
            <h1 className="font-semibold flex items-center">{title}</h1>
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
          </div>
        </div>
        {rightContent}
      </div>
    </header>
  );
}
