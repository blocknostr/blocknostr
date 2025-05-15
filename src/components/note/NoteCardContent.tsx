
import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import HashtagButton from './HashtagButton';
import { cn } from '@/lib/utils';
import { NostrEvent } from '@/lib/nostr';
import { lightweightFormatter, useFormattedContent } from '@/lib/nostr/format/lightweight-formatter';
import { extractMediaUrls } from '@/lib/nostr/utils/media-extraction';

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
  
  // Check if content is longer than 280 characters
  const isLong = contentToUse.length > 280;
  
  // Truncate content if necessary and not expanded
  const displayContent = (!expanded && isLong) 
    ? contentToUse.substring(0, 277) + '...' 
    : contentToUse;
  
  // Extract media URLs for optimized rendering
  const mediaUrls = useMemo(() => {
    return extractMediaUrls(contentToUse);
  }, [contentToUse]);
  
  // Use memoized formatted content
  const formattedContent = useFormattedContent(displayContent, mediaUrls);
  
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
  
  // Extract image URLs - optimized approach
  const imageUrls = useMemo(() => {
    return extractMediaUrls(contentToUse).filter(url => 
      url.match(/\.(jpg|jpeg|png|gif|webp)(\?[^\s]*)?$/i)
    );
  }, [contentToUse]);
  
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
      
      {/* Simple image rendering */}
      {imageUrls.length > 0 && (
        <div className={cn(
          "mt-3 grid gap-2",
          imageUrls.length > 1 ? "grid-cols-2" : "grid-cols-1"
        )}>
          {imageUrls.slice(0, 4).map((url, index) => (
            <div key={`${index}`} className="relative aspect-square overflow-hidden rounded-md border border-border/10">
              <img 
                src={url} 
                alt="Media content" 
                className="h-full w-full object-cover"
                loading="lazy"
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

export default NoteCardContent;
