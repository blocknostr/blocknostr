
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SubmitButtonProps {
  isSubmitting: boolean;
  disabled: boolean;
  scheduledDate: Date | null;
}

const SubmitButton: React.FC<SubmitButtonProps> = ({ 
  isSubmitting, 
  disabled,
  scheduledDate
}) => {
  const isScheduled = scheduledDate && scheduledDate > new Date();
  
  return (
    <Button 
      type="submit" 
      disabled={disabled || isSubmitting}
      size="sm"
      className={cn(
        "rounded-full font-medium transition-all duration-300 text-xs h-7",
        isSubmitting ? "w-18" : "w-14",
        !disabled && "bg-primary hover:bg-primary/90 hover:scale-105 shadow-sm",
        disabled && "opacity-50",
        isScheduled && !disabled ? "bg-primary text-primary-foreground" : ""
      )}
    >
      {isSubmitting ? (
        <div className="flex items-center gap-1">
          <Loader2 className="h-3 w-3 animate-spin" />
          <span>Posting</span>
        </div>
      ) : isScheduled ? 'Schedule' : 'Post'}
    </Button>
  );
};

export default SubmitButton;
