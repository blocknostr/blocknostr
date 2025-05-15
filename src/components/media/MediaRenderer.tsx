
import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { MediaItem } from '@/lib/nostr/utils/media/media-types';
import { 
  extractYoutubeVideoId, 
  extractVimeoVideoId,
  extractCloudinaryData,
  extractSoundcloudData,
  extractSpotifyData,
  extractTwitterData
} from '@/lib/nostr/utils/media-extraction';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, FileImage, FileVideo, FileAudio, Music, ExternalLink } from 'lucide-react';

interface MediaRendererProps {
  media: MediaItem;
  className?: string;
  aspectRatio?: 'auto' | 'square' | '16:9' | '4:3' | '1:1';
  fit?: 'cover' | 'contain';
  blurhashFallback?: boolean;
  showPreview?: boolean;
  controls?: boolean;
  muted?: boolean;
  autoplay?: boolean;
  loop?: boolean;
  preload?: 'auto' | 'metadata' | 'none';
  onClick?: (media: MediaItem) => void;
}

export const MediaRenderer: React.FC<MediaRendererProps> = ({
  media,
  className,
  aspectRatio = 'auto',
  fit = 'cover',
  blurhashFallback = false,
  showPreview = true,
  controls = true,
  muted = true,
  autoplay = false,
  loop = false,
  preload = 'metadata',
  onClick
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
  
  // Handle media click
  const handleMediaClick = () => {
    if (onClick) {
      onClick(media);
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
        <div 
          className={cn(
            "relative overflow-hidden",
            getAspectRatioClass(),
            className
          )}
          onClick={handleMediaClick}
        >
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
                isLoading ? 'opacity-0' : 'opacity-100',
                onClick ? 'cursor-pointer' : ''
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
        <div 
          className={cn(
            "relative overflow-hidden",
            getAspectRatioClass(),
            className
          )}
        >
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
              poster={media.poster}
              controls={controls}
              muted={muted}
              autoPlay={autoplay}
              loop={loop}
              preload={preload}
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
              onClick={handleMediaClick}
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
            <div className="flex gap-4 items-center">
              {media.coverArt && (
                <div className="flex-shrink-0">
                  <img 
                    src={media.coverArt} 
                    alt="Cover art" 
                    className="h-16 w-16 object-cover rounded"
                  />
                </div>
              )}
              <div className="flex-1">
                {media.alt && (
                  <div className="text-sm mb-1 font-medium truncate">{media.alt}</div>
                )}
                <audio
                  src={media.url}
                  controls={controls}
                  autoPlay={autoplay}
                  loop={loop}
                  preload={preload}
                  className="w-full"
                  onError={() => setHasError(true)}
                >
                  Your browser does not support the audio element.
                </audio>
              </div>
            </div>
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
              src={`https://www.youtube-nocookie.com/embed/${youtubeId}?rel=0`}
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
      
      // Handle Vimeo URLs
      const vimeoId = extractVimeoVideoId(media.url);
      if (vimeoId) {
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
              src={`https://player.vimeo.com/video/${vimeoId}`}
              className="absolute top-0 left-0 w-full h-full border-0"
              allowFullScreen
              allow="autoplay; fullscreen; picture-in-picture"
              onLoad={() => setIsLoading(false)}
              onError={() => {
                setHasError(true);
                setIsLoading(false);
              }}
              title={media.alt || "Vimeo video"}
            />
          </div>
        );
      }
      
      // Handle SoundCloud URLs
      const soundcloudData = extractSoundcloudData(media.url);
      if (soundcloudData) {
        return (
          <div className={cn(
            "relative overflow-hidden border rounded-md",
            className
          )}>
            {isLoading && (
              <Skeleton className="h-28 w-full" />
            )}
            <iframe
              src={`https://w.soundcloud.com/player/?url=${encodeURIComponent(media.url)}&color=%23ff5500&auto_play=false&hide_related=true&show_comments=false&show_user=true`}
              className="w-full border-0"
              height="166"
              onLoad={() => setIsLoading(false)}
              onError={() => {
                setHasError(true);
                setIsLoading(false);
              }}
              title={media.alt || "SoundCloud audio"}
            />
          </div>
        );
      }
      
      // Handle Spotify URLs
      const spotifyData = extractSpotifyData(media.url);
      if (spotifyData) {
        let embedUrl = '';
        if (spotifyData.type === 'track') {
          embedUrl = `https://open.spotify.com/embed/track/${spotifyData.id}`;
        } else if (spotifyData.type === 'album') {
          embedUrl = `https://open.spotify.com/embed/album/${spotifyData.id}`;
        } else if (spotifyData.type === 'playlist') {
          embedUrl = `https://open.spotify.com/embed/playlist/${spotifyData.id}`;
        } else if (spotifyData.type === 'artist') {
          embedUrl = `https://open.spotify.com/embed/artist/${spotifyData.id}`;
        }
        
        if (embedUrl) {
          return (
            <div className={cn(
              "relative overflow-hidden border rounded-md",
              className
            )}>
              {isLoading && (
                <Skeleton className="h-[152px] w-full" />
              )}
              <iframe
                src={embedUrl}
                className="w-full border-0"
                height="152"
                onLoad={() => setIsLoading(false)}
                onError={() => {
                  setHasError(true);
                  setIsLoading(false);
                }}
                title={media.alt || "Spotify player"}
                allow="encrypted-media"
              />
            </div>
          );
        }
      }
      
      // Handle Twitter/X URLs
      const twitterData = extractTwitterData(media.url);
      if (twitterData && twitterData.tweetId) {
        return (
          <div className={cn(
            "border rounded-md overflow-hidden p-2 hover:bg-accent/50 transition-colors",
            className
          )}>
            <a 
              href={media.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-primary hover:underline"
            >
              <ExternalLink className="h-4 w-4" />
              <span className="text-sm">
                View tweet from @{twitterData.username || 'user'}
              </span>
            </a>
          </div>
        );
      }
      
      // Handle Cloudinary (fallback to image/video)
      const { id: cloudinaryId } = extractCloudinaryData(media.url) || {};
      if (cloudinaryId && media.url.includes('cloudinary.com')) {
        // Check if this is a Cloudinary video or image
        if (media.url.includes('/video/')) {
          return (
            <div className={cn(
              "relative overflow-hidden",
              getAspectRatioClass(),
              className
            )}>
              {isLoading && (
                <Skeleton className="absolute inset-0 z-10" />
              )}
              <video
                src={media.url}
                controls={controls}
                muted={muted}
                autoPlay={autoplay}
                loop={loop}
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
              />
            </div>
          );
        } else {
          // Default to image
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
      }
      
      // Default embed for unknown types
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
              className="flex items-center gap-2 text-primary hover:underline"
            >
              <ExternalLink className="h-4 w-4" />
              <span className="text-sm truncate">
                {media.alt || media.url}
              </span>
            </a>
          </div>
        </div>
      );
      
    default:
      return (
        <div className={cn(
          "p-3 border rounded-md",
          className
        )}>
          <a 
            href={media.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-primary hover:underline"
          >
            <ExternalLink className="h-4 w-4" />
            <span className="text-sm truncate">
              {media.alt || media.url}
            </span>
          </a>
        </div>
      );
  }
};

export default MediaRenderer;
