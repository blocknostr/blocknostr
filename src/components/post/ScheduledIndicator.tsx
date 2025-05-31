
import React from 'react';
import { format } from 'date-fns';
import { Clock, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ScheduledIndicatorProps {
  scheduledDate: Date;
  onCancelSchedule?: () => void;
}

const ScheduledIndicator: React.FC<ScheduledIndicatorProps> = ({ 
  scheduledDate,
  onCancelSchedule
}) => {
  if (!scheduledDate) return null;
  
  // Format the date for display
  const formattedDate = format(scheduledDate, 'MMM d, yyyy • h:mm a');
  
  return (
    <div className={cn(
      "flex items-center gap-2 py-2 px-3 rounded-md text-xs",
      "bg-primary/10 text-primary"
    )}>
      <Clock className="h-3.5 w-3.5" />
      <span className="flex-1">Scheduled for {formattedDate}</span>
      
      {onCancelSchedule && (
        <button 
          type="button"
          onClick={onCancelSchedule}
          className="hover:bg-primary/20 rounded-full p-1"
          aria-label="Cancel scheduled post"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
};

export default ScheduledIndicator;

