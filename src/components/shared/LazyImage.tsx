
import React, { useState, useEffect } from 'react';
import { useInView } from './useInView';
import { cn } from '@/lib/utils';
import { AlertTriangle } from 'lucide-react';

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  loadingClassName?: string;
  errorClassName?: string;
  onLoadSuccess?: () => void;
  onLoadError?: () => void;
  fallbackText?: string;
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
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });
  
  // Create a memoized version of the URL with cache-busting for consistency
  const imageUrl = React.useMemo(() => {
    // Generate consistent cache busting parameter
    const cacheBuster = retryCount > 0 ? `retry=${retryCount}` : '';
    
    if (!cacheBuster) return src;
    
    return src.includes('?') 
      ? `${src}&${cacheBuster}` 
      : `${src}?${cacheBuster}`;
  }, [src, retryCount]);

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
      {inView && !hasError && (
        <img
          src={imageUrl}
          alt={alt}
          className={cn(
            "transition-opacity duration-300",
            !isLoaded && "opacity-0",
            isLoaded && "opacity-100",
          )}
          loading="lazy"
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
