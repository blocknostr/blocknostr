
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
    <div className="flex items-center gap-1">
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={onClick}
        aria-label={label} 
        className={`p-2 rounded-full ${active ? activeClass : ''} ${hoverClass} transition-colors`}
      >
        {icon}
      </Button>
      {count !== undefined && count > 0 && 
        <span className="text-xs font-medium text-muted-foreground">
          {count}
        </span>
      }
    </div>
  );
};

export default ActionButton;
