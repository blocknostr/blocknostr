
import React from "react";
import { Clock } from "lucide-react";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface TimeOptionItemProps {
  isActive: boolean;
  onClick: () => void;
  label: string;
}

const TimeOptionItem: React.FC<TimeOptionItemProps> = ({ 
  isActive, 
  onClick, 
  label 
}) => {
  return (
    <DropdownMenuItem 
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 cursor-pointer",
        isActive && "bg-accent"
      )}
    >
      <Clock className="h-4 w-4" />
      {label}
      {isActive && (
        <div className="ml-auto w-4 h-4 flex items-center justify-center">
          <div className="w-2 h-2 rounded-full bg-primary"></div>
        </div>
      )}
    </DropdownMenuItem>
  );
};

export default TimeOptionItem;
