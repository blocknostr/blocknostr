
import React, { useState } from 'react';
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
  autoPlayVideos?: boolean;
  dataSaverMode?: boolean;
}

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
  // Simple state management
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [forceLoad, setForceLoad] = useState(false);
  
  const isLightbox = variant === 'lightbox';
  
  // Detect media type
  const isVideo = url.match(/\.(mp4|webm|mov|avi|wmv|mkv|flv|m4v)(\?.*)?$/i) !== null;
  
  // Validate URL
  const isValidUrl = isValidMediaUrl(url);

  // Use intersection observer to detect when media is in view
  const { ref, inView } = useInView({
    threshold: 0.1,
    triggerOnce: false,
    skip: isLightbox // Skip for lightboxes, always load
  });

  // Handle click on placeholder to force load media
  const handlePlaceholderClick = () => {
    console.log('Media placeholder clicked, forcing load:', url);
    setForceLoad(true);
  };

  // Determine if media should load based on various factors
  const shouldLoad = (inView || isLightbox || forceLoad || dataSaverMode === false);
  
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
  const handleRetry = () => {
    if (retryCount < 2) {
      console.log(`Retrying media load (${retryCount + 1}/2):`, url);
      setRetryCount(prev => prev + 1);
      setError(false);
      setIsLoaded(false);
    }
  };
  
  // Invalid URL handling
  if (!isValidUrl) {
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
              autoPlay={isLightbox && autoPlayVideos}
              controls={isLightbox}
              onLoadedData={handleLoad}
              onError={handleError}
              className={isLightbox ? "w-full h-auto max-h-[80vh] object-contain" : undefined}
            />
          ) : (
            <ImagePreview
              url={url}
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
              url={url}
              onRetry={handleRetry}
              canRetry={retryCount < 2}
            />
          )}
        </>
      ) : (
        <div 
          className="bg-muted/30 animate-pulse flex items-center justify-center h-40 w-full cursor-pointer hover:bg-muted/40 transition-colors"
          onClick={handlePlaceholderClick}
          role="button"
          tabIndex={0}
          aria-label="Tap to load media"
        >
          <p className="text-xs text-muted-foreground">Tap to load media</p>
        </div>
      )}
    </div>
  );
};

export default React.memo(EnhancedMediaContent);
