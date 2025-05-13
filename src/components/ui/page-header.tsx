
import React from "react";

interface PageHeaderProps {
  title: string;
  rightContent?: React.ReactNode;
}

export function PageHeader({ title, rightContent }: PageHeaderProps) {
  return (
    <header className="sticky top-0 bg-background/80 backdrop-blur-sm z-10">
      <div className="flex items-center justify-between h-14 px-4">
        <h1 className="font-semibold">{title}</h1>
        {rightContent}
      </div>
    </header>
  );
}
