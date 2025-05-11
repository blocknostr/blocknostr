
import { Calendar } from "lucide-react";

interface ScheduledIndicatorProps {
  scheduledDate: Date | null;
}

const ScheduledIndicator: React.FC<ScheduledIndicatorProps> = ({ scheduledDate }) => {
  if (!scheduledDate || scheduledDate <= new Date()) {
    return null;
  }
  
  return (
    <div className="mt-2 py-1.5 px-2.5 bg-primary/5 rounded-md text-xs flex items-center gap-1.5 text-muted-foreground">
      <Calendar className="h-3.5 w-3.5" />
      Scheduled for {scheduledDate.toLocaleDateString()} at {scheduledDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
    </div>
  );
};

export default ScheduledIndicator;
