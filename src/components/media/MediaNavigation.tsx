
import React from 'react';
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
  if (isSingleItem) return null;
  
  const isLightbox = variant === 'lightbox';
  
  return (
    <>
      {/* Navigation buttons */}
      <Button
        variant="outline"
        size="icon"
        className={cn(
          "absolute top-1/2 -translate-y-1/2 rounded-full",
          isLightbox 
            ? "left-2 h-10 w-10 bg-background/80 border-border/20 shadow-md hover:bg-background hover:scale-110 transition-all" 
            : "left-2 h-8 w-8 opacity-0 bg-background/80 border-none group-hover:opacity-100 transition-opacity duration-200 hover:bg-background/95 hover:scale-110"
        )}
        onClick={(e) => {
          e?.stopPropagation?.();
          onPrev();
        }}
      >
        <ChevronLeft className={isLightbox ? "h-6 w-6" : "h-5 w-5"} />
        <span className="sr-only">Previous</span>
      </Button>
      
      <Button
        variant="outline"
        size="icon"
        className={cn(
          "absolute top-1/2 -translate-y-1/2 rounded-full",
          isLightbox 
            ? "right-2 h-10 w-10 bg-background/80 border-border/20 shadow-md hover:bg-background hover:scale-110 transition-all" 
            : "right-2 h-8 w-8 opacity-0 bg-background/80 border-none group-hover:opacity-100 transition-opacity duration-200 hover:bg-background/95 hover:scale-110"
        )}
        onClick={(e) => {
          e?.stopPropagation?.();
          onNext();
        }}
      >
        <ChevronRight className={isLightbox ? "h-6 w-6" : "h-5 w-5"} />
        <span className="sr-only">Next</span>
      </Button>
      
      {/* Indicators */}
      <div className={cn(
        "absolute left-0 right-0 flex justify-center gap-1.5",
        isLightbox ? "-bottom-6" : "bottom-2"
      )}>
        {Array.from({ length: totalItems }).map((_, index) => (
          <button
            key={index}
            className={cn(
              "w-1.5 h-1.5 rounded-full transition-all duration-300",
              index === currentIndex 
                ? isLightbox ? "bg-primary w-4" : "bg-primary w-3"
                : isLightbox ? "bg-muted-foreground/30 hover:bg-muted-foreground/60" : "bg-background/70 hover:bg-background"
            )}
            onClick={(e) => {
              e?.stopPropagation?.();
              // Go to this index
              if (index !== currentIndex) {
                // Fix: Cast to HTMLButtonElement to access focus method
                const targetButton = e.currentTarget.parentElement?.querySelector(`button:nth-child(${index + 1})`) as HTMLButtonElement | null;
                if (targetButton) {
                  targetButton.focus();
                }
              }
            }}
          />
        ))}
      </div>
    </>
  );
};

export default MediaNavigation;
