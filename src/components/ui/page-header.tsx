
import React from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  rightContent?: React.ReactNode;
  icon?: React.ReactNode;
  description?: string;
  className?: string;
  backButton?: {
    href: string;
    label: string;
  };
}

export function PageHeader({
  title,
  rightContent,
  icon,
  description,
  className,
  backButton
}: PageHeaderProps) {
  return (
    <div className={cn("flex flex-col space-y-2 mb-8", className)}>
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          {icon && (
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              {icon}
            </div>
          )}
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        </div>
        {rightContent && <div>{rightContent}</div>}
      </div>
      {description && (
        <p className="text-muted-foreground">{description}</p>
      )}
      {backButton && (
        <a 
          href={backButton.href} 
          className="text-sm text-muted-foreground hover:underline inline-flex items-center"
        >
          ← {backButton.label}
        </a>
      )}
    </div>
  );
}
