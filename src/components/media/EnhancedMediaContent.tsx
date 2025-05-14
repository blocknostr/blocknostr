
import React, { useState, useEffect, useCallback } from 'react';
import { useInView } from '../shared/useInView';
import ImagePreview from './ImagePreview';
import VideoPreview from './VideoPreview';
import MediaLoadingState from './MediaLoadingState';
import MediaErrorState from './MediaErrorState';
import { cn } from '@/lib/utils';
import { isValidMediaUrl, normalizeUrl } from '@/lib/nostr/utils/media/media-validation';
import UrlRegistry from '@/lib/nostr/utils/media/url-registry';

interface EnhancedMediaContentProps {
  url: string;
  alt?: string;
  index?: number;
  totalItems?: number;
  variant?: 'lightbox' | 'carousel' | 'inline';
  className?: string;
  onLoad?: () => void;
  onError?: () => void;
  autoPlayVideos?: boolean;
  dataSaverMode?: boolean;
}

// Create an in-memory cache to track which media URLs have already been loaded
// This helps prevent duplicate loading attempts across components
const loadedMediaCache = new Map<string, 'loading' | 'success' | 'error'>();

const EnhancedMediaContent: React.FC<EnhancedMediaContentProps> = ({
  url,
  alt,
  index = 0,
  totalItems = 1,
  variant = 'inline',
  className,
  onLoad: externalOnLoad,
  onError: externalOnError,
  autoPlayVideos = false,
  dataSaverMode = false
}) => {
  // Normalize the URL to ensure consistent handling
  const normalizedUrl = React.useMemo(() => {
    try {
      return normalizeUrl(url);
    } catch (err) {
      console.warn('Failed to normalize URL:', url, err);
      return url;
    }
  }, [url]);
  
  // Register this URL with the registry
  useEffect(() => {
    try {
      UrlRegistry.registerUrl(normalizedUrl, 'media');
    } catch (err) {
      console.error('Error registering URL in registry:', normalizedUrl, err);
    }
    
    // Cleanup on unmount
    return () => {
      // Only clear if the component is unmounting and not just updating
      if (!document.hidden) {
        // We don't clear from registry on unmount because other components
        // might still need to know this URL is being/was rendered
        // Registry will be auto-cleared periodically instead
      }
    };
  }, [normalizedUrl]);

  // Get initial state from cache if available
  const cachedState = loadedMediaCache.get(normalizedUrl);
  const [isLoaded, setIsLoaded] = useState(cachedState === 'success');
  const [error, setError] = useState(cachedState === 'error');
  const [retryCount, setRetryCount] = useState(0);
  const isLightbox = variant === 'lightbox';
  
  // Detect media type
  const isVideo = React.useMemo(() => {
    try {
      return normalizedUrl.match(/\.(mp4|webm|mov|avi|wmv|mkv|flv|m4v)(\?.*)?$/i) !== null;
    } catch (err) {
      return false;
    }
  }, [normalizedUrl]);
  
  // Validate URL
  const [isValidUrl, setIsValidUrl] = useState(true);
  
  useEffect(() => {
    try {
      setIsValidUrl(isValidMediaUrl(normalizedUrl));
    } catch (err) {
      console.error('Error validating URL:', normalizedUrl, err);
      setIsValidUrl(false);
    }
    
    // Reset states when URL changes, but respect the cache
    const state = loadedMediaCache.get(normalizedUrl);
    if (state === 'success') {
      setIsLoaded(true);
      setError(false);
    } else if (state === 'error') {
      setIsLoaded(false);
      setError(true);
    } else {
      setIsLoaded(false);
      setError(false);
      setRetryCount(0);
      // Mark as loading in cache
      try {
        loadedMediaCache.set(normalizedUrl, 'loading');
      } catch (err) {
        console.error('Error updating media cache:', err);
      }
    }
  }, [normalizedUrl]);

  // Use intersection observer to detect when media is in view
  const { ref, inView } = useInView({
    threshold: 0.1,
    triggerOnce: false,
    skip: isLightbox // Skip for lightboxes, always load
  });

  // Only load media when in view or if it's a lightbox
  const shouldLoad = inView || isLightbox;
  
  // Handle media load event
  const handleLoad = () => {
    setIsLoaded(true);
    setError(false);
    // Update cache
    try {
      loadedMediaCache.set(normalizedUrl, 'success');
    } catch (err) {
      console.error('Error updating media cache on load:', err);
    }
    if (externalOnLoad) externalOnLoad();
  };
  
  // Handle media error event
  const handleError = () => {
    setError(true);
    // Update cache
    try {
      loadedMediaCache.set(normalizedUrl, 'error');
    } catch (err) {
      console.error('Error updating media cache on error:', err);
    }
    console.error(`Media failed to load: ${normalizedUrl}`);
    if (externalOnError) externalOnError();
  };

  // Handle retry
  const handleRetry = useCallback(() => {
    if (retryCount < 2) {
      console.log(`Retrying media load (${retryCount + 1}/2):`, normalizedUrl);
      setRetryCount(prev => prev + 1);
      setError(false);
      setIsLoaded(false);
      // Reset cache state
      try {
        loadedMediaCache.set(normalizedUrl, 'loading');
      } catch (err) {
        console.error('Error updating media cache on retry:', err);
      }
    }
  }, [retryCount, normalizedUrl]);
  
  // Invalid URL handling
  if (!isValidUrl) {
    console.warn("Invalid media URL detected:", normalizedUrl);
    return (
      <div className={cn(
        "relative overflow-hidden rounded-md border border-border/10",
        className
      )}>
        <MediaErrorState isVideo={isVideo} url={normalizedUrl} />
      </div>
    );
  }
  
  return (
    <div 
      ref={ref} 
      className={cn(
        "relative overflow-hidden",
        variant === 'inline' && "rounded-md border border-border/10",
        className
      )}
    >
      {shouldLoad ? (
        <>
          {isVideo ? (
            <VideoPreview
              url={normalizedUrl}
              autoPlay={isLightbox && autoPlayVideos}
              controls={isLightbox}
              onLoadedData={handleLoad}
              onError={handleError}
              className={isLightbox ? "w-full h-auto max-h-[80vh] object-contain" : undefined}
            />
          ) : (
            <ImagePreview
              url={normalizedUrl}
              alt={alt || `Media ${index + 1} of ${totalItems}`}
              onLoad={handleLoad}
              onError={handleError}
              className={isLightbox ? "w-full h-auto max-h-[80vh] object-contain" : undefined}
              lazyLoad={!isLightbox && !dataSaverMode}
              maxRetries={2}
            />
          )}
          
          {!isLoaded && !error && <MediaLoadingState />}
          {error && (
            <MediaErrorState 
              isVideo={isVideo} 
              url={normalizedUrl}
              onRetry={handleRetry}
              canRetry={retryCount < 2}
            />
          )}
        </>
      ) : (
        <div className="bg-muted/30 animate-pulse flex items-center justify-center h-40 w-full">
          <p className="text-xs text-muted-foreground">Tap to load media</p>
        </div>
      )}
    </div>
  );
};

export default React.memo(EnhancedMediaContent);
