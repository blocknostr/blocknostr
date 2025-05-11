
import { FormattedSegment } from '../types';

export class SegmentParser {
  /**
   * Parse content and split into segments for formatting
   */
  parseContent(content: string, mediaUrls: string[] = []): FormattedSegment[] {
    const segments: FormattedSegment[] = [];
    
    // Regular expressions for different content types
    const mentionRegex = /(nostr:npub[a-z0-9]{59,60})/g;
    const hashtagRegex = /#(\w+)/g;
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    
    // Media regex patterns to identify media URLs
    const mediaExtensionRegex = /\.(jpg|jpeg|png|gif|webp|mp4|webm|ogg|mov)($|\?)/i;
    const mediaHostRegex = /(i\.imgur\.com|i\.redd\.it|pbs\.twimg\.com|media\.tenor\.com|gfycat\.com|imgur\.com|giphy\.com|tenor\.com)/i;
    
    // Function to check if a URL is a media URL
    const isMediaUrl = (url: string): boolean => {
      // Check if URL is in the provided media URLs array
      if (mediaUrls.some(mediaUrl => url.includes(mediaUrl))) {
        return true;
      }
      
      // Check if URL has a media extension
      if (mediaExtensionRegex.test(url)) {
        return true;
      }
      
      // Check if URL is from a common media hosting service
      if (mediaHostRegex.test(url)) {
        return true;
      }
      
      return false;
    };
    
    // Combine all regex patterns
    const combinedPattern = new RegExp(
      `${mentionRegex.source}|${hashtagRegex.source}|${urlRegex.source}`,
      'g'
    );
    
    // Split the content based on matches
    let lastIndex = 0;
    let match;
    
    while ((match = combinedPattern.exec(content)) !== null) {
      const matchedString = match[0];
      const startIndex = match.index;
      
      // Add text before the match
      if (startIndex > lastIndex) {
        segments.push({
          type: 'text',
          content: content.slice(lastIndex, startIndex)
        });
      }
      
      // Determine the type of match and add it
      if (mentionRegex.test(matchedString)) {
        segments.push({
          type: 'mention',
          content: matchedString,
          data: matchedString.replace('nostr:', '')
        });
      } else if (hashtagRegex.test(matchedString)) {
        segments.push({
          type: 'hashtag',
          content: matchedString,
          data: matchedString.substring(1) // Remove # symbol
        });
      } else if (urlRegex.test(matchedString)) {
        // Check if this is a media URL that should be hidden from the text
        if (isMediaUrl(matchedString)) {
          segments.push({
            type: 'media-url',
            content: matchedString,
            data: matchedString,
            shouldRender: false // Don't render media URLs in the text content
          });
        } else {
          segments.push({
            type: 'url',
            content: matchedString,
            data: matchedString
          });
        }
      }
      
      lastIndex = startIndex + matchedString.length;
    }
    
    // Add remaining text
    if (lastIndex < content.length) {
      segments.push({
        type: 'text',
        content: content.slice(lastIndex)
      });
    }
    
    return segments;
  }
}

export const segmentParser = new SegmentParser();
