
import { Dialog, DialogContent } from "@/components/ui/dialog";
import MediaContent from './MediaContent';
import MediaNavigation from './MediaNavigation';
import { useMediaNavigation } from '@/hooks/use-media-navigation';
import { useSwipeable } from '@/hooks/use-swipeable';

interface MediaLightboxProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  urls: string[];
  initialIndex?: number;
}

const MediaLightbox = ({ isOpen, onOpenChange, urls, initialIndex = 0 }: MediaLightboxProps) => {
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
    handleError
  } = useMediaNavigation({ urls, initialIndex, onOpenChange });
  
  // Setup swipe handlers for mobile
  const swipeHandlers = useSwipeable({
    onSwipedLeft: handleNext,
    onSwipedRight: handlePrev,
    preventDefaultTouchmoveEvent: true,
    trackMouse: false
  });
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[90vw] p-1 bg-background/95" {...swipeHandlers}>
        <MediaContent 
          url={currentUrl}
          isVideo={isVideo}
          isLoaded={true} // We don't show loading state in lightbox
          error={false} // We don't show error state in lightbox
          onLoad={handleMediaLoad}
          onError={handleError}
          index={currentIndex}
          totalItems={urls.length}
          variant="lightbox"
        />
        
        <MediaNavigation 
          isSingleItem={isSingleItem}
          onPrev={handlePrev}
          onNext={handleNext}
          currentIndex={currentIndex}
          totalItems={urls.length}
          variant="lightbox"
        />
      </DialogContent>
    </Dialog>
  );
};

export default MediaLightbox;
