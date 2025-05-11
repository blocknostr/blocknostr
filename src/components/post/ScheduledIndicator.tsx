
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
      "mt-3 py-2.5 px-3.5 bg-primary/5 rounded-md text-xs flex items-center gap-2.5",
      "text-muted-foreground border border-border/30 shadow-sm transition-all duration-300",
      "hover:bg-primary/10 hover:border-border/40"
    )}>
      <Calendar className="h-3.5 w-3.5 text-primary/70" />
      <span className="font-medium">
        Scheduled for {scheduledDate.toLocaleDateString()} at {scheduledDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
      </span>
    </div>
  );
};

export default ScheduledIndicator;
