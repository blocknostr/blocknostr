import { useState, useEffect } from 'react';
import { Badge } from "@/components/ui/badge";
import MediaPreview from '../MediaPreview';
import { Button } from '@/components/ui/button';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { contentFormatter } from '@/lib/nostr/format';

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
    // Extract media URLs from content more effectively - support more formats
    const extractMediaUrls = () => {
      // Look for standard image and video file extensions
      const mediaRegex = /(https?:\/\/[^\s]+\.(jpg|jpeg|png|gif|webp|mp4|webm|ogg|mov))/gi;
      const urls = content.match(mediaRegex) || [];
      
      // Also check for common image hosting services that might not have explicit extensions
      const hostingServiceRegex = /(https?:\/\/(?:i\.imgur\.com|i\.redd\.it|pbs\.twimg\.com|media\.tenor\.com|gfycat\.com|imgur\.com|giphy\.com|tenor\.com)[^\s]+)/gi;
      const serviceUrls = content.match(hostingServiceRegex) || [];
      
      // Combine and remove duplicates
      const allUrls = Array.from(new Set([...urls, ...serviceUrls]));
      
      // Also look in the tags for tagged media (Nostr nip-10)
      if (Array.isArray(tags)) {
        tags.forEach(tag => {
          if (Array.isArray(tag) && (tag[0] === 'image' || tag[0] === 'media') && tag.length > 1) {
            // Check if it's a valid URL
            try {
              new URL(tag[1]);
              allUrls.push(tag[1]);
            } catch {}
          }
        });
      }
      
      return allUrls;
    };

    // Extract hashtags from content and tags
    const extractHashtags = () => {
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
      return Array.from(new Set([...contentTags, ...tagTags]));
    };
    
    setMediaUrls(extractMediaUrls());
    setHashtags(extractHashtags());
  }, [content, tags]);

  return (
    <div className="mt-3">
      <div className="whitespace-pre-wrap break-words text-[15px] md:text-base leading-relaxed">
        {/* Pass mediaUrls to the formatter so it can hide them in the content */}
        {contentFormatter.formatContent(displayContent, mediaUrls)}
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
      
      {/* Display hashtags as badges if any exist */}
      {hashtags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {hashtags.map((tag, index) => (
            <Badge key={index} variant="secondary" className="text-xs bg-primary/10 text-primary hover:bg-primary/20">
              #{tag}
            </Badge>
          ))}
        </div>
      )}
      
      {/* Display media content with our improved carousel */}
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
