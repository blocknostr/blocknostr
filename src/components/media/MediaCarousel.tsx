
import React from 'react';
import { AspectRatio } from "@/components/ui/aspect-ratio";
import MediaContent from './MediaContent';
import ExpandButton from './ExpandButton';
import MediaNavigation from './MediaNavigation';
import { useMediaNavigation } from '@/hooks/use-media-navigation';
import { useSwipeable } from '@/hooks/use-swipeable';

interface MediaCarouselProps {
  urls: string[];
  onExpandClick: (index: number) => void;
}

const MediaCarousel: React.FC<MediaCarouselProps> = ({ urls, onExpandClick }) => {
  const {
    currentIndex,
    currentUrl,
    isVideo,
    isSingleItem,
    isLoaded,
    error,
    handleNext,
    handlePrev,
    handleMediaLoad,
    handleError,
    goToIndex
  } = useMediaNavigation({ urls });
  
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
        <MediaContent 
          url={currentUrl}
          isVideo={isVideo}
          isLoaded={isLoaded}
          error={error}
          onLoad={handleMediaLoad}
          onError={handleError}
          index={currentIndex}
          totalItems={urls.length}
        />
        
        {isLoaded && !error && (
          <ExpandButton onClick={() => onExpandClick(currentIndex)} />
        )}
        
        <MediaNavigation 
          isSingleItem={isSingleItem}
          onPrev={handlePrev}
          onNext={handleNext}
          currentIndex={currentIndex}
          totalItems={urls.length}
          variant="carousel"
        />
      </AspectRatio>
    </div>
  );
};

export default MediaCarousel;
