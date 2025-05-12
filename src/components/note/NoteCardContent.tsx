
import React, { useState } from 'react';
import { MessageSquare, ExternalLink } from 'lucide-react';
import { contentFormatter } from '@/lib/nostr/format/content-formatter';
import { Button } from '@/components/ui/button';
import { formatRelativeTime } from '@/lib/utils';

interface NoteCardContentProps {
  content: string;
  tags?: string[][];
  reachCount?: number;
}

const NoteCardContent: React.FC<NoteCardContentProps> = ({
  content,
  tags = [],
  reachCount
}) => {
  const [expanded, setExpanded] = useState(false);
  
  // Check if content is longer than 280 characters
  const isLong = content.length > 280;
  
  // Truncate content if necessary and not expanded
  const displayContent = (!expanded && isLong) 
    ? content.substring(0, 277) + '...' 
    : content;
  
  // Process content for rendering
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
};

export default NoteCardContent;
