
import { useState, useEffect, useRef } from 'react';
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
  const initialUrlRef = useRef(url);
  
  // Generate consistent cache-busting URL with the same pattern as LazyImage
  const currentUrl = React.useMemo(() => {
    // No retry attempt yet - use original URL
    if (retryCount === 0) return url;
    
    // Use consistent retry parameter format
    const cacheBuster = `retry=${retryCount}`;
    return url.includes('?') ? `${url}&${cacheBuster}` : `${url}?${cacheBuster}`;
  }, [url, retryCount]);
  
  // Reset state if URL base changes (not just cache parameters)
  useEffect(() => {
    // Only reset if the base URL actually changed
    const baseUrl = url.split('?')[0];
    const prevBaseUrl = initialUrlRef.current.split('?')[0];
    
    if (baseUrl !== prevBaseUrl) {
      setIsLoaded(false);
      setRetryCount(0);
      initialUrlRef.current = url;
    }
  }, [url]);
  
  const handleLoad = () => {
    setIsLoaded(true);
    onLoad();
  };
  
  const handleError = () => {
    console.warn(`Image failed to load: ${currentUrl} (attempt ${retryCount + 1}/${maxRetries + 1})`);
    
    if (retryCount < maxRetries) {
      setRetryCount(prev => prev + 1);
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
