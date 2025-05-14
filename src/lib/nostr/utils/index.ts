
import { NostrEvent } from '@/lib/nostr';

/**
 * Extract the first image URL from a Nostr event's content
 */
export const getFirstImageUrlFromEvent = (event: NostrEvent | {content?: string}): string | null => {
  const content = event?.content || '';
  
  if (!content) return null;
  
  // Check for NIP-94 image tags first
  if (event && 'tags' in event && Array.isArray(event.tags)) {
    const imageTag = event.tags.find(tag => 
      Array.isArray(tag) && 
      tag.length >= 2 && 
      (tag[0] === 'image' || tag[0] === 'imeta') && 
      tag[1]?.match(/\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i)
    );
    
    if (imageTag && imageTag[1]) {
      return imageTag[1];
    }
  }
  
  // Simple regex to extract the first image URL from content
  const imgRegex = /(https?:\/\/\S+\.(jpg|jpeg|png|gif|webp)(\?[^\s]*)?)/i;
  const match = content.match(imgRegex);
  
  return match ? match[0] : null;
};

/**
 * Extract all image URLs from a Nostr event's content
 */
export const getImageUrlsFromEvent = (event: NostrEvent | {content?: string}): string[] => {
  const content = event?.content || '';
  
  if (!content) return [];
  
  const urls: string[] = [];
  
  // Check for NIP-94 image tags first
  if (event && 'tags' in event && Array.isArray(event.tags)) {
    event.tags.forEach(tag => {
      if (Array.isArray(tag) && 
          tag.length >= 2 && 
          (tag[0] === 'image' || tag[0] === 'imeta') && 
          tag[1]?.match(/\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i)) {
        urls.push(tag[1]);
      }
    });
  }
  
  // Extract image URLs from content
  const imgRegex = /(https?:\/\/\S+\.(jpg|jpeg|png|gif|webp)(\?[^\s]*)?)/gi;
  let match;
  
  while ((match = imgRegex.exec(content)) !== null) {
    if (match[0]) {
      urls.push(match[0]);
    }
  }
  
  // Return unique URLs
  return [...new Set(urls)];
};

// Export the functions needed by other files
export { getMediaUrlsFromEvent, isValidMediaUrl } from './media-extraction';

