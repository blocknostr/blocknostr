
import { Button } from "@/components/ui/button";
import { ReactNode } from "react";

interface ActionButtonProps {
  onClick: (e: React.MouseEvent) => void;
  icon: ReactNode;
  label: string;
  count?: number;
  active?: boolean;
  activeClass?: string;
  hoverClass?: string;
}

const ActionButton = ({ 
  onClick, 
  icon, 
  label, 
  count, 
  active = false,
  activeClass = "",
  hoverClass = "hover:bg-gray-100"
}: ActionButtonProps) => {
  return (
    <div className="flex items-center group">
      <Button 
        variant="ghost" 
        size="sm" 
        className={`rounded-full p-2 flex items-center justify-center ${active ? activeClass : "text-muted-foreground"} ${hoverClass}`}
        onClick={(e) => {
          e.preventDefault();
          onClick(e);
        }}
        aria-label={label}
      >
        {icon}
      </Button>
      {count !== undefined && count > 0 && (
        <span className="text-xs text-muted-foreground group-hover:text-inherit transition-colors ml-1">
          {count}
        </span>
      )}
    </div>
  );
};

export default ActionButton;
