
import { Button } from "@/components/ui/button";
import { Expand } from 'lucide-react';

interface ExpandButtonProps {
  onClick: () => void;
}

const ExpandButton = ({ onClick }: ExpandButtonProps) => {
  return (
    <Button 
      variant="ghost" 
      size="icon" 
      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 hover:bg-background"
      onClick={onClick}
    >
      <Expand className="h-4 w-4" />
      <span className="sr-only">View fullscreen</span>
    </Button>
  );
};

export default ExpandButton;
