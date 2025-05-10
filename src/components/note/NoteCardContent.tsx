
import { useState, useEffect } from 'react';
import { Badge } from "@/components/ui/badge";
import MediaPreview from '../MediaPreview';

interface NoteCardContentProps {
  content: string;
}

const NoteCardContent = ({ content }: NoteCardContentProps) => {
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [hashtags, setHashtags] = useState<string[]>([]);
  
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

  // Format content to highlight hashtags
  const renderFormattedContent = () => {
    if (!content) return null;
    
    // Replace URLs with a placeholder to avoid rendering them twice
    let formattedContent = content;
    mediaUrls.forEach(url => {
      formattedContent = formattedContent.replace(url, '');
    });

    // Replace hashtags with styled spans
    return formattedContent.split(/(#\w+)/g).map((part, index) => {
      if (part.startsWith('#')) {
        const tag = part.substring(1);
        return (
          <span key={index} className="text-primary font-medium hover:underline cursor-pointer">
            {part}
          </span>
        );
      }
      return part;
    });
  };

  return (
    <div>
      <p className="mt-1 whitespace-pre-wrap break-words">{renderFormattedContent()}</p>
      
      {/* Display hashtags as badges if they're not already shown in the content */}
      {hashtags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {hashtags.map((tag, index) => (
            <Badge key={index} variant="secondary" className="text-xs">
              #{tag}
            </Badge>
          ))}
        </div>
      )}
      
      {/* Display media content */}
      {mediaUrls.length > 0 && (
        <div className="space-y-2">
          {mediaUrls.map((url, index) => (
            <MediaPreview key={index} url={url} alt={`Media attachment ${index + 1}`} />
          ))}
        </div>
      )}
    </div>
  );
};

export default NoteCardContent;
