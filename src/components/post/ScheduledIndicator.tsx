
import { Calendar, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface ScheduledIndicatorProps {
  scheduledDate: Date | null;
  onCancelSchedule?: () => void;
}

const ScheduledIndicator: React.FC<ScheduledIndicatorProps> = ({ 
  scheduledDate,
  onCancelSchedule 
}) => {
  if (!scheduledDate || scheduledDate <= new Date()) {
    return null;
  }
  
  return (
    <div className={cn(
      "mt-3 py-2.5 px-3.5 bg-primary/5 rounded-md text-xs flex items-center justify-between gap-2.5",
      "text-muted-foreground border border-border/30 shadow-sm transition-all duration-300",
      "hover:bg-primary/10 hover:border-border/40"
    )}>
      <div className="flex items-center gap-2.5">
        <Calendar className="h-3.5 w-3.5 text-primary/70" />
        <span className="font-medium">
          Scheduled for {scheduledDate.toLocaleDateString()} at {scheduledDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
        </span>
      </div>
      
      {onCancelSchedule && (
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-5 w-5 rounded-full" 
          onClick={onCancelSchedule}
        >
          <X className="h-3 w-3" />
          <span className="sr-only">Cancel schedule</span>
        </Button>
      )}
    </div>
  );
};

export default ScheduledIndicator;
