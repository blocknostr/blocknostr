
import React, { useState, useMemo, useRef } from 'react';
import { contentFormatter } from '@/lib/nostr/format/content-formatter';
import { Button } from '@/components/ui/button';
import HashtagButton from './HashtagButton';
import { cn } from '@/lib/utils';
import { NostrEvent } from '@/lib/nostr';
import { getMediaItemsFromEvent } from '@/lib/nostr/utils/media-extraction';

interface NoteCardContentProps {
  content?: string;
  tags?: string[][];
  reachCount?: number;
  event?: NostrEvent;
}

const NoteCardContent: React.FC<NoteCardContentProps> = ({
  content,
  tags = [],
  reachCount,
  event
}) => {
  // Use content from props or from event if provided
  const contentToUse = content || event?.content || '';
  // Use tags from props or from event if provided, ensure it's an array
  const tagsToUse = Array.isArray(tags) && tags.length > 0 ? tags : (Array.isArray(event?.tags) ? event?.tags : []);
  
  const [expanded, setExpanded] = useState(false);
  const [imagesLoaded, setImagesLoaded] = useState<Record<string, boolean>>({});
  
  // Check if content is longer than 280 characters
  const isLong = contentToUse.length > 280;
  
  // Truncate content if necessary and not expanded
  const displayContent = (!expanded && isLong) 
    ? contentToUse.substring(0, 277) + '...' 
    : contentToUse;
  
  // Process content for rendering
  const formattedContent = contentFormatter.formatContent(displayContent);
  
  // Extract hashtags from tags array
  const hashtags = useMemo(() => {
    if (!Array.isArray(tagsToUse)) return [];
    
    return tagsToUse
      .filter(tag => Array.isArray(tag) && tag.length >= 2 && tag[0] === 't')
      .map(tag => tag[1]);
  }, [tagsToUse]);
  
  // Handle hashtag click
  const handleHashtagClick = (e: React.MouseEvent, tag: string) => {
    e.stopPropagation();
    // Dispatch custom event to be caught by parent components
    window.dispatchEvent(new CustomEvent('hashtag-clicked', { detail: tag }));
  };
  
  // Extract media items from the event with optimized approach
  const mediaItems = useMemo(() => {
    if (!event) return [];
    return getMediaItemsFromEvent(event);
  }, [event]);
  
  // Image loading handler
  const handleImageLoaded = (url: string) => {
    setImagesLoaded(prev => ({...prev, [url]: true}));
  };
  
  // Filter out only images
  const imageUrls = useMemo(() => {
    return mediaItems
      .filter(item => item.type === 'image')
      .map(item => item.url)
      .slice(0, 4); // Limit to 4 images max
  }, [mediaItems]);

  return (
    <div className="mt-2">
      <div className="prose max-w-none dark:prose-invert text-sm">
        {formattedContent}
      </div>
      
      {/* Show more/less button */}
      {isLong && (
        <Button 
          variant="link" 
          size="sm" 
          className="mt-1 mb-2 p-0 h-auto text-primary"
          onClick={(e) => {
            e.stopPropagation();
            setExpanded(!expanded);
          }}
        >
          {expanded ? 'Show less' : 'Show more'}
        </Button>
      )}
      
      {/* Optimized image rendering with lazy loading */}
      {imageUrls.length > 0 && (
        <div className={cn(
          "mt-3 grid gap-2",
          imageUrls.length > 1 ? "grid-cols-2" : "grid-cols-1"
        )}>
          {imageUrls.map((url, index) => (
            <div key={`${index}-${url.substring(0, 10)}`} 
              className="relative aspect-square overflow-hidden rounded-md border border-border/10">
              <div className={cn(
                "h-full w-full bg-muted/30",
                imagesLoaded[url] ? "hidden" : "flex items-center justify-center"
              )}>
                <span className="h-4 w-4 rounded-full bg-muted/50 animate-pulse"></span>
              </div>
              <img 
                src={url} 
                alt={`Media content ${index + 1}`} 
                className={cn(
                  "h-full w-full object-cover transition-opacity",
                  imagesLoaded[url] ? "opacity-100" : "opacity-0"
                )}
                loading="lazy"
                onLoad={() => handleImageLoaded(url)}
                decoding="async"
              />
            </div>
          ))}
        </div>
      )}
      
      {/* Hashtags section */}
      {hashtags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {hashtags.map((tag, index) => (
            <HashtagButton
              key={index}
              tag={tag}
              onClick={handleHashtagClick}
              variant="small"
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default React.memo(NoteCardContent);
