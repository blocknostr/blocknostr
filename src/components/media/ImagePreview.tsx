
import { useState, useEffect } from 'react';
import { cn } from "@/lib/utils";

interface ImagePreviewProps {
  url: string;
  alt?: string;
  onLoad: () => void;
  onError: () => void;
  className?: string;
  lazyLoad?: boolean;
  maxRetries?: number;
}

const ImagePreview = ({ 
  url, 
  alt, 
  onLoad, 
  onError, 
  className,
  lazyLoad = true,
  maxRetries = 2
}: ImagePreviewProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [currentUrl, setCurrentUrl] = useState(url);
  
  // Reset state if URL changes
  useEffect(() => {
    setIsLoaded(false);
    setRetryCount(0);
    setCurrentUrl(url);
  }, [url]);
  
  const handleLoad = () => {
    setIsLoaded(true);
    onLoad();
  };
  
  const handleError = () => {
    console.warn(`Image failed to load: ${currentUrl} (attempt ${retryCount + 1}/${maxRetries + 1})`);
    
    if (retryCount < maxRetries) {
      // Add cache-busting parameter for retry
      const nextUrl = url.includes('?') 
        ? `${url}&retry=${retryCount + 1}` 
        : `${url}?retry=${retryCount + 1}`;
      
      setRetryCount(prev => prev + 1);
      setCurrentUrl(nextUrl);
    } else {
      onError();
    }
  };

  return (
    <>
      <img 
        src={currentUrl} 
        alt={alt || "Media attachment"} 
        className={cn(
          "w-full h-full object-cover transition-all duration-300",
          !isLoaded && "opacity-0",
          isLoaded && "opacity-100",
          className
        )}
        loading={lazyLoad ? "lazy" : "eager"}
        onLoad={handleLoad}
        onError={handleError}
      />
      {!isLoaded && (
        <div className="absolute inset-0 bg-muted/30 animate-pulse" />
      )}
    </>
  );
};

export default ImagePreview;
