
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSwipeable } from "@/hooks/use-swipeable";

interface MediaLightboxProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  urls: string[];
  initialIndex?: number;
}

const MediaLightbox = ({ isOpen, onOpenChange, urls, initialIndex = 0 }: MediaLightboxProps) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const isSingleItem = urls.length === 1;
  
  // Reset to initialIndex when dialog opens
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
    }
  }, [isOpen, initialIndex]);
  
  const currentUrl = urls[currentIndex];
  const isVideo = /\.(mp4|webm|ogg|mov)$/i.test(currentUrl);
  
  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % urls.length);
  };
  
  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? urls.length - 1 : prev - 1));
  };

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
        {isVideo ? (
          <video 
            src={currentUrl}
            className="w-full h-auto max-h-[80vh] object-contain"
            controls
            autoPlay={false}
          />
        ) : (
          <img 
            src={currentUrl} 
            alt={`Media ${currentIndex + 1} of ${urls.length}`} 
            className="w-full h-auto max-h-[80vh] object-contain"
          />
        )}
        
        {!isSingleItem && (
          <>
            {/* Navigation buttons */}
            <Button
              variant="outline"
              size="icon"
              className={cn(
                "absolute left-2 top-1/2 -translate-y-1/2 rounded-full h-10 w-10",
                "bg-background/80 border-border/20 shadow-md",
                "hover:bg-background hover:scale-110 transition-all"
              )}
              onClick={handlePrev}
            >
              <ChevronLeft className="h-6 w-6" />
              <span className="sr-only">Previous</span>
            </Button>
            
            <Button
              variant="outline"
              size="icon"
              className={cn(
                "absolute right-2 top-1/2 -translate-y-1/2 rounded-full h-10 w-10",
                "bg-background/80 border-border/20 shadow-md",
                "hover:bg-background hover:scale-110 transition-all"
              )}
              onClick={handleNext}
            >
              <ChevronRight className="h-6 w-6" />
              <span className="sr-only">Next</span>
            </Button>
            
            {/* Indicators */}
            <div className="absolute -bottom-6 left-0 right-0 flex justify-center gap-2">
              {urls.map((_, index) => (
                <button
                  key={index}
                  className={cn(
                    "w-2 h-2 rounded-full transition-all duration-300",
                    index === currentIndex 
                      ? "bg-primary w-4" 
                      : "bg-muted-foreground/30 hover:bg-muted-foreground/60"
                  )}
                  onClick={() => setCurrentIndex(index)}
                />
              ))}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default MediaLightbox;
