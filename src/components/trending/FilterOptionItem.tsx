
import React from "react";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface FilterOptionItemProps {
  isActive: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}

const FilterOptionItem: React.FC<FilterOptionItemProps> = ({ 
  isActive, 
  onClick, 
  icon, 
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
      {icon}
      {label}
      {isActive && (
        <div className="ml-auto w-4 h-4 flex items-center justify-center">
          <div className="w-2 h-2 rounded-full bg-primary"></div>
        </div>
      )}
    </DropdownMenuItem>
  );
};

export default FilterOptionItem;
