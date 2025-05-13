
import { forwardRef, ReactNode, MouseEvent } from 'react';
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface NoteCardContainerProps {
  children: ReactNode;
  eventId?: string;
  className?: string;
  feedVariant?: "virtualized" | "standard";
  onClick?: (e: MouseEvent<Element>) => void;
}

const NoteCardContainer = forwardRef<HTMLDivElement, NoteCardContainerProps>(
  ({ children, eventId, className = "", feedVariant = "standard", onClick }, ref) => {
    return (
      <Card 
        className={cn(
          "border-b border-accent/10 hover:bg-accent/5 transition-colors overflow-hidden relative",
          // Remove variable margins - we'll control spacing at the list level
          className
        )}
        ref={ref}
        role="article"
        aria-label="Post"
        data-event-id={eventId}
        onClick={onClick}
      >
        {children}
      </Card>
    );
  }
);

NoteCardContainer.displayName = "NoteCardContainer";

export default NoteCardContainer;
