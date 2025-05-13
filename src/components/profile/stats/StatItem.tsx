
import { Loader2 } from "lucide-react";
import React from "react";

interface StatItemProps {
  label: string;
  value: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  isLoading?: boolean;
  actionButton?: React.ReactNode;
}

const StatItem = ({ label, value, icon, onClick, isLoading = false, actionButton }: StatItemProps) => {
  return (
    <div 
      className={`flex flex-col items-center justify-center py-4 px-2 hover:bg-muted/50 transition-colors relative ${onClick && !isLoading ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center gap-1.5">
        {icon}
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        ) : (
          <span className="font-semibold">{value}</span>
        )}
      </div>
      <span className="text-xs text-muted-foreground">{label}</span>
      {actionButton}
    </div>
  );
};

export default StatItem;
