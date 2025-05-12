
import React from 'react';
import { cn } from '@/lib/utils';

interface HashtagButtonProps {
  tag: string;
  onClick: (e: React.MouseEvent, tag: string) => void;
  variant?: 'default' | 'small' | 'large' | 'pill';
  showHash?: boolean;
  className?: string;
}

const HashtagButton: React.FC<HashtagButtonProps> = ({
  tag,
  onClick,
  variant = 'default',
  showHash = true,
  className
}) => {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onClick(e, tag);
  };
  
  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        "transition-all duration-200 hover:scale-105",
        variant === 'default' && "text-primary hover:underline font-medium",
        variant === 'small' && "text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10",
        variant === 'large' && "text-sm bg-primary/10 px-3 py-1 rounded-full text-primary font-medium hover:bg-primary/20",
        variant === 'pill' && "text-xs font-medium text-primary px-2 py-1 rounded-full bg-primary/10 hover:bg-primary/15",
        className
      )}
    >
      {showHash ? `#${tag}` : tag}
    </button>
  );
};

export default HashtagButton;
