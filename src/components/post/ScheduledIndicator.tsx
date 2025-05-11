
import { Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

interface ScheduledIndicatorProps {
  scheduledDate: Date | null;
}

const ScheduledIndicator: React.FC<ScheduledIndicatorProps> = ({ scheduledDate }) => {
  if (!scheduledDate || scheduledDate <= new Date()) {
    return null;
  }
  
  return (
    <div className={cn(
      "mt-3 py-2 px-3 bg-primary/5 rounded-md text-xs flex items-center gap-2",
      "text-muted-foreground border border-border/20 shadow-sm"
    )}>
      <Calendar className="h-3.5 w-3.5" />
      Scheduled for {scheduledDate.toLocaleDateString()} at {scheduledDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
    </div>
  );
};

export default ScheduledIndicator;
