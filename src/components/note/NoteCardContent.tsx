
import React, { useState, useMemo } from 'react';
import { contentFormatter } from '@/lib/nostr/format/content-formatter';
import { Button } from '@/components/ui/button';
import HashtagButton from './HashtagButton';
import { cn } from '@/lib/utils';
import { NostrEvent } from '@/lib/nostr';
import { getMediaItemsFromEvent, extractNip94Media } from '@/lib/nostr/utils/media-extraction';
import MediaGrid from '@/components/media/MediaGrid';
import { MediaItem } from '@/lib/nostr/utils/media/media-types';

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
  
  // Process content for rendering - pass the full event for better mention handling
  const formattedContent = contentFormatter.formatContent(displayContent, event);
  
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
  
  // Extract media using NIP-94 extraction function with improved logic
  const mediaItems = useMemo(() => {
    if (!event) return [];
    
    // First try to extract media using NIP-94 compliant extraction
    // This is the preferred and most standards-compliant method
    const nip94Media = extractNip94Media(event);
    if (nip94Media.length > 0) {
      return nip94Media;
    }
    
    // Fallback to standard media extraction
    const items = getMediaItemsFromEvent(event);
    
    // Filter out duplicates using a Set of normalized URLs
    const uniqueUrls = new Set();
    return items.filter(item => {
      // Normalize URL by removing query parameters for comparison
      const normalizedUrl = item.url.split('?')[0];
      if (!uniqueUrls.has(normalizedUrl)) {
        uniqueUrls.add(normalizedUrl);
        return true;
      }
      return false;
    });
  }, [event]);
  
  // Handle media click
  const handleMediaClick = (media: MediaItem, index: number) => {
    // Could implement a lightbox or media viewer here
    console.log('Media clicked:', media, index);
  };
  
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
      
      {/* Media rendering using NIP-94 compliant MediaGrid */}
      {mediaItems.length > 0 && (
        <MediaGrid 
          mediaItems={mediaItems}
          onMediaClick={handleMediaClick}
          maxItems={4}
          className="mt-3"
        />
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
