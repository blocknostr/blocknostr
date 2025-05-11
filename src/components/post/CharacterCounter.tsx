
import { cn } from "@/lib/utils";

interface CharacterCounterProps {
  charsLeft: number;
  isNearLimit: boolean;
  isOverLimit: boolean;
}

const CharacterCounter: React.FC<CharacterCounterProps> = ({ 
  charsLeft, 
  isNearLimit, 
  isOverLimit 
}) => {
  return (
    <div className={cn(
      "text-xs transition-colors",
      isNearLimit ? "text-amber-500" : isOverLimit ? "text-red-500" : "text-muted-foreground opacity-70",
      !isNearLimit && "hidden sm:block" // Hide on mobile unless near limit
    )}>
      {charsLeft} left
    </div>
  );
};

export default CharacterCounter;
