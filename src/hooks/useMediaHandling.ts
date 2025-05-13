
import { useState, useEffect } from 'react';
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
    skip: variant === 'lightbox'
  });
  
  // Determine if we should load the media based on user preferences
  const shouldLoad = () => {
    if (variant === 'lightbox') return true;
    if (preload) return true;
    if (!inView) return false;
    
    if (mediaPrefs.dataSaverMode) {
      // In data saver mode, only load when in view
      return inView;
    }
    
    if (isVideo) {
      return mediaPrefs.autoPlayVideos;
    }
    
    return mediaPrefs.autoLoadImages;
  };
  
  // Determine media quality based on user preferences and data saver mode
  const getMediaQuality = (): string => {
    const preferredQuality = quality || mediaPrefs.preferredQuality;
    
    if (mediaPrefs.dataSaverMode) {
      // Always use low quality in data saver mode
      return 'low';
    }
    
    return preferredQuality;
  };
  
  // Handle media load event
  const handleLoad = () => {
    setIsLoaded(true);
    setError(false);
  };
  
  // Handle media error event
  const handleError = () => {
    setError(true);
    console.error(`Media failed to load: ${url}`);
  };
  
  // Handle play/pause for videos
  const handlePlayPause = () => {
    setPlaying(!playing);
  };
  
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
