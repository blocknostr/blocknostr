
import React from 'react';
import ImagePreview from './ImagePreview';
import VideoPreview from './VideoPreview';
import MediaLoadingState from './MediaLoadingState';
import MediaErrorState from './MediaErrorState';

interface MediaContentProps {
  url: string;
  isVideo: boolean;
  isLoaded: boolean;
  error: boolean;
  onLoad: () => void;
  onError: () => void;
  index?: number;
  totalItems?: number;
  variant?: 'lightbox' | 'carousel';
}

const MediaContent: React.FC<MediaContentProps> = ({
  url,
  isVideo,
  isLoaded,
  error,
  onLoad,
  onError,
  index = 0,
  totalItems = 1,
  variant = 'carousel'
}) => {
  const isLightbox = variant === 'lightbox';
  
  return (
    <>
      {isVideo ? (
        <VideoPreview
          url={url}
          onLoad={onLoad}
          onError={onError}
          autoPlay={isLightbox}
          controls={isLightbox}
          className={isLightbox ? "w-full h-auto max-h-[80vh] object-contain" : undefined}
        />
      ) : (
        <ImagePreview
          url={url}
          alt={`Media ${index + 1} of ${totalItems}`}
          onLoad={onLoad}
          onError={onError}
          className={isLightbox ? "w-full h-auto max-h-[80vh] object-contain" : undefined}
        />
      )}
      
      {!isLoaded && !error && <MediaLoadingState />}
      {error && <MediaErrorState isVideo={isVideo} />}
    </>
  );
};

export default MediaContent;
