
import React, { useState, useMemo } from 'react';
import { MessageSquare } from 'lucide-react';
import { contentFormatter } from '@/lib/nostr/format/content-formatter';
import { Button } from '@/components/ui/button';
import HashtagButton from './HashtagButton';
import EnhancedMediaContent from '../media/EnhancedMediaContent';
import { cn } from '@/lib/utils';
import { NostrEvent } from '@/lib/nostr';
import { extractMediaUrls } from '@/lib/nostr/utils';

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
  
  // Process content for rendering
  const formattedContent = contentFormatter.formatContent(displayContent);
  
  // Extract hashtags from tags array - add null safety checks
  const hashtags = useMemo(() => {
    if (!Array.isArray(tagsToUse)) return [];
    
    return tagsToUse
      .filter(tag => Array.isArray(tag) && tag.length >= 2 && tag[0] === 't')
      .map(tag => tag[1]);
  }, [tagsToUse]);
  
  // Extract media URLs from content and tags using our utility
  const mediaUrls = useMemo(() => {
    return extractMediaUrls(contentToUse, tagsToUse);
  }, [contentToUse, tagsToUse]);
  
  return (
    <div>
      <div className="prose dark:prose-invert max-w-none text-sm">
        <div className="whitespace-pre-wrap break-words" dangerouslySetInnerHTML={{ __html: formattedContent }} />
      </div>
      
      {/* Media preview section */}
      {mediaUrls && mediaUrls.length > 0 && (
        <div className={cn(
          "mt-3 grid gap-2",
          mediaUrls.length > 1 ? "grid-cols-2" : "grid-cols-1"
        )}>
          {mediaUrls.slice(0, 4).map((url, index) => (
            <EnhancedMediaContent 
              key={`${url}-${index}`}
              url={url}
              alt={`Media ${index + 1}`}
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
      
      {/* Show more/less button */}
      {isLong && (
        <Button 
          variant="link" 
          size="sm" 
          className="mt-1 p-0 h-auto text-primary"
          onClick={(e) => {
            e.stopPropagation();
            setExpanded(!expanded);
          }}
        >
          {expanded ? 'Show less' : 'Show more'}
        </Button>
      )}
      
      {/* Hashtags section */}
      {hashtags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {hashtags.map((tag, index) => (
            <HashtagButton
              key={index}
              tag={tag}
              onClick={(e, tag) => {
                e.stopPropagation();
                window.dispatchEvent(new CustomEvent('set-hashtag', { detail: tag }));
              }}
              variant="small"
            />
          ))}
        </div>
      )}
      
      {/* View count */}
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
