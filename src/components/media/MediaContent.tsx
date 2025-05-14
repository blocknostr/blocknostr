
import React from 'react';
import { cn } from "@/lib/utils";
import { AlertTriangle } from "lucide-react";
import ImagePreview from './ImagePreview';
import VideoPreview from './VideoPreview';

interface MediaContentProps {
  url: string;
  alt?: string;
  className?: string;
  onLoad?: () => void;
  onError?: () => void;
}

const MediaContent: React.FC<MediaContentProps> = ({
  url,
  alt = "Media content",
  className,
  onLoad,
  onError
}) => {
  // Simple media type detection
  const isVideo = url.match(/\.(mp4|webm|mov)(\?.*)?$/i) !== null;
  
  return (
    <div className={cn("relative overflow-hidden", className)}>
      {isVideo ? (
        <VideoPreview 
          url={url}
          autoPlay={false}
          controls={true}
          onLoadedData={onLoad}
          onError={onError}
          className="w-full h-full object-cover"
        />
      ) : (
        <ImagePreview
          url={url}
          alt={alt}
          onLoad={onLoad}
          onError={onError}
          className="w-full h-full object-cover"
        />
      )}
    </div>
  );
};

export default MediaContent;
