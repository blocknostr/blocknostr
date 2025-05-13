
import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import EnhancedMediaContent from './EnhancedMediaContent';
import { useMediaPreferences } from '@/hooks/useMediaPreferences';

interface MediaCarouselProps {
  urls: string[];
  onExpandClick?: (index: number) => void;
  className?: string;
}

const MediaCarousel: React.FC<MediaCarouselProps> = ({
  urls,
  onExpandClick,
  className
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const { mediaPrefs } = useMediaPreferences();
  
  // Go to previous slide
  const handlePrevious = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex(prev => (prev === 0 ? urls.length - 1 : prev - 1));
  };
  
  // Go to next slide
  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex(prev => (prev === urls.length - 1 ? 0 : prev + 1));
  };
  
  // Handle expand click (open lightbox)
  const handleExpandMedia = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onExpandClick) {
      onExpandClick(currentIndex);
    }
  };
  
  // If there are no URLs, don't render anything
  if (!urls.length) return null;
  
  // If there's only one URL, simplify the UI
  if (urls.length === 1) {
    return (
      <div 
        className={cn(
          "relative rounded-lg overflow-hidden cursor-pointer",
          className
        )}
        onClick={handleExpandMedia}
      >
        <EnhancedMediaContent
          url={urls[0]}
          variant="carousel"
          index={0}
          totalItems={1}
        />
      </div>
    );
  }
  
  // Multiple URLs - show carousel
  return (
    <div className={cn("relative rounded-lg overflow-hidden", className)}>
      {/* Current Media Item */}
      <div 
        className="cursor-pointer"
        onClick={handleExpandMedia}
      >
        <EnhancedMediaContent
          url={urls[currentIndex]}
          variant="carousel"
          index={currentIndex}
          totalItems={urls.length}
          autoPlayVideos={mediaPrefs.autoPlayVideos}
          dataSaverMode={mediaPrefs.dataSaverMode}
        />
      </div>
      
      {/* Navigation Controls */}
      <div className="absolute inset-0 flex items-center justify-between opacity-0 hover:opacity-100 transition-opacity">
        <button 
          className="p-1 rounded-full bg-background/60 backdrop-blur-sm text-foreground ml-2"
          onClick={handlePrevious}
          aria-label="Previous image"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        
        <button 
          className="p-1 rounded-full bg-background/60 backdrop-blur-sm text-foreground mr-2"
          onClick={handleNext}
          aria-label="Next image"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
      
      {/* Pagination Indicators */}
      {urls.length > 1 && (
        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1">
          {urls.map((_, index) => (
            <button
              key={index}
              className={cn(
                "w-1.5 h-1.5 rounded-full transition-all",
                index === currentIndex 
                  ? "bg-primary scale-125" 
                  : "bg-muted-foreground/40"
              )}
              onClick={(e) => {
                e.stopPropagation();
                setCurrentIndex(index);
              }}
              aria-label={`Go to image ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default React.memo(MediaCarousel);
