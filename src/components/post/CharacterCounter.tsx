
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
      "text-xs font-medium transition-colors duration-300",
      isNearLimit ? "text-amber-500" : isOverLimit ? "text-red-500" : "text-muted-foreground opacity-70",
      !isNearLimit && "hidden sm:flex sm:items-center sm:justify-center",
      isNearLimit && "flex items-center justify-center"
    )}>
      <span className={cn(
        "transition-transform duration-300",
        (isOverLimit || (isNearLimit && charsLeft < 20)) && "scale-110"
      )}>
        {charsLeft} left
      </span>
    </div>
  );
};

export default CharacterCounter;
