
import React, { useState, useMemo } from 'react';
import { MessageSquare } from 'lucide-react';
import { contentFormatter } from '@/lib/nostr/format/content-formatter';
import { Button } from '@/components/ui/button';
import HashtagButton from './HashtagButton';
import EnhancedMediaContent from '../media/EnhancedMediaContent';
import { cn } from '@/lib/utils';
import { NostrEvent } from '@/lib/nostr';

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
  // Use tags from props or from event if provided
  const tagsToUse = tags.length > 0 ? tags : (event?.tags || []);
  
  const [expanded, setExpanded] = useState(false);
  
  // Check if content is longer than 280 characters
  const isLong = contentToUse.length > 280;
  
  // Truncate content if necessary and not expanded
  const displayContent = (!expanded && isLong) 
    ? contentToUse.substring(0, 277) + '...' 
    : contentToUse;
  
  // Process content for rendering
  const formattedContent = contentFormatter.formatContent(displayContent);
  
  // Extract hashtags from tags array
  const hashtags = tagsToUse
    .filter(tag => tag[0] === 't')
    .map(tag => tag[1]);
  
  // Extract media URLs from content and tags
  const mediaUrls = useMemo(() => {
    const urlsFromContent: string[] = [];
    const mediaRegex = /(https?:\/\/[^\s]+\.(jpg|jpeg|png|gif|webp|mp4|webm|mov)(\?[^\s]*)?)/gi;
    let match;
    
    // Extract from content
    while ((match = mediaRegex.exec(contentToUse)) !== null) {
      urlsFromContent.push(match[0]);
    }
    
    // Extract from tags
    const urlsFromTags = tagsToUse
      .filter(tag => tag[0] === 'media' || tag[0] === 'image' || tag[0] === 'r')
      .map(tag => tag[1])
      .filter(url => url.match(/\.(jpg|jpeg|png|gif|webp|mp4|webm|mov)(\?.*)?$/i));
    
    // Combine and deduplicate URLs
    return [...new Set([...urlsFromContent, ...urlsFromTags])];
  }, [contentToUse, tagsToUse]);
  
  // Handle hashtag click
  const handleHashtagClick = (tag: string) => {
    // Dispatch custom event to be caught by parent components
    window.dispatchEvent(new CustomEvent('hashtag-clicked', { detail: tag }));
  };
  
  return (
    <div className="mt-2">
      <div className="prose max-w-none dark:prose-invert text-sm">
        {formattedContent}
      </div>
      
      {/* Media preview section */}
      {mediaUrls.length > 0 && (
        <div className={cn(
          "mt-3 grid gap-2",
          mediaUrls.length > 1 ? "grid-cols-2" : "grid-cols-1"
        )}>
          {mediaUrls.slice(0, 4).map((url, index) => (
            <EnhancedMediaContent 
              key={`${url}-${index}`}
              url={url}
              alt={`Post media ${index + 1}`}
              index={index}
              totalItems={mediaUrls.length}
            />
          ))}
          {mediaUrls.length > 4 && (
            <div className="col-span-2 text-center text-sm text-muted-foreground mt-1">
              +{mediaUrls.length - 4} more media items
            </div>
          )}
        </div>
      )}
      
      {isLong && (
        <Button 
          variant="link" 
          size="sm" 
          className="mt-1 p-0 h-auto text-primary"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? 'Show less' : 'Show more'}
        </Button>
      )}
      
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
      
      {reachCount !== undefined && (
        <div className="mt-2 text-xs text-muted-foreground">
          <MessageSquare className="inline mr-1 h-3 w-3" />
          {reachCount.toLocaleString()} views
        </div>
      )}
    </div>
  );
};

export default NoteCardContent;
