import { useState, useEffect, useCallback } from 'react';
import { useInView } from '../components/shared/useInView';

interface MediaHandlingOptions {
  url: string;
  isVideo?: boolean;
  variant?: 'lightbox' | 'carousel' | 'inline' | 'profile';
  preload?: boolean;
}

export function useMediaHandling({
  url,
  isVideo = false,
  variant = 'inline',
  preload = false,
}: MediaHandlingOptions) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [everInView, setEverInView] = useState(false); // New state

  const { ref, inView } = useInView({
    threshold: 0.1, // Start loading when 10% of the item is visible
    // triggerOnce is false by default in the provided useInView hook, which is what we want for dynamic video play/pause
    skip: preload, // If preload is true, skip intersection observer and load immediately
  });

  // Update everInView when inView becomes true
  useEffect(() => {
    if (inView && !everInView) {
      setEverInView(true);
    }
  }, [inView, everInView]);

  // Reset state when URL changes
  useEffect(() => {
    setIsLoaded(false);
    setError(false);
    setPlaying(false);
    setEverInView(preload); // If preloading, it's considered as having been in view
    if (preload && isVideo) {
      setPlaying(true);
    }
  }, [url, preload, isVideo]);

  // Determine if we should load the media
  // Media should load if it has ever been in view or if preload is true.
  const shouldLoad = everInView || preload;

  // Effect to manage video playing state based on inView
  useEffect(() => {
    if (isVideo) {
      if (inView || preload) {
        setPlaying(true); // Play if in view or preloading
      } else {
        setPlaying(false); // Pause if not in view (and not preloading)
      }
    }
  }, [inView, isVideo, preload]);

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
    setError(false);
  }, []);

  const handleError = useCallback(() => {
    setError(true);
    setIsLoaded(false);
    console.error(`Media failed to load: ${url}`);
  }, [url]);

  return {
    ref,
    inView, // Expose inView for debugging or other conditional logic if needed
    isLoaded,
    error,
    playing,
    shouldLoad,
    handleLoad,
    handleError,
    everInView, // Expose everInView for debugging or other conditional logic
  };
}
