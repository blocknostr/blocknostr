
import { useState, useEffect } from 'react';
import { Badge } from "@/components/ui/badge";
import MediaPreview from '../MediaPreview';
import { Button } from '@/components/ui/button';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { contentFormatter } from '@/lib/nostr/format/content-formatter';

interface NoteCardContentProps {
  content: string;
  reachCount?: number;
  tags?: string[][];
}

const NoteCardContent = ({ content, reachCount = 0, tags = [] }: NoteCardContentProps) => {
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const isMobile = useIsMobile();
  
  const CHARACTER_LIMIT = 280;
  const shouldTruncate = content.length > CHARACTER_LIMIT;
  const displayContent = isExpanded ? content : shouldTruncate ? content.slice(0, CHARACTER_LIMIT) : content;
  
  useEffect(() => {
    // Extract URLs from content - look for media file extensions
    const urlRegex = /(https?:\/\/[^\s]+\.(jpg|jpeg|png|gif|webp|mp4|webm|ogg|mov))/gi;
    const urls = content.match(urlRegex) || [];
    setMediaUrls(urls);

    // Extract hashtags from content and tags
    const hashtagRegex = /#(\w+)/g;
    const contentTags: string[] = [];
    let match;
    
    while ((match = hashtagRegex.exec(content)) !== null) {
      contentTags.push(match[1]);
    }
    
    // Also extract hashtags from 't' tags (NIP-10)
    const tagTags = Array.isArray(tags) 
      ? tags.filter(tag => Array.isArray(tag) && tag[0] === 't' && tag.length >= 2)
          .map(tag => tag[1])
      : [];
      
    // Combine both sources and remove duplicates
    setHashtags(Array.from(new Set([...contentTags, ...tagTags])));
  }, [content, tags]);

  return (
    <div className="mt-3">
      <div className="whitespace-pre-wrap break-words text-[15px] md:text-base leading-relaxed">
        {/* Use the content formatter for NIP-27 support */}
        {contentFormatter.formatContent(displayContent)}
      </div>
      
      {shouldTruncate && (
        <Button 
          variant="link" 
          size="sm" 
          onClick={(e) => {
            e.preventDefault(); 
            setIsExpanded(!isExpanded);
          }} 
          className="text-[#0EA5E9] hover:text-[#0EA5E9]/80 p-0 h-auto mt-1 font-medium flex items-center gap-1"
        >
          {isExpanded ? (
            <>
              <ArrowUp size={16} /> Show less
            </>
          ) : (
            <>
              <ArrowDown size={16} /> Show more
            </>
          )}
        </Button>
      )}
      
      {/* Display hashtags as badges if more than 1 */}
      {hashtags.length > 1 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {hashtags.map((tag, index) => (
            <Badge key={index} variant="secondary" className="text-xs bg-primary/10 text-primary hover:bg-primary/20">
              #{tag}
            </Badge>
          ))}
        </div>
      )}
      
      {/* Display media content */}
      {mediaUrls.length > 0 && (
        <div className="space-y-2 mt-3">
          <MediaPreview url={mediaUrls} alt="Media attachments" />
        </div>
      )}
      
      {/* Post Reach information */}
      {reachCount > 0 && (
        <div className="flex items-center mt-2 text-xs text-muted-foreground">
          <span>{reachCount.toLocaleString()} views</span>
        </div>
      )}
    </div>
  );
};

export default NoteCardContent;
