import React, { useState, useCallback, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { ImageOff, Loader2 } from 'lucide-react';

interface SafeImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  fallbackSrc?: string;
  showLoadingSpinner?: boolean;
  showErrorIcon?: boolean;
  errorText?: string;
  onError?: (error: Event) => void;
  onLoad?: (event: Event) => void;
  retryAttempts?: number;
  retryDelay?: number;
  loading?: 'lazy' | 'eager';
}

/**
 * SafeImage - A robust image component that handles network errors gracefully
 * Features:
 * - Automatic retry on network failures
 * - Graceful fallback to placeholder or alternative image
 * - Loading states with optional spinner
 * - Error states with optional icon
 * - CORS error handling
 * - Network timeout handling
 */
export const SafeImage: React.FC<SafeImageProps> = ({
  src,
  alt,
  fallbackSrc,
  showLoadingSpinner = true,
  showErrorIcon = true,
  errorText = "Image unavailable",
  onError,
  onLoad,
  retryAttempts = 2,
  retryDelay = 1000,
  loading,
  className,
  ...props
}) => {
  const [currentSrc, setCurrentSrc] = useState(src);
  const [imageState, setImageState] = useState<'loading' | 'loaded' | 'error'>('loading');
  const [retryCount, setRetryCount] = useState(0);

  // Reset state when src changes
  useEffect(() => {
    setCurrentSrc(src);
    setImageState('loading');
    setRetryCount(0);
  }, [src]);

  const handleLoad = useCallback((event: React.SyntheticEvent<HTMLImageElement>) => {
    setImageState('loaded');
    if (onLoad) {
      onLoad(event.nativeEvent);
    }
  }, [onLoad]);

  const handleError = useCallback((event: React.SyntheticEvent<HTMLImageElement>) => {
    console.debug(`[SafeImage] Image load failed: ${currentSrc}`);
    
    // Try fallback src first if available and this isn't already the fallback
    if (fallbackSrc && currentSrc !== fallbackSrc) {
      console.debug(`[SafeImage] Trying fallback: ${fallbackSrc}`);
      setCurrentSrc(fallbackSrc);
      setRetryCount(0);
      return;
    }

    // Retry the original source if we have attempts left
    if (retryCount < retryAttempts && currentSrc === src) {
      console.debug(`[SafeImage] Retry attempt ${retryCount + 1}/${retryAttempts} for: ${src}`);
      setRetryCount(prev => prev + 1);
      
      // Add a small delay before retry to handle temporary network issues
      setTimeout(() => {
        setCurrentSrc(`${src}?retry=${retryCount + 1}`);
      }, retryDelay);
      return;
    }

    // All retry attempts exhausted or fallback failed
    setImageState('error');
    
    if (onError) {
      onError(event.nativeEvent);
    }
  }, [currentSrc, fallbackSrc, retryCount, retryAttempts, retryDelay, src, onError]);

  // Handle case where image is already cached and loads immediately
  const handleImageRef = useCallback((img: HTMLImageElement | null) => {
    if (img && img.complete && img.naturalWidth > 0) {
      setImageState('loaded');
    }
  }, []);

  if (imageState === 'error') {
    return (
      <div 
        className={cn(
          "flex flex-col items-center justify-center bg-muted/50 border border-muted rounded",
          "text-muted-foreground text-sm",
          className
        )}
        {...props}
      >
        {showErrorIcon && <ImageOff className="h-8 w-8 mb-2 opacity-50" />}
        <span className="text-xs text-center px-2">{errorText}</span>
      </div>
    );
  }

  return (
    <div className="relative">
      <img
        ref={handleImageRef}
        src={currentSrc}
        alt={alt}
        onLoad={handleLoad}
        onError={handleError}
        loading={loading}
        className={cn(
          imageState === 'loading' ? 'opacity-0' : 'opacity-100',
          'transition-opacity duration-200',
          className
        )}
        {...props}
      />
      
      {imageState === 'loading' && showLoadingSpinner && (
        <div className={cn(
          "absolute inset-0 flex items-center justify-center bg-muted/30 rounded",
          className
        )}>
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}
    </div>
  );
};

export default SafeImage; 