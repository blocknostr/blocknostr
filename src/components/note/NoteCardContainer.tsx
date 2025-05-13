
import { forwardRef, ReactNode } from 'react';
import { Card } from "@/components/ui/card";

interface NoteCardContainerProps {
  children: ReactNode;
  eventId?: string;
  className?: string;
}

const NoteCardContainer = forwardRef<HTMLDivElement, NoteCardContainerProps>(
  ({ children, eventId, className = "" }, ref) => {
    return (
      <Card 
        className={`mb-3 hover:bg-accent/20 transition-colors border-border/30 shadow-sm overflow-hidden relative ${className}`}
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
