
import { NostrEvent } from '@/lib/nostr';
import { mediaRegex, extractUrlsFromContent } from './media/media-detection';
import { isValidMediaUrl } from './media/media-validation';

/**
 * Extract media URLs from a Nostr event
 * Following NIP-94 recommendations for media content
 */
export const getMediaUrlsFromEvent = (event: NostrEvent | {content?: string, tags?: string[][]}): string[] => {
  const content = event?.content || '';
  const tags = Array.isArray(event?.tags) ? event.tags : [];
  
  // Store unique URLs to avoid duplicates
  const uniqueUrls = new Set<string>();
  
  // First check for NIP-94 image tags
  if (Array.isArray(tags)) {
    tags.forEach(tag => {
      if (Array.isArray(tag) && 
          tag.length >= 2 && 
          (tag[0] === 'image' || tag[0] === 'img' || tag[0] === 'imeta') && 
          isValidMediaUrl(tag[1])) {
        uniqueUrls.add(tag[1]);
      }
    });
  }
  
  // Then extract URLs from content
  const contentUrls = extractUrlsFromContent(content);
  contentUrls.forEach(url => uniqueUrls.add(url));
  
  return Array.from(uniqueUrls);
};

/**
 * Extract the first image URL from a Nostr event
 */
export const getFirstImageUrlFromEvent = (event: NostrEvent | {content?: string, tags?: string[][]}): string | null => {
  // Check for NIP-94 image tags first
  const tags = Array.isArray(event?.tags) ? event.tags : [];
  
  for (const tag of tags) {
    if (Array.isArray(tag) && 
        tag.length >= 2 && 
        (tag[0] === 'image' || tag[0] === 'img' || tag[0] === 'imeta') && 
        isValidMediaUrl(tag[1])) {
      return tag[1];
    }
  }
  
  // Then check content
  const content = event?.content || '';
  if (!content) return null;
  
  // Simple regex to extract the first image URL from content
  const imgRegex = /(https?:\/\/\S+\.(jpg|jpeg|png|gif|webp)(\?[^\s]*)?)/i;
  const match = content.match(imgRegex);
  
  return match ? match[0] : null;
};

/**
 * Extract image URLs from a Nostr event
 */
export const getImageUrlsFromEvent = (event: NostrEvent | {content?: string, tags?: string[][]}): string[] => {
  const mediaUrls = getMediaUrlsFromEvent(event);
  return mediaUrls.filter(url => {
    return url.match(/\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i);
  });
};

/**
 * Get media items with metadata from event
 */
export interface MediaItem {
  url: string;
  type: 'image' | 'video' | 'audio' | 'unknown';
  alt?: string;
}

export const getMediaItemsFromEvent = (event: NostrEvent | {content?: string, tags?: string[][]}): MediaItem[] => {
  const urls = getMediaUrlsFromEvent(event);
  const tags = Array.isArray(event?.tags) ? event.tags : [];
  
  // Map URLs to media items
  return urls.map(url => {
    // Determine media type based on URL extension
    let type: MediaItem['type'] = 'unknown';
    if (url.match(/\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i)) {
      type = 'image';
    } else if (url.match(/\.(mp4|webm|mov)(\?.*)?$/i)) {
      type = 'video';
    } else if (url.match(/\.(mp3|wav|ogg)(\?.*)?$/i)) {
      type = 'audio';
    }
    
    // Check for alt text in image tags
    let alt: string | undefined;
    const imgTag = tags.find(tag => 
      Array.isArray(tag) && 
      tag.length >= 3 && 
      (tag[0] === 'image' || tag[0] === 'img' || tag[0] === 'imeta') && 
      tag[1] === url
    );
    
    if (imgTag && imgTag.length >= 3) {
      alt = imgTag[2];
    }
    
    return { url, type, alt };
  });
};

/**
 * Extract the first media URL from an event
 */
export const extractFirstImageUrl = (content: string): string | null => {
  if (!content) return null;
  
  const imgRegex = /(https?:\/\/\S+\.(jpg|jpeg|png|gif|webp)(\?[^\s]*)?)/i;
  const match = content.match(imgRegex);
  
  return match ? match[0] : null;
};

/**
 * Extract all media URLs from content
 */
export const extractMediaUrls = (content: string): string[] => {
  return extractUrlsFromContent(content);
};

export { isValidMediaUrl, isImageUrl, isVideoUrl } from './media/media-validation';

