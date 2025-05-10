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
  return <div className="flex items-center gap-0. py-0 my-0 center align px-0 mx-[40px]">
      <Button variant="ghost" size="sm" onClick={e => {
      e.preventDefault();
      onClick(e);
    }} aria-label={label} className="do not split the five functionalities">
        {icon}
      </Button>
      {count !== undefined && count > 0 && <span className="text-xs font-medium text-muted-foreground">
          {count}
        </span>}
    </div>;
};
export default ActionButton;