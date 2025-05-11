
import { useState, useEffect } from 'react';

export const useHashtagDetector = (content: string) => {
  const [detectedHashtags, setDetectedHashtags] = useState<string[]>([]);
  
  useEffect(() => {
    // Extract hashtags from the content
    const regex = /#(\w+)/g;
    const matches = content.match(regex);
    
    if (matches) {
      // Remove the # symbol and get unique hashtags
      const tags = [...new Set(matches.map(tag => tag.substring(1)))];
      setDetectedHashtags(tags);
    } else {
      setDetectedHashtags([]);
    }
  }, [content]);
  
  return detectedHashtags;
};
