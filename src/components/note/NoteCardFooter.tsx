
import { ReactNode } from 'react';
import { CardFooter } from "@/components/ui/card";

interface NoteCardFooterProps {
  children: ReactNode;
  onInteractionStart?: () => void;
  onInteractionEnd?: () => void;
}

const NoteCardFooter = ({ 
  children, 
  onInteractionStart, 
  onInteractionEnd 
}: NoteCardFooterProps) => {
  return (
    <CardFooter 
      className="pt-0 px-5 pb-3 flex-wrap gap-1" 
      onMouseEnter={onInteractionStart} 
      onMouseLeave={onInteractionEnd}
    >
      {children}
    </CardFooter>
  );
};

export default NoteCardFooter;
