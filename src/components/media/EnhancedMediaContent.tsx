
import React, { useState, useEffect, useCallback } from 'react';
import { useInView } from '../shared/useInView';
import ImagePreview from './ImagePreview';
import VideoPreview from './VideoPreview';
import MediaLoadingState from './MediaLoadingState';
import MediaErrorState from './MediaErrorState';
import { cn } from '@/lib/utils';
import { isValidMediaUrl } from '@/lib/nostr/utils/media/media-validation';
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
  onError: externalOnError
}) => {
  // Register this URL with the registry
  useEffect(() => {
    UrlRegistry.registerUrl(url, 'media');
    
    // Cleanup on unmount
    return () => {
      // Only clear if the component is unmounting and not just updating
      if (!document.hidden) {
        // We don't clear from registry on unmount because other components
        // might still need to know this URL is being/was rendered
        // Registry will be auto-cleared periodically instead
      }
    };
  }, [url]);

  // Get initial state from cache if available
  const cachedState = loadedMediaCache.get(url);
  const [isLoaded, setIsLoaded] = useState(cachedState === 'success');
  const [error, setError] = useState(cachedState === 'error');
  const [retryCount, setRetryCount] = useState(0);
  const isLightbox = variant === 'lightbox';
  const isVideo = url.match(/\.(mp4|webm|mov|avi|wmv|mkv|flv|m4v)(\?.*)?$/i) !== null;
  
  // Validate URL
  const [isValidUrl, setIsValidUrl] = useState(true);
  
  useEffect(() => {
    setIsValidUrl(isValidMediaUrl(url));
    
    // Reset states when URL changes, but respect the cache
    const state = loadedMediaCache.get(url);
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
      loadedMediaCache.set(url, 'loading');
    }
  }, [url]);

  // Use intersection observer to detect when media is in view
  const { ref, inView } = useInView({
    threshold: 0.1,
    triggerOnce: false
  });

  // Only load media when in view or if it's a lightbox
  const shouldLoad = inView || isLightbox;
  
  // Handle media load event
  const handleLoad = () => {
    setIsLoaded(true);
    setError(false);
    // Update cache
    loadedMediaCache.set(url, 'success');
    if (externalOnLoad) externalOnLoad();
  };
  
  // Handle media error event
  const handleError = () => {
    setError(true);
    // Update cache
    loadedMediaCache.set(url, 'error');
    console.error(`Media failed to load: ${url}`);
    if (externalOnError) externalOnError();
  };

  // Handle retry
  const handleRetry = useCallback(() => {
    if (retryCount < 2) {
      console.log(`Retrying media load (${retryCount + 1}/2):`, url);
      setRetryCount(prev => prev + 1);
      setError(false);
      setIsLoaded(false);
      // Reset cache state
      loadedMediaCache.set(url, 'loading');
    }
  }, [retryCount, url]);
  
  // Invalid URL handling
  if (!isValidUrl) {
    console.warn("Invalid media URL detected:", url);
    return (
      <div className={cn(
        "relative overflow-hidden rounded-md border border-border/10",
        className
      )}>
        <MediaErrorState isVideo={isVideo} url={url} />
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
              url={url}
              onLoad={handleLoad}
              onError={handleError}
              autoPlay={isLightbox}
              controls={isLightbox}
              className={isLightbox ? "w-full h-auto max-h-[80vh] object-contain" : undefined}
            />
          ) : (
            <ImagePreview
              url={url}
              alt={alt || `Media ${index + 1} of ${totalItems}`}
              onLoad={handleLoad}
              onError={handleError}
              className={isLightbox ? "w-full h-auto max-h-[80vh] object-contain" : undefined}
              lazyLoad={!isLightbox}
              maxRetries={2}
            />
          )}
          
          {!isLoaded && !error && <MediaLoadingState />}
          {error && (
            <MediaErrorState 
              isVideo={isVideo} 
              url={url}
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
