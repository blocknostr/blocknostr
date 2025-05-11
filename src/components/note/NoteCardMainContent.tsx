
import { ReactNode } from 'react';
import { CardContent } from "@/components/ui/card";

interface NoteCardMainContentProps {
  children: ReactNode;
  onInteractionStart?: () => void;
  onInteractionEnd?: () => void;
}

const NoteCardMainContent = ({ 
  children, 
  onInteractionStart, 
  onInteractionEnd 
}: NoteCardMainContentProps) => {
  return (
    <CardContent className="pt-5 px-5 pb-3">
      <div 
        onMouseEnter={onInteractionStart} 
        onMouseLeave={onInteractionEnd}
      >
        {children}
      </div>
    </CardContent>
  );
};

export default NoteCardMainContent;
