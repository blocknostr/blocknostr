
import React, { useState } from 'react';
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import ImagePreview from './ImagePreview';
import VideoPreview from './VideoPreview';
import MediaLoadingState from './MediaLoadingState';
import MediaErrorState from './MediaErrorState';
import ExpandButton from './ExpandButton';
import { useSwipeable } from '@/hooks/use-swipeable';

interface MediaCarouselProps {
  urls: string[];
  onExpandClick: (index: number) => void;
}

const MediaCarousel: React.FC<MediaCarouselProps> = ({ urls, onExpandClick }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);
  
  const currentUrl = urls[currentIndex];
  const isVideo = /\.(mp4|webm|ogg|mov)$/i.test(currentUrl);
  const isSingleItem = urls.length === 1;
  
  const handleNext = () => {
    setIsLoaded(false);
    setError(false);
    setCurrentIndex((prev) => (prev + 1) % urls.length);
  };
  
  const handlePrev = () => {
    setIsLoaded(false);
    setError(false);
    setCurrentIndex((prev) => (prev === 0 ? urls.length - 1 : prev - 1));
  };
  
  const handleMediaLoad = () => {
    setIsLoaded(true);
  };
  
  const handleError = () => {
    setError(true);
  };

  // Setup swipe handlers for mobile
  const swipeHandlers = useSwipeable({
    onSwipedLeft: handleNext,
    onSwipedRight: handlePrev,
    preventDefaultTouchmoveEvent: true,
    trackMouse: false
  });
  
  return (
    <div 
      className="relative rounded-lg overflow-hidden border border-border bg-accent/20 group"
      {...swipeHandlers}
    >
      <AspectRatio ratio={16/9} className="bg-muted">
        {isVideo ? (
          <VideoPreview
            url={currentUrl}
            onLoad={handleMediaLoad}
            onError={handleError}
          />
        ) : (
          <ImagePreview
            url={currentUrl}
            alt={`Media ${currentIndex + 1} of ${urls.length}`}
            onLoad={handleMediaLoad}
            onError={handleError}
          />
        )}
        
        {!isLoaded && !error && <MediaLoadingState />}
        {error && <MediaErrorState isVideo={isVideo} />}
        
        {isLoaded && !error && (
          <ExpandButton onClick={() => onExpandClick(currentIndex)} />
        )}
        
        {!isSingleItem && (
          <>
            {/* Navigation buttons */}
            <Button
              variant="outline"
              size="icon"
              className={cn(
                "absolute left-2 top-1/2 -translate-y-1/2 rounded-full h-8 w-8 opacity-0 bg-background/80 border-none",
                "group-hover:opacity-100 transition-opacity duration-200",
                "hover:bg-background/95 hover:scale-110"
              )}
              onClick={(e) => {
                e.stopPropagation();
                handlePrev();
              }}
            >
              <ChevronLeft className="h-5 w-5" />
              <span className="sr-only">Previous</span>
            </Button>
            
            <Button
              variant="outline"
              size="icon"
              className={cn(
                "absolute right-2 top-1/2 -translate-y-1/2 rounded-full h-8 w-8 opacity-0 bg-background/80 border-none",
                "group-hover:opacity-100 transition-opacity duration-200",
                "hover:bg-background/95 hover:scale-110"
              )}
              onClick={(e) => {
                e.stopPropagation();
                handleNext();
              }}
            >
              <ChevronRight className="h-5 w-5" />
              <span className="sr-only">Next</span>
            </Button>
            
            {/* Indicators */}
            <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5">
              {urls.map((_, index) => (
                <button
                  key={index}
                  className={cn(
                    "w-1.5 h-1.5 rounded-full transition-all duration-300",
                    index === currentIndex 
                      ? "bg-primary w-3" 
                      : "bg-background/70 hover:bg-background"
                  )}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentIndex(index);
                    setIsLoaded(false);
                    setError(false);
                  }}
                />
              ))}
            </div>
          </>
        )}
      </AspectRatio>
    </div>
  );
};

export default MediaCarousel;
