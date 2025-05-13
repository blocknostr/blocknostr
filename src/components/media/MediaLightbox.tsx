
import React, { useEffect } from 'react';
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { X } from 'lucide-react';
import EnhancedMediaContent from './EnhancedMediaContent';
import MediaNavigation from './MediaNavigation';
import { useMediaNavigation } from '@/hooks/use-media-navigation';
import { useSwipeable } from '@/hooks/use-swipeable';

interface MediaLightboxProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  urls: string[];
  initialIndex?: number;
}

const MediaLightbox: React.FC<MediaLightboxProps> = ({ 
  isOpen, 
  onOpenChange, 
  urls,
  initialIndex = 0
}) => {
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
  } = useMediaNavigation({ 
    urls,
    initialIndex
  });
  
  // Add keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      switch (e.key) {
        case 'ArrowLeft':
          handlePrev();
          break;
        case 'ArrowRight':
          handleNext();
          break;
        case 'Escape':
          onOpenChange(false);
          break;
        default:
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, handlePrev, handleNext, onOpenChange]);
  
  // Setup swipe handlers for mobile
  const swipeHandlers = useSwipeable({
    onSwipedLeft: handleNext,
    onSwipedRight: handlePrev,
    preventDefaultTouchmoveEvent: true,
    trackMouse: false
  });

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-w-7xl w-screen h-[90vh] bg-background/95 backdrop-blur-xl p-0 flex items-center justify-center"
        {...swipeHandlers}
      >
        <div className="relative w-full h-full flex items-center justify-center">
          <button 
            className="absolute top-4 right-4 p-2 bg-background/80 rounded-full z-50 hover:bg-background"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-5 w-5" />
          </button>
          
          <div className="max-w-full max-h-full p-8">
            <EnhancedMediaContent 
              url={currentUrl}
              variant="lightbox"
              index={currentIndex}
              totalItems={urls.length}
              autoPlayVideos={true}
            />
            
            <MediaNavigation 
              isSingleItem={isSingleItem}
              onPrev={handlePrev}
              onNext={handleNext}
              currentIndex={currentIndex}
              totalItems={urls.length}
              variant="lightbox"
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MediaLightbox;
