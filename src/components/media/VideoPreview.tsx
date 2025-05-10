
import { useState } from 'react';

interface VideoPreviewProps {
  url: string;
  onLoad: () => void;
  onError: () => void;
}

const VideoPreview = ({ url, onLoad, onError }: VideoPreviewProps) => {
  return (
    <video 
      src={url}
      className="w-full h-full object-cover transition-opacity duration-300"
      controls={false}
      autoPlay
      muted
      loop
      playsInline
      onLoadedData={onLoad}
      onError={onError}
    />
  );
};

export default VideoPreview;
