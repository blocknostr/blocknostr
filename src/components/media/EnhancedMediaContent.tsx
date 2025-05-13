
import React, { useState, useEffect, useCallback } from 'react';
import { useInView } from '../shared/useInView';
import ImagePreview from './ImagePreview';
import VideoPreview from './VideoPreview';
import MediaLoadingState from './MediaLoadingState';
import MediaErrorState from './MediaErrorState';
import { cn } from '@/lib/utils';
import { isValidMediaUrl } from '@/lib/nostr/utils/media/media-validation';

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
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const isLightbox = variant === 'lightbox';
  const isVideo = url.match(/\.(mp4|webm|mov|avi|wmv|mkv|flv|m4v)(\?.*)?$/i) !== null;
  
  // Validate URL
  const [isValidUrl, setIsValidUrl] = useState(true);
  
  useEffect(() => {
    setIsValidUrl(isValidMediaUrl(url));
    // Reset states when URL changes
    setIsLoaded(false);
    setError(false);
    setRetryCount(0);
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
    if (externalOnLoad) externalOnLoad();
  };
  
  // Handle media error event
  const handleError = () => {
    setError(true);
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

export default EnhancedMediaContent;
