
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
          // Apply specific styles based on feed variant
          feedVariant === "virtualized" 
            ? "shadow-sm rounded-md mb-2" 
            : "mb-4",
          className
        )}
        ref={ref}
        role="article"
        aria-label="Post"
        data-event-id={eventId}
        onClick={onClick}
        style={{
          // GPU acceleration for smooth scrolling and animations
          willChange: 'transform',
          // Add subtle depth using box-shadow instead of margins for better performance
          boxShadow: feedVariant === "virtualized" ? "0 1px 2px rgba(0,0,0,0.05)" : "none",
        }}
      >
        {children}
      </Card>
    );
  }
);

NoteCardContainer.displayName = "NoteCardContainer";

export default NoteCardContainer;
