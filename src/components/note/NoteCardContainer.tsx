
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
        className={`mb-4 hover:bg-accent/10 transition-colors border-accent/10 shadow-sm overflow-hidden relative animate-in fade-in slide-in-from-bottom-5 duration-300 ${className}`}
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
