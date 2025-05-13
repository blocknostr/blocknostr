
import { forwardRef, ReactNode } from 'react';
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface NoteCardContainerProps {
  children: ReactNode;
  eventId?: string;
  className?: string;
  feedVariant?: "virtualized" | "standard";
}

const NoteCardContainer = forwardRef<HTMLDivElement, NoteCardContainerProps>(
  ({ children, eventId, className = "", feedVariant = "standard" }, ref) => {
    return (
      <Card 
        className={cn(
          "hover:bg-accent/10 transition-colors border-accent/10 shadow-sm overflow-hidden relative",
          feedVariant === "standard" && "mb-4", // Only apply margin-bottom for standard (non-virtualized) lists
          className
        )}
        ref={ref}
        role="article"
        aria-label="Post"
        data-event-id={eventId}
      >
        {children}
      </Card>
    );
  }
);

NoteCardContainer.displayName = "NoteCardContainer";

export default NoteCardContainer;
