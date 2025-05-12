
import { ReactNode } from 'react';
import { CardFooter } from "@/components/ui/card";

interface NoteCardFooterProps {
  children: ReactNode;
  onInteractionStart?: () => void;
  onInteractionEnd?: () => void;
  className?: string;
}

const NoteCardFooter = ({ 
  children, 
  onInteractionStart, 
  onInteractionEnd,
  className = ""
}: NoteCardFooterProps) => {
  return (
    <CardFooter 
      className={`pt-0 px-5 pb-3 flex-wrap gap-1 ${className}`} 
      onMouseEnter={onInteractionStart} 
      onMouseLeave={onInteractionEnd}
    >
      {children}
    </CardFooter>
  );
};

export default NoteCardFooter;
