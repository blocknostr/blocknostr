
import React from 'react';
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import ImagePreview from './ImagePreview';
import VideoPreview from './VideoPreview';

interface MediaContentProps {
  url: string;
  isVideo: boolean;
  isLoaded: boolean;
  error: boolean;
  onLoad: () => void;
  onError: () => void;
  index: number;
  totalItems: number;
  variant?: 'carousel' | 'lightbox';
}

const MediaContent: React.FC<MediaContentProps> = ({
  url,
  isVideo,
  isLoaded,
  error,
  onLoad,
  onError,
  index,
  totalItems,
  variant = 'carousel'
}) => {
  const isLightbox = variant === 'lightbox';
  
  if (error) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-muted/30">
        <div className="text-center p-4">
          <p className="text-sm text-muted-foreground mb-2">Failed to load media</p>
          <p className="text-xs text-muted-foreground/80 break-all max-w-[200px]">{url}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      {isVideo ? (
        <VideoPreview
          url={url}
          autoPlay={isLightbox}
          controls={isLightbox}
          onLoadedData={onLoad}
          onError={onError}
          className={isLightbox ? "max-h-[80vh] w-auto mx-auto" : "w-full h-full object-cover"}
        />
      ) : (
        <ImagePreview
          url={url}
          alt={`Media ${index + 1} of ${totalItems}`}
          onLoad={onLoad}
          onError={onError}
          className={cn(
            "w-full h-full",
            isLightbox ? "object-contain" : "object-cover"
          )}
        />
      )}

      {!isLoaded && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/30 backdrop-blur-sm">
          <Loader2 className="h-6 w-6 animate-spin text-primary/70" />
        </div>
      )}
    </div>
  );
};

export default MediaContent;
