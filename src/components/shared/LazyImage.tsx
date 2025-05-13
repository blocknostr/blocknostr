
import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  loadingClassName?: string;
  errorClassName?: string;
  fallbackSrc?: string;
}

export const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  className,
  loadingClassName,
  errorClassName,
  fallbackSrc,
  ...props
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [imgSrc, setImgSrc] = useState<string | undefined>(undefined);
  const [isInView, setIsInView] = useState(false);
  const imgRef = React.useRef<HTMLImageElement>(null);
  
  useEffect(() => {
    if (!src) {
      setError(true);
      setIsLoading(false);
      return;
    }

    // Reset states when src changes
    setIsLoading(true);
    setError(false);
    
    // Use Intersection Observer to only load when in viewport
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 } // Start loading when 10% visible
    );

    const currentRef = imgRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [src]);
  
  // When in view, load the image
  useEffect(() => {
    if (!isInView || !src) return;
    
    // Create new image object to preload
    const img = new Image();
    img.src = src;
    
    img.onload = () => {
      setImgSrc(src);
      setIsLoading(false);
    };
    
    img.onerror = () => {
      setError(true);
      setIsLoading(false);
      if (fallbackSrc) {
        setImgSrc(fallbackSrc);
      }
    };
    
    // Clean up
    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [src, fallbackSrc, isInView]);

  return (
    <div
      ref={imgRef}
      className={cn(
        "overflow-hidden",
        isLoading ? loadingClassName : "",
        error && !fallbackSrc ? errorClassName : "",
        className
      )}
    >
      {isInView && !error && imgSrc && (
        <img
          src={imgSrc}
          alt={alt || "Image"}
          className={cn(
            "w-full h-full object-cover transition-opacity duration-300",
            isLoading ? "opacity-0" : "opacity-100"
          )}
          onError={() => setError(true)}
          {...props}
        />
      )}
      
      {isLoading && (
        <div className={cn(
          "flex items-center justify-center w-full h-full bg-muted/30",
          loadingClassName
        )}>
          <div className="h-4 w-4 rounded-full border-2 border-t-transparent border-primary animate-spin" />
        </div>
      )}
      
      {error && !fallbackSrc && (
        <div className={cn(
          "flex items-center justify-center w-full h-full bg-muted/30 text-muted-foreground text-sm",
          errorClassName
        )}>
          Failed to load image
        </div>
      )}
    </div>
  );
};
