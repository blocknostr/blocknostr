
import { useState, useEffect, useCallback } from 'react';
import { useMediaPreferences } from './useMediaPreferences';
import { useInView } from '../components/shared/useInView';

interface MediaHandlingConfig {
  autoPlayVideos?: boolean;
  lazyLoadImages?: boolean;
  preferredQuality?: 'high' | 'medium' | 'low';
  disablePreloading?: boolean;
  lightboxEnabled?: boolean;
}

interface MediaHandlingOptions {
  url: string;
  isVideo?: boolean;
  variant?: 'lightbox' | 'carousel' | 'inline' | 'profile';
  preload?: boolean;
  quality?: 'high' | 'medium' | 'low';
}

export function useMediaHandling({
  url,
  isVideo = false,
  variant = 'inline',
  preload = false,
  quality
}: MediaHandlingOptions) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [playing, setPlaying] = useState(false);
  const { mediaPrefs } = useMediaPreferences();
  
  // Use intersection observer to detect when media is in view
  const { ref, inView } = useInView({
    threshold: 0.1,
    triggerOnce: false,
    // Always load media in lightbox mode
    skip: variant === 'lightbox' || preload
  });
  
  // Reset state when URL changes
  useEffect(() => {
    setIsLoaded(false);
    setError(false);
    setPlaying(false);
  }, [url]);
  
  // Determine if we should load the media based on user preferences
  const shouldLoad = useCallback(() => {
    // Always load in these cases regardless of preferences
    if (variant === 'lightbox') return true;
    if (preload) return true;
    
    // If not yet in view, don't load
    if (!inView) return false;
    
    // In data saver mode, require explicit user action except for in-view images
    if (mediaPrefs.dataSaverMode) {
      // In data saver mode, load images but not videos
      return !isVideo;
    }
    
    // Normal mode - load according to preferences
    if (isVideo) {
      return mediaPrefs.autoPlayVideos || inView;
    }
    
    return mediaPrefs.autoLoadImages || inView;
  }, [variant, preload, inView, isVideo, mediaPrefs]);
  
  // Determine media quality based on user preferences and data saver mode
  const getMediaQuality = useCallback((): string => {
    const preferredQuality = quality || mediaPrefs.preferredQuality;
    
    if (mediaPrefs.dataSaverMode) {
      // Always use low quality in data saver mode
      return 'low';
    }
    
    return preferredQuality;
  }, [quality, mediaPrefs]);
  
  // Handle media load event
  const handleLoad = useCallback(() => {
    setIsLoaded(true);
    setError(false);
  }, []);
  
  // Handle media error event
  const handleError = useCallback(() => {
    setError(true);
    console.error(`Media failed to load: ${url}`);
  }, [url]);
  
  // Handle play/pause for videos
  const handlePlayPause = useCallback(() => {
    setPlaying(prev => !prev);
  }, []);
  
  return {
    ref,
    inView,
    isLoaded,
    error,
    playing,
    shouldLoad: shouldLoad(),
    quality: getMediaQuality(),
    handleLoad,
    handleError,
    handlePlayPause
  };
}
