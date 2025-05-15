
import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { MediaItem } from '@/lib/nostr/utils/media/media-types';
import { extractYoutubeVideoId, extractCloudinaryData } from '@/lib/nostr/utils/media-extraction';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, FileImage, FileVideo, FileAudio } from 'lucide-react';
import { Toast } from '@/components/ui/toast';

interface MediaRendererProps {
  media: MediaItem;
  className?: string;
  aspectRatio?: 'auto' | 'square' | '16:9' | '4:3' | '1:1';
  fit?: 'cover' | 'contain';
  blurhashFallback?: boolean;
  showPreview?: boolean;
}

export const MediaRenderer: React.FC<MediaRendererProps> = ({
  media,
  className,
  aspectRatio = 'auto',
  fit = 'cover',
  blurhashFallback = false,
  showPreview = true,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  
  // Get aspect ratio CSS class
  const getAspectRatioClass = () => {
    switch (aspectRatio) {
      case 'square':
      case '1:1':
        return 'aspect-square';
      case '16:9':
        return 'aspect-video';
      case '4:3':
        return 'aspect-4/3';
      default:
        return '';
    }
  };
  
  // Handle sensitive content
  if (media.sensitiveContent && !showPreview) {
    return (
      <div className={cn(
        "bg-muted flex items-center justify-center relative overflow-hidden",
        getAspectRatioClass(),
        className
      )}>
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex flex-col items-center justify-center text-white p-4">
          <AlertCircle className="h-8 w-8 mb-2" />
          <h4 className="font-medium text-sm">Sensitive Content</h4>
          <p className="text-xs text-center max-w-xs mt-1">
            {media.description || "This media may contain sensitive content"}
          </p>
          <button 
            className="mt-3 px-4 py-1.5 bg-primary text-primary-foreground text-sm rounded-md"
            onClick={() => showPreview !== undefined}
          >
            Show content
          </button>
        </div>
      </div>
    );
  }
  
  // Render based on media type
  switch (media.type) {
    case 'image':
      return (
        <div className={cn(
          "relative overflow-hidden",
          getAspectRatioClass(),
          className
        )}>
          {isLoading && (
            <Skeleton className="absolute inset-0 z-10" />
          )}
          {hasError ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted">
              <FileImage className="h-8 w-8 text-muted-foreground mb-2" />
              <span className="text-xs text-muted-foreground">Failed to load image</span>
            </div>
          ) : (
            <img
              src={media.url}
              alt={media.alt || 'Image'}
              className={cn(
                "w-full h-full transition-opacity",
                fit === 'cover' ? 'object-cover' : 'object-contain',
                isLoading ? 'opacity-0' : 'opacity-100'
              )}
              onLoad={() => setIsLoading(false)}
              onError={() => {
                setHasError(true);
                setIsLoading(false);
              }}
              loading="lazy"
            />
          )}
        </div>
      );
      
    case 'video':
      return (
        <div className={cn(
          "relative overflow-hidden",
          getAspectRatioClass(),
          className
        )}>
          {isLoading && (
            <Skeleton className="absolute inset-0 z-10" />
          )}
          {hasError ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted">
              <FileVideo className="h-8 w-8 text-muted-foreground mb-2" />
              <span className="text-xs text-muted-foreground">Failed to load video</span>
            </div>
          ) : (
            <video
              src={media.url}
              controls
              preload="metadata"
              className={cn(
                "w-full h-full transition-opacity",
                fit === 'cover' ? 'object-cover' : 'object-contain',
                isLoading ? 'opacity-0' : 'opacity-100'
              )}
              onLoadedData={() => setIsLoading(false)}
              onError={() => {
                setHasError(true);
                setIsLoading(false);
              }}
            >
              Your browser does not support the video tag.
            </video>
          )}
        </div>
      );
      
    case 'audio':
      return (
        <div className={cn(
          "p-3 bg-muted/30 rounded-md overflow-hidden",
          className
        )}>
          {hasError ? (
            <div className="flex flex-col items-center justify-center py-4">
              <FileAudio className="h-8 w-8 text-muted-foreground mb-2" />
              <span className="text-xs text-muted-foreground">Failed to load audio</span>
            </div>
          ) : (
            <audio
              src={media.url}
              controls
              className="w-full"
              preload="metadata"
              onError={() => setHasError(true)}
            >
              Your browser does not support the audio element.
            </audio>
          )}
        </div>
      );
      
    case 'embed':
      // Handle YouTube URLs
      const youtubeId = extractYoutubeVideoId(media.url);
      if (youtubeId) {
        return (
          <div className={cn(
            "relative overflow-hidden",
            aspectRatio === 'auto' ? 'aspect-video' : getAspectRatioClass(),
            className
          )}>
            {isLoading && (
              <Skeleton className="absolute inset-0 z-10" />
            )}
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${youtubeId}`}
              className="absolute top-0 left-0 w-full h-full border-0"
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              onLoad={() => setIsLoading(false)}
              onError={() => {
                setHasError(true);
                setIsLoading(false);
              }}
              title={media.alt || "YouTube video"}
            />
          </div>
        );
      }
      
      // Handle Cloudinary
      const { id: cloudinaryId } = extractCloudinaryData(media.url);
      if (cloudinaryId && media.url.includes('cloudinary.com')) {
        return (
          <div className={cn(
            "relative overflow-hidden",
            getAspectRatioClass(),
            className
          )}>
            {isLoading && (
              <Skeleton className="absolute inset-0 z-10" />
            )}
            <img
              src={media.url}
              alt={media.alt || 'Cloudinary image'}
              className={cn(
                "w-full h-full transition-opacity",
                fit === 'cover' ? 'object-cover' : 'object-contain',
                isLoading ? 'opacity-0' : 'opacity-100'
              )}
              onLoad={() => setIsLoading(false)}
              onError={() => {
                setHasError(true);
                setIsLoading(false);
              }}
              loading="lazy"
            />
          </div>
        );
      }
      
      // Default embed
      return (
        <div className={cn(
          "relative overflow-hidden",
          getAspectRatioClass(),
          className
        )}>
          <div className="p-3 border rounded-md">
            <a 
              href={media.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline text-sm"
            >
              {media.alt || media.url}
            </a>
          </div>
        </div>
      );
      
    default:
      return null;
  }
};

export default MediaRenderer;
