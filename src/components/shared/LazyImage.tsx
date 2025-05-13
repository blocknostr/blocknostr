
import React, { useState } from 'react';
import { useInView } from './useInView';
import { cn } from '@/lib/utils';

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  loadingClassName?: string;
  errorClassName?: string;
}

export const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  className,
  loadingClassName = "animate-pulse bg-muted",
  errorClassName = "bg-muted/50",
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const handleLoad = () => {
    setIsLoaded(true);
  };

  const handleError = () => {
    setIsLoaded(true);
    setHasError(true);
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
      {inView && (
        <img
          src={src}
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
        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
          <span className="text-xs">Failed to load image</span>
        </div>
      )}
    </div>
  );
};

