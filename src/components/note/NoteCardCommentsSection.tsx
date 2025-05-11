
import { ReactNode } from 'react';

interface NoteCardCommentsSectionProps {
  children: ReactNode;
  showComments: boolean;
  onInteractionStart?: () => void;
  onInteractionEnd?: () => void;
}

const NoteCardCommentsSection = ({ 
  children, 
  showComments,
  onInteractionStart, 
  onInteractionEnd 
}: NoteCardCommentsSectionProps) => {
  if (!showComments) return null;
  
  return (
    <div 
      className="bg-muted/30 animate-fade-in" 
      onMouseEnter={onInteractionStart} 
      onMouseLeave={onInteractionEnd}
    >
      {children}
    </div>
  );
};

export default NoteCardCommentsSection;
