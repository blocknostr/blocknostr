
import React from 'react';
import { ZoomIn } from 'lucide-react';

interface ExpandButtonProps {
  onClick: () => void;
}

const ExpandButton: React.FC<ExpandButtonProps> = ({ onClick }) => {
  return (
    <button 
      className="absolute top-3 right-3 p-2 rounded-full bg-background/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-background"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      aria-label="Expand media"
    >
      <ZoomIn className="h-4 w-4" />
    </button>
  );
};

export default ExpandButton;
