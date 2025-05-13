
import React, { useState } from 'react';
import { useInView } from 'react-intersection-observer';
import { cn } from '@/lib/utils';

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  loadingClassName?: string;
  placeholderSrc?: string;
}

export const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  className,
  loadingClassName,
  placeholderSrc,
  ...props
}) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const { ref, inView } = useInView({
    triggerOnce: true,
    rootMargin: '200px 0px', // Start loading 200px before it comes into view
  });

  const handleLoad = () => setLoaded(true);
  const handleError = () => setError(true);

  return (
    <div 
      ref={ref} 
      className={cn(
        'relative overflow-hidden',
        !loaded && loadingClassName,
        className
      )}
    >
      {inView ? (
        <>
          <img
            src={error ? placeholderSrc || '/placeholder-image.jpg' : src}
            alt={alt}
            className={cn(
              'transition-opacity duration-300 ease-in-out object-cover w-full h-full',
              loaded ? 'opacity-100' : 'opacity-0'
            )}
            loading="lazy"
            onLoad={handleLoad}
            onError={handleError}
            {...props}
          />
          
          {/* Placeholder shown until image loads */}
          {!loaded && !error && (
            <div className={cn(
              'absolute inset-0 animate-pulse bg-muted',
              loadingClassName
            )} />
          )}
          
          {/* Error state */}
          {error && !placeholderSrc && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted text-muted-foreground">
              <span className="text-xs">Failed to load image</span>
            </div>
          )}
        </>
      ) : (
        // Show a placeholder until in view
        <div className={cn(
          'w-full h-full bg-muted',
          loadingClassName
        )} />
      )}
    </div>
  );
};
