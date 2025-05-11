
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
        "rounded-full transition-all duration-300",
        isSubmitting ? "w-24" : "w-20",
        !disabled && "bg-primary hover:bg-primary/90 hover:scale-105",
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
