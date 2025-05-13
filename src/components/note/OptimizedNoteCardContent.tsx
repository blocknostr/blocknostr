
import React, { useState, memo } from 'react';
import { MessageSquare } from 'lucide-react';
import { contentFormatter } from '@/lib/nostr/format/content-formatter';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getMediaUrlsFromEvent } from '@/lib/nostr/utils';
import EnhancedMediaContent from '../media/EnhancedMediaContent';

interface NoteCardContentProps {
  content: string;
  tags?: string[][];
  reachCount?: number;
}

const OptimizedNoteCardContent = memo(({
  content,
  tags = [],
  reachCount
}: NoteCardContentProps) => {
  const [expanded, setExpanded] = useState(false);
  
  // Check if content is longer than 280 characters
  const isLong = content.length > 280;
  
  // Truncate content if necessary and not expanded
  const displayContent = (!expanded && isLong) 
    ? content.substring(0, 277) + '...' 
    : content;
  
  // Use the standardized utility to extract media URLs
  const mediaUrls = getMediaUrlsFromEvent({ content: displayContent, tags });
  
  // Process content for rendering, excluding image URLs
  const formattedContent = contentFormatter.formatContent(displayContent);
  
  // Find hashtags in the content
  const hashtags = tags
    .filter(tag => tag[0] === 't')
    .map(tag => tag[1]);
  
  return (
    <div className="mt-2">
      <div className="prose max-w-none dark:prose-invert text-sm">
        {formattedContent}
      </div>
      
      {/* Show more/less button - Moved above media content */}
      {isLong && (
        <Button 
          variant="link" 
          size="sm" 
          className="mt-1 mb-2 p-0 h-auto text-primary"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? 'Show less' : 'Show more'}
        </Button>
      )}
      
      {/* Render media with standardized component */}
      {mediaUrls.length > 0 && (
        <div className={cn(
          "mt-3 grid gap-2",
          mediaUrls.length > 1 ? "grid-cols-2" : "grid-cols-1"
        )}>
          {mediaUrls.slice(0, 4).map((url, index) => (
            <EnhancedMediaContent 
              key={`${url}-${index}`}
              url={url} 
              alt="Post image"
              index={index}
              totalItems={mediaUrls.length}
              variant="inline"
            />
          ))}
          {mediaUrls.length > 4 && (
            <div className="col-span-2 text-center text-sm text-muted-foreground mt-1">
              +{mediaUrls.length - 4} more media items
            </div>
          )}
        </div>
      )}
      
      {hashtags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {hashtags.map((tag, index) => (
            <span 
              key={index}
              className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground hover:text-primary cursor-pointer"
            >
              #{tag}
            </span>
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
}, (prevProps, nextProps) => {
  // Only re-render if essential props change
  return (
    prevProps.content === nextProps.content &&
    prevProps.reachCount === nextProps.reachCount
  );
});

OptimizedNoteCardContent.displayName = 'OptimizedNoteCardContent';

export default OptimizedNoteCardContent;
