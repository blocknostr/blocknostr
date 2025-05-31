
import React from 'react';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface MediaNavigationProps {
  isSingleItem: boolean;
  onPrev: () => void;
  onNext: () => void;
  currentIndex: number;
  totalItems: number;
  variant?: 'lightbox' | 'carousel';
}

const MediaNavigation: React.FC<MediaNavigationProps> = ({
  isSingleItem,
  onPrev,
  onNext,
  currentIndex,
  totalItems,
  variant = 'carousel'
}) => {
  // Don't show navigation if there's only one item
  if (isSingleItem) return null;
  
  const isLightbox = variant === 'lightbox';
  
  // Navigation button styling based on variant
  const buttonClasses = cn(
    "flex items-center justify-center rounded-full transition-all duration-200",
    isLightbox 
      ? "bg-background/80 hover:bg-background/90 w-10 h-10" 
      : "bg-background/60 hover:bg-background/80 w-8 h-8 opacity-0 group-hover:opacity-100"
  );
  
  return (
    <>
      {/* Previous button */}
      <button 
        className={cn(
          buttonClasses,
          "absolute left-3",
          isLightbox ? "top-1/2 -translate-y-1/2" : "top-1/2 -translate-y-1/2"
        )}
        onClick={(e) => {
          e.stopPropagation();
          onPrev();
        }}
        aria-label="Previous media"
      >
        <ChevronLeft className={cn(isLightbox ? "h-6 w-6" : "h-4 w-4")} />
      </button>
      
      {/* Next button */}
      <button 
        className={cn(
          buttonClasses,
          "absolute right-3",
          isLightbox ? "top-1/2 -translate-y-1/2" : "top-1/2 -translate-y-1/2"
        )}
        onClick={(e) => {
          e.stopPropagation();
          onNext();
        }}
        aria-label="Next media"
      >
        <ChevronRight className={cn(isLightbox ? "h-6 w-6" : "h-4 w-4")} />
      </button>
      
      {/* Counter indicator */}
      <div className={cn(
        "absolute bottom-3 left-3 px-2 py-1 rounded-full text-xs",
        isLightbox ? "bg-background/80 text-foreground" : "bg-background/60 text-foreground opacity-0 group-hover:opacity-100"
      )}>
        {currentIndex + 1} / {totalItems}
      </div>
    </>
  );
};

export default MediaNavigation;

