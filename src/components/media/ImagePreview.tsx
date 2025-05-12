
import { useState } from 'react';
import { cn } from "@/lib/utils";

interface ImagePreviewProps {
  url: string;
  alt?: string;
  onLoad: () => void;
  onError: () => void;
  className?: string;
  lazyLoad?: boolean;
}

const ImagePreview = ({ 
  url, 
  alt, 
  onLoad, 
  onError, 
  className,
  lazyLoad = true
}: ImagePreviewProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  
  const handleLoad = () => {
    setIsLoaded(true);
    onLoad();
  };

  return (
    <>
      <img 
        src={url} 
        alt={alt || "Media attachment"} 
        className={cn(
          "w-full h-full object-cover transition-all duration-300",
          !isLoaded && "opacity-0",
          isLoaded && "opacity-100",
          className
        )}
        loading={lazyLoad ? "lazy" : "eager"}
        onLoad={handleLoad}
        onError={onError}
      />
      {!isLoaded && (
        <div className="absolute inset-0 bg-muted/30 animate-pulse" />
      )}
    </>
  );
};

export default ImagePreview;
