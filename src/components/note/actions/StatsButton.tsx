
import { Button } from "@/components/ui/button";

interface StatsButtonProps {
  showStats: boolean;
  onClick: (e: React.MouseEvent) => void;
}

const StatsButton = ({ showStats, onClick }: StatsButtonProps) => {
  return (
    <Button 
      variant="ghost" 
      size="sm" 
      className="text-xs text-muted-foreground"
      onClick={onClick}
    >
      {showStats ? 'Hide Stats' : 'Stats'}
    </Button>
  );
};

export default StatsButton;
