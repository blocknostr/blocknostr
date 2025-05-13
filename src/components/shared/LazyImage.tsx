
import React, { useState, useEffect } from 'react';
import { useInView } from './useInView';
import { cn } from '@/lib/utils';
import { AlertTriangle } from 'lucide-react';
import { isSecureUrl } from '@/lib/nostr/utils/media/media-validation';
import { handleError } from '@/lib/utils/errorHandling';

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  loadingClassName?: string;
  errorClassName?: string;
  onLoadSuccess?: () => void;
  onLoadError?: () => void;
  fallbackText?: string;
  priority?: boolean; // If true, load immediately without lazy loading
}

export const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  className,
  loadingClassName = "animate-pulse bg-muted",
  errorClassName = "bg-muted/50",
  onLoadSuccess,
  onLoadError,
  fallbackText = "Failed to load image",
  priority = false,
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
    skip: priority // Skip intersection observer if priority is true
  });
  
  // Validate URL early
  const isValidUrl = React.useMemo(() => {
    try {
      return !!src && isSecureUrl(src);
    } catch (error) {
      console.warn("Invalid image URL:", src);
      return false;
    }
  }, [src]);
  
  // Create a memoized version of the URL with cache-busting for consistency
  const imageUrl = React.useMemo(() => {
    if (!isValidUrl) return '';
    
    // Generate consistent cache busting parameter
    const cacheBuster = retryCount > 0 ? `retry=${retryCount}` : '';
    
    if (!cacheBuster) return src;
    
    return src.includes('?') 
      ? `${src}&${cacheBuster}` 
      : `${src}?${cacheBuster}`;
  }, [src, retryCount, isValidUrl]);

  // Effect to handle image retry logic
  useEffect(() => {
    if (hasError && retryCount < 2) {
      // Add a small delay before retry
      const timer = setTimeout(() => {
        console.log(`Retrying image load (${retryCount + 1}/2):`, src);
        setHasError(false);
        setIsLoaded(false);
        setRetryCount(prev => prev + 1);
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [hasError, retryCount, src]);
  
  // Set initial error state if URL is invalid
  useEffect(() => {
    if (!isValidUrl) {
      setHasError(true);
      setIsLoaded(true);
      if (onLoadError) onLoadError();
    }
  }, [isValidUrl, onLoadError]);

  const handleLoad = () => {
    setIsLoaded(true);
    setHasError(false);
    if (onLoadSuccess) onLoadSuccess();
  };

  const handleError = () => {
    console.warn("Image failed to load:", imageUrl);
    setHasError(true);
    setIsLoaded(true);
    if (onLoadError) onLoadError();
  };
  
  const handleRetry = () => {
    if (retryCount < 3) {
      console.log("Manually retrying image load:", src);
      setHasError(false);
      setIsLoaded(false);
      setRetryCount(prev => prev + 1);
    }
  };

  return (
    <div 
      ref={ref}
      className={cn(
        "relative overflow-hidden",
        !isLoaded && loadingClassName,
        hasError && errorClassName,
        className
      )}
    >
      {/* Only render image if in view or priority loading */}
      {(inView || priority) && !hasError && isValidUrl && (
        <img
          src={imageUrl}
          alt={alt}
          className={cn(
            "transition-opacity duration-300",
            !isLoaded && "opacity-0",
            isLoaded && "opacity-100",
          )}
          loading={priority ? "eager" : "lazy"}
          onLoad={handleLoad}
          onError={handleError}
          {...props}
        />
      )}
      
      {hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
          <AlertTriangle className="h-5 w-5 mb-1 opacity-60" />
          <span className="text-xs">{fallbackText}</span>
          {retryCount < 3 && (
            <button 
              onClick={handleRetry}
              className="text-xs mt-1 text-primary hover:underline"
            >
              Retry
            </button>
          )}
        </div>
      )}
    </div>
  );
};
