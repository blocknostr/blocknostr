
import { useState, useEffect } from 'react';
import { Badge } from "@/components/ui/badge";
import MediaPreview from '../MediaPreview';
import { Button } from '@/components/ui/button';
import { ArrowDown, ArrowUp, Eye } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface NoteCardContentProps {
  content: string;
  reachCount?: number;
}

const NoteCardContent = ({ content, reachCount = 0 }: NoteCardContentProps) => {
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const isMobile = useIsMobile();
  
  const CHARACTER_LIMIT = 280;
  const shouldTruncate = content.length > CHARACTER_LIMIT;
  const displayContent = isExpanded ? content : shouldTruncate ? content.slice(0, CHARACTER_LIMIT) : content;
  
  useEffect(() => {
    // Extract URLs from content
    const urlRegex = /(https?:\/\/[^\s]+\.(jpg|jpeg|png|gif|webp|mp4|webm|ogg|mov))/gi;
    const urls = content.match(urlRegex) || [];
    setMediaUrls(urls);

    // Extract hashtags from content
    const hashtagRegex = /#(\w+)/g;
    const tags: string[] = [];
    let match;
    while ((match = hashtagRegex.exec(content)) !== null) {
      tags.push(match[1]);
    }
    setHashtags(tags);
  }, [content]);

  // Format content to highlight hashtags and links
  const renderFormattedContent = () => {
    if (!displayContent) return null;
    
    // Replace URLs with a placeholder to avoid rendering them twice
    let formattedContent = displayContent;
    mediaUrls.forEach(url => {
      formattedContent = formattedContent.replace(url, '');
    });

    // Split by hashtags and URLs
    return formattedContent.split(/(#\w+)|(https?:\/\/\S+)/g).map((part, index) => {
      if (!part) return null;
      
      if (part.startsWith('#')) {
        const tag = part.substring(1);
        return (
          <span key={index} className="text-primary font-medium hover:underline cursor-pointer">
            {part}
          </span>
        );
      } else if (part.startsWith('http')) {
        // Don't include media URLs that we'll render separately
        if (!mediaUrls.includes(part)) {
          return (
            <a 
              key={index} 
              href={part} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-[#0EA5E9] hover:underline"
              onClick={e => e.stopPropagation()}
            >
              {part}
            </a>
          );
        }
        return null;
      }
      return part;
    });
  };

  return (
    <div className="mt-3">
      <p className="whitespace-pre-wrap break-words text-[15px] md:text-base leading-relaxed">{renderFormattedContent()}</p>
      
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
      
      {/* Post Reach information */}
      <div className="flex items-center mt-2 text-xs text-muted-foreground">
        <Eye className="h-3.5 w-3.5 mr-1" />
        <span>{reachCount.toLocaleString()} views</span>
      </div>
      
      {/* Display media content */}
      {mediaUrls.length > 0 && (
        <div className="space-y-2 mt-3 rounded-md overflow-hidden">
          {mediaUrls.map((url, index) => (
            <MediaPreview 
              key={index} 
              url={url} 
              alt={`Media attachment ${index + 1}`} 
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default NoteCardContent;
