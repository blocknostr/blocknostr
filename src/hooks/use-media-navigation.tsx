
import { useState, useEffect } from 'react';

interface UseMediaNavigationProps {
  urls: string[];
  initialIndex?: number;
  onOpenChange?: (open: boolean) => void;
}

export function useMediaNavigation({ 
  urls, 
  initialIndex = 0,
  onOpenChange 
}: UseMediaNavigationProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);
  
  const isSingleItem = urls.length === 1;
  const currentUrl = urls[currentIndex];
  const isVideo = /\.(mp4|webm|ogg|mov)$/i.test(currentUrl);
  
  // Reset to initialIndex when dialog opens or urls change
  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex, onOpenChange]);
  
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
  
  const goToIndex = (index: number) => {
    if (index >= 0 && index < urls.length) {
      setIsLoaded(false);
      setError(false);
      setCurrentIndex(index);
    }
  };

  return {
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
  };
}
