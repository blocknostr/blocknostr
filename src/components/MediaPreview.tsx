
import { useState, useEffect } from 'react';
import { AspectRatio } from "@/components/ui/aspect-ratio";
import ImagePreview from './media/ImagePreview';
import VideoPreview from './media/VideoPreview';
import MediaLightbox from './media/MediaLightbox';
import MediaLoadingState from './media/MediaLoadingState';
import MediaErrorState from './media/MediaErrorState';
import ExpandButton from './media/ExpandButton';

interface MediaPreviewProps {
  url: string;
  alt?: string;
}

const MediaPreview = ({ url, alt }: MediaPreviewProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isVideo, setIsVideo] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);
  
  useEffect(() => {
    // Determine if the URL is for a video
    const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov'];
    setIsVideo(videoExtensions.some(ext => url.toLowerCase().endsWith(ext)));
    
    // Reset states when URL changes
    setIsLoaded(false);
    setError(false);
  }, [url]);
  
  const handleMediaLoad = () => {
    setIsLoaded(true);
  };
  
  const handleError = () => {
    setError(true);
  };
  
  return (
    <>
      <div className="mt-2 rounded-md overflow-hidden border border-border/40 bg-accent/10 relative group">
        <AspectRatio ratio={16/9} className="bg-muted max-h-80">
          {isVideo ? (
            <VideoPreview
              url={url}
              onLoad={handleMediaLoad}
              onError={handleError}
            />
          ) : (
            <ImagePreview
              url={url}
              alt={alt}
              onLoad={handleMediaLoad}
              onError={handleError}
            />
          )}
          
          {!isLoaded && !error && <MediaLoadingState />}
          {error && <MediaErrorState isVideo={isVideo} />}
          
          {isLoaded && !error && (
            <ExpandButton onClick={() => setIsOpen(true)} />
          )}
        </AspectRatio>
      </div>
      
      <MediaLightbox
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        url={url}
        alt={alt}
        isVideo={isVideo}
      />
    </>
  );
};

export default MediaPreview;
