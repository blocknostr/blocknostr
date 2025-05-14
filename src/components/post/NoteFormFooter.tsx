
import React, { RefObject } from 'react';
import { Button } from '@/components/ui/button';
import { CalendarIcon } from 'lucide-react';
import { SubmitButton } from './SubmitButton';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

export interface NoteFormFooterProps {
  textareaRef: RefObject<HTMLTextAreaElement>;
  content: string;
  setContent: (content: string) => void;
  scheduledDate: Date | null;
  setScheduledDate: (date: Date | null) => void;
  charsLeft: number;
  isNearLimit: boolean;
  isOverLimit: boolean;
  isSubmitting: boolean;
}

const NoteFormFooter: React.FC<NoteFormFooterProps> = ({
  textareaRef,
  content,
  setContent,
  scheduledDate,
  setScheduledDate,
  charsLeft,
  isNearLimit,
  isOverLimit,
  isSubmitting
}) => {
  // Handle scheduling a post
  const handleSchedule = (date: Date | undefined) => {
    if (date) {
      // Make sure date is in the future
      if (date.getTime() <= Date.now()) {
        // Set to the next hour
        const nextHour = new Date();
        nextHour.setHours(nextHour.getHours() + 1);
        nextHour.setMinutes(0);
        nextHour.setSeconds(0);
        nextHour.setMilliseconds(0);
        setScheduledDate(nextHour);
      } else {
        setScheduledDate(date);
      }
    }
  };
  
  return (
    <div className="flex items-center justify-between pt-3 border-t">
      <div className="flex items-center space-x-2">
        {/* Schedule button */}
        <Popover>
          <PopoverTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 rounded-full"
              type="button"
              disabled={isSubmitting}
            >
              <CalendarIcon className="h-4 w-4" />
              <span className="sr-only">Schedule post</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={scheduledDate || undefined}
              onSelect={handleSchedule}
              initialFocus
              disabled={(date) => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                return date < today;
              }}
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Submit button */}
      <SubmitButton 
        isSubmitting={isSubmitting} 
        isOverLimit={isOverLimit} 
        isEmpty={!content || content.trim().length === 0}
        isScheduled={!!scheduledDate}
      />
    </div>
  );
};

export default NoteFormFooter;
