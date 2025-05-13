import { useState, useCallback } from 'react';
import { isVideoUrl } from '@/lib/nostr/utils/media-extraction';

interface UseMediaNavigationProps {
  urls: string[];
  initialIndex?: number;
}

export function useMediaNavigation({ urls, initialIndex = 0 }: UseMediaNavigationProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);
  
  // Get current URL
  const currentUrl = urls[currentIndex] || '';
  
  // Check if current URL is a video
  const isVideo = isVideoUrl(currentUrl);
  
  // Check if there's only one item
  const isSingleItem = urls.length <= 1;
  
  // Handler for navigation
  const handleNext = useCallback(() => {
    if (currentIndex < urls.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsLoaded(false);
      setError(false);
    } else {
      // Loop back to the first item
      setCurrentIndex(0);
      setIsLoaded(false);
      setError(false);
    }
  }, [currentIndex, urls.length]);
  
  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsLoaded(false);
      setError(false);
    } else {
      // Loop to the last item
      setCurrentIndex(urls.length - 1);
      setIsLoaded(false);
      setError(false);
    }
  }, [currentIndex, urls.length]);
  
  // Go to specific index
  const goToIndex = useCallback((index: number) => {
    if (index >= 0 && index < urls.length) {
      setCurrentIndex(index);
      setIsLoaded(false);
      setError(false);
    }
  }, [urls.length]);
  
  // Handlers for media loading
  const handleMediaLoad = useCallback(() => {
    setIsLoaded(true);
    setError(false);
  }, []);
  
  const handleError = useCallback(() => {
    setIsLoaded(true);
    setError(true);
  }, []);
  
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
