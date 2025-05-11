
import { useState } from 'react';
import { cn } from "@/lib/utils";

interface VideoPreviewProps {
  url: string;
  onLoad: () => void;
  onError: () => void;
  autoPlay?: boolean;
  controls?: boolean;
  className?: string;
}

const VideoPreview = ({ 
  url, 
  onLoad, 
  onError, 
  autoPlay = false,
  controls = false,
  className 
}: VideoPreviewProps) => {
  return (
    <video 
      src={url}
      className={cn("w-full h-full object-cover transition-opacity duration-300", className)}
      controls={controls}
      autoPlay={autoPlay}
      muted
      loop
      playsInline
      onLoadedData={onLoad}
      onError={onError}
    />
  );
};

export default VideoPreview;
